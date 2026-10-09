import type { User } from "generated/prisma/browser";
import type { IResponse } from "src/core/common/interface";
import { IClientUserResponse } from "src/core/interfaces/user.interface";
import type { LoginPayloadDto, OtpVerifyPayloadDto, RegisterPayloadDto } from "src/modules/auth/dtos/register.dto";

export interface IAuthService {
    registerAccount(registerPayload: RegisterPayloadDto): Promise<IResponse<IClientUserResponse>>;
    validateLoginPayload(loginPayload: LoginPayloadDto): Promise<IResponse<IClientUserResponse>>;
    logout(refreshToken?: string): Promise<void>;

    getCurrentUser(userId: number): Promise<IResponse<IClientUserResponse>>;

    sendOtp(email: string): Promise<IResponse>;
    veryfyOtp(eotpVerifyPayload: OtpVerifyPayloadDto): Promise<IResponse>;

    generateRefreshTokenWithJti(id: number, email: string): Promise<{ jti: string; token: string }>;
    storeRefreshSession(userId: string, jti: string, ttl: number): Promise<void>

    generateAccessToken(id: number, email: string, sessionId: string): string;
    refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }>;

}