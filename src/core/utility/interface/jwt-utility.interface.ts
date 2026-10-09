import { IGenerateTokenPayload, IJwtPayload } from "src/core/interfaces/auth.interface";

export interface IRefreshTokenUtility {
    verifyRefreshToken(token: string): IJwtPayload;
    generateRefreshToken(payload: IGenerateTokenPayload): { token: string; jti: string; expiresInSeconds: number };
}

export interface IAccessTokenUtility {
    generateAccessToken(payload: IGenerateTokenPayload, sessionId: string): string;
    verifyAccessToken(token: string): IJwtPayload;
}