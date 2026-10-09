import { Body, Controller, Get, HttpCode, HttpStatus, Inject, InternalServerErrorException, Post, Req, Res, UnauthorizedException, UseGuards } from '@nestjs/common';
import { AUTH_SERVICE } from 'src/core/tokens/service.token';
import { EmailDto, LoginPayloadDto, OtpVerifyPayloadDto, RegisterPayloadDto } from 'src/modules/auth/dtos/register.dto';
import { AccessTokenGuard } from 'src/core/guards/access-token.guard';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { Public } from 'src/core/decorators/public.decorator';

import type { Request, Response } from 'express';
import type { IResponse } from 'src/core/common/interface';
import type { IAuthService } from 'src/modules/auth/services/interface/auth-service.interface';
import type { IClientUserResponse } from 'src/core/interfaces/user.interface';
import { SuccessMessagesEnum } from 'src/core/enums/success.enum';
import { ErrorMessagesEnum } from 'src/core/enums/errors.enum';
import { AppConstants } from 'src/core/common/constants';

@Controller('auth')
export class AuthController {

    constructor(
        @Inject(AUTH_SERVICE)
        private readonly _authService: IAuthService
    ) { }

    private _cookieOptions() {
        const isProduction = process.env.NODE_ENV === 'production';
        const configuredSameSite = process.env.COOKIE_SAME_SITE ?? 'strict';
        if (!['strict', 'lax', 'none'].includes(configuredSameSite)) {
            throw new Error('COOKIE_SAME_SITE must be strict, lax, or none');
        }
        if (configuredSameSite === 'none' && !isProduction) {
            throw new Error('COOKIE_SAME_SITE=none requires production HTTPS');
        }

        return {
            httpOnly: true,
            secure: isProduction,
            sameSite: configuredSameSite as 'strict' | 'lax' | 'none',
            path: '/',
        };
    }

    private async _setTokensToCookie(id: number, email: string, res: Response): Promise<void> {
        const options = this._cookieOptions();
        const { token: refresh, jti } = await this._authService.generateRefreshTokenWithJti(id, email);
        const access = this._authService.generateAccessToken(id, email, jti);

        res.cookie(AppConstants.accessTokenName, access, options);
        res.cookie(AppConstants.refreshTokenName, refresh, options);
    }

    @Public()
    @Post('register')
    async createAccount(@Body() registerPayload: RegisterPayloadDto, @Res({ passthrough: true }) res: Response): Promise<IResponse<IClientUserResponse>> {
        const response = await this._authService.registerAccount(registerPayload);

        const user = response?.data;

        if (!user) {
            throw new InternalServerErrorException('User was not returned after registration');
        }

        if (response.status === 'success') {
            await this._setTokensToCookie(Number(user.id), user.email, res);
        }

        return response;
    }

    @Public()
    @Post('send-otp')
    async sendOtp(@Body() { email }: EmailDto): Promise<IResponse> {
        return await this._authService.sendOtp(email);
    }

    @Public()
    @Post('verify-otp')
    async verifyOtp(@Body() otpVerifyPayload: OtpVerifyPayloadDto): Promise<IResponse> {
        return await this._authService.veryfyOtp(otpVerifyPayload);
    }

    @Public()
    @Post('login')
    async userLogin(@Body() loginPayload: LoginPayloadDto, @Res({ passthrough: true }) res: Response): Promise<IResponse<IClientUserResponse>> {
        const response = await this._authService.validateLoginPayload(loginPayload);

        const user = response?.data;

        if (!user) {
            throw new InternalServerErrorException('User was not returned after registration');
        }

        if (response.status === 'success') {
            await this._setTokensToCookie(Number(user.id), user.email, res);
        }

        return response;
    }

    @Get('me')
    @UseGuards(AccessTokenGuard)
    async getCurrentUser(@CurrentUser('sub') userId: string): Promise<IResponse<IClientUserResponse>> {
        return this._authService.getCurrentUser(Number(userId));
    }

    @Public()
    @Post('logout')
    @HttpCode(HttpStatus.OK)
    async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<IResponse<null>> {

        const cookieOptions = this._cookieOptions();

        res.clearCookie(AppConstants.accessTokenName, cookieOptions);
        res.clearCookie(AppConstants.refreshTokenName, cookieOptions);

        await this._authService.logout(req.cookies?.[AppConstants.refreshTokenName]);

        return {
            status: 'success',
            message: SuccessMessagesEnum.LogoutSuccess,
            data: null,
        };
    }

    @Public()
    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response,): Promise<IResponse> {
        const refreshToken = req.cookies?.[AppConstants.refreshTokenName];

        if (!refreshToken) {
            throw new UnauthorizedException(
                ErrorMessagesEnum.InvalidRefreshToken,
            );
        }

        const tokens = await this._authService.refreshAccessToken(refreshToken);
        const options = this._cookieOptions();

        res.cookie(AppConstants.accessTokenName, tokens.accessToken, options);
        res.cookie(AppConstants.refreshTokenName, tokens.refreshToken, options);

        return {
            status: 'success',
            message: 'Access token refreshed successfully',
            data: null,
        };
    }
}
