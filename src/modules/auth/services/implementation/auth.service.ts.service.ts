import { ConflictException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ErrorMessagesEnum } from 'src/core/enums/errors.enum';
import { USER_REPOSITORY } from 'src/core/tokens/repository.token';
import { ACCESS_TOKEN_UTILITY, HASH_UTILITY, REFRESH_TOKEN_UTILITY } from 'src/core/tokens/utility.token';
import { SuccessMessagesEnum } from 'src/core/enums/success.enum';
import { EMAIL_SERVICE, OTP_SERVICE } from 'src/core/tokens/service.token';
import { LoginPayloadDto, OtpVerifyPayloadDto, RegisterPayloadDto } from 'src/modules/auth/dtos/register.dto';
import { RedisService } from 'src/core/config/redis/redis.service';

import type { IClientUserResponse } from 'src/core/interfaces/user.interface';
import type { IHashUtility } from 'src/core/utility/interface/hash-utility.interface';
import type { IAuthService } from 'src/modules/auth/services/interface/auth-service.interface';
import type { IResponse } from 'src/core/common/interface';
import type { IUserRepository } from 'src/core/repositories/interface/user-repository.interface';
import type { IAccessTokenUtility, IRefreshTokenUtility } from 'src/core/utility/interface/jwt-utility.interface';
import type { IEmailService } from 'src/infra/interface/email-service.interface';
import type { IOtpService } from 'src/infra/interface/otp-service.interface';

@Injectable()
export class AuthService implements IAuthService {
    constructor(
        private readonly _redisService: RedisService,

        @Inject(USER_REPOSITORY)
        private readonly _userRepository: IUserRepository,
        @Inject(HASH_UTILITY)
        private readonly _hashUtility: IHashUtility,
        @Inject(ACCESS_TOKEN_UTILITY)
        private readonly _accessTokenUtility: IAccessTokenUtility,
        @Inject(REFRESH_TOKEN_UTILITY)
        private readonly _refreshTokenUtility: IRefreshTokenUtility,
        @Inject(EMAIL_SERVICE)
        private readonly _emailService: IEmailService,
        @Inject(OTP_SERVICE)
        private readonly _otpService: IOtpService,


    ) { }

    generateAccessToken(id: number, email: string, sessionId: string): string {
        return this._accessTokenUtility.generateAccessToken({
            email,
            role: 'user',
            userId: id,
        }, sessionId);
    }

    async generateRefreshTokenWithJti(id: number, email: string): Promise<{ jti: string; token: string }> {
        const { token, jti, expiresInSeconds } =
            this._refreshTokenUtility.generateRefreshToken({
                email: email,
                role: 'user',
                userId: id,
            });

        await this.storeRefreshSession(id.toString(), jti, expiresInSeconds);
        return { token, jti };
    }

    async registerAccount(registerPayload: RegisterPayloadDto): Promise<IResponse<IClientUserResponse>> {

        const isEmailExisting = await this._userRepository.findByEmail(registerPayload.email);
        if (isEmailExisting) throw new ConflictException(ErrorMessagesEnum.EmailConflictErrorMessage);

        const hashedPassword = await this._hashUtility.hash(registerPayload.password);

        const { password, ...newUser } = await this._userRepository.create({
            email: registerPayload.email,
            password: hashedPassword,
            username: registerPayload.username
        });

        return {
            status: 'success',
            message: SuccessMessagesEnum.AccountCreation,
            data: newUser
        }
    }

    async sendOtp(email: string): Promise<IResponse> {
        const isEmailExisting = await this._userRepository.findByEmail(email);
        if (isEmailExisting) throw new ConflictException(ErrorMessagesEnum.EmailConflictErrorMessage);

        const otp = await this._otpService.generateOtp(email)
        await this._emailService.sendOtp(email, otp);

        return {
            status: 'success',
            message: SuccessMessagesEnum.OtpSent
        }
    }

    async veryfyOtp({ email, otp }: OtpVerifyPayloadDto): Promise<IResponse> {
        const isemailVerfied = await this._otpService.verifyOtp(email, otp);
        return {
            status: isemailVerfied ? 'success' : 'failed',
            message: isemailVerfied
                ? SuccessMessagesEnum.OtpVerified
                : ErrorMessagesEnum.OtpVerificationFailed
        }
    }

    async validateLoginPayload(loginPayload: LoginPayloadDto): Promise<IResponse<IClientUserResponse>> {
        const user = await this._userRepository.findByEmail(loginPayload.email);
        if (!user) {
            throw new UnauthorizedException(ErrorMessagesEnum.LoginInvalidPayload);
        }

        let { password, ...clientData } = user;

        const isPasswordMatch = await this._hashUtility.verify(password, loginPayload.password);
        if (!isPasswordMatch) {
            throw new UnauthorizedException(ErrorMessagesEnum.LoginInvalidPayload);
        }

        return {
            status: 'success',
            message: SuccessMessagesEnum.LoginSuccess,
            data: clientData
        }
    }

    async getCurrentUser(userId: number): Promise<IResponse<IClientUserResponse>> {
        const user = await this._userRepository.findById(userId);

        if (!user || !user.isActive) {
            throw new UnauthorizedException(ErrorMessagesEnum.Unauthenticated);
        }

        const clientUser: IClientUserResponse = {
            id: user.id,
            username: user.username,
            email: user.email,
            isEmailVerified: user.isEmailVerified,
            isActive: user.isActive,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
        return {
            status: 'success',
            message: SuccessMessagesEnum.FetchUserSuccess,
            data: clientUser,
        };
    }

    async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
        const payload = this._refreshTokenUtility.verifyRefreshToken(refreshToken);
        const userId = Number(payload.sub);
        if (!Number.isSafeInteger(userId) || userId <= 0 || !payload.jti) {
            throw new UnauthorizedException(
                ErrorMessagesEnum.InvalidRefreshToken,
            );
        }

        const user = await this._userRepository.findById(userId);

        if (!user || !user.isActive) {
            throw new UnauthorizedException(
                ErrorMessagesEnum.Unauthenticated,
            );
        }

        const next = this._refreshTokenUtility.generateRefreshToken({
            email: user.email,
            role: 'user',
            userId: user.id,
        });
        const accessToken = this._accessTokenUtility.generateAccessToken({
            email: user.email,
            role: 'user',
            userId: user.id,
        }, next.jti);
        const rotated = await this._redisService.rotateRefreshSession(
            payload.jti,
            next.jti,
            user.id.toString(),
            next.expiresInSeconds,
        );

        if (!rotated) {
            throw new UnauthorizedException(ErrorMessagesEnum.InvalidRefreshToken);
        }

        return {
            accessToken,
            refreshToken: next.token,
        };
    }

    async storeRefreshSession(userId: string, jti: string, ttl: number): Promise<void> {
        await this._redisService.set(
            `refresh:${jti}`,
            userId,
            ttl,
        );
    }

    async logout(refreshToken?: string): Promise<void> {
        if (!refreshToken) {
            return;
        }

        let payload: { jti: string; sub: string | number };

        try {
            payload = this._refreshTokenUtility.verifyRefreshToken(refreshToken);
        } catch {
            return;
        }

        await this._redisService.del(`refresh:${payload.jti}`);
    }
}
