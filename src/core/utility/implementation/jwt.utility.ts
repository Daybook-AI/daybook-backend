import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { randomUUID } from "node:crypto";

import { IGenerateTokenPayload, IJwtPayload, JwtType } from "src/core/interfaces/auth.interface";
import type { IAccessTokenUtility, IRefreshTokenUtility } from "src/core/utility/interface/jwt-utility.interface";

@Injectable()
export class JwtUtility implements IAccessTokenUtility, IRefreshTokenUtility {
    private readonly _accessSecret: string;
    private readonly _accessExpiresInSeconds: number;

    private readonly _refreshSecret: string;
    private readonly _refreshExpiresInSeconds: number;

    constructor(
        private readonly _jwtService: JwtService,
        private readonly _configService: ConfigService,
    ) {
        this._accessSecret = this._configService.getOrThrow<string>(
            'JWT_ACCESS_SECRET',
        );

        this._accessExpiresInSeconds = this._durationToSeconds(
            this._configService.getOrThrow<string>('JWT_ACCESS_EXPIRES_IN'),
            'JWT_ACCESS_EXPIRES_IN',
        );

        this._refreshSecret = this._configService.getOrThrow<string>(
            'JWT_REFRESH_SECRET',
        );

        this._refreshExpiresInSeconds = this._durationToSeconds(
            this._configService.getOrThrow<string>('JWT_REFRESH_EXPIRES_IN'),
            'JWT_REFRESH_EXPIRES_IN',
        );
    }

    generateAccessToken(payload: IGenerateTokenPayload, sessionId: string): string {

        const jwtPayload: Omit<IJwtPayload, 'iat' | 'exp'> = {
            sub: payload.userId,
            email: payload.email,
            type: JwtType.ACCESS,
            jti: randomUUID(),
            role: payload.role,
            sid: sessionId,
        };

        return this._jwtService.sign(jwtPayload, {
            secret: this._accessSecret,
            expiresIn: this._accessExpiresInSeconds,
        });
    }

    generateRefreshToken(payload: IGenerateTokenPayload): { token: string; jti: string; expiresInSeconds: number } {
        const jti = randomUUID();

        const jwtPayload: Omit<IJwtPayload, 'iat' | 'exp'> = {
            sub: payload.userId,
            email: payload.email,
            type: JwtType.REFRESH,
            jti: randomUUID(),
            role: payload.role,
        };

        const token = this._jwtService.sign(
            { ...jwtPayload, jti },
            {
                secret: this._refreshSecret,
                expiresIn: this._refreshExpiresInSeconds,
            },
        );

        return { token, jti, expiresInSeconds: this._refreshExpiresInSeconds };
    }

    verifyAccessToken(token: string): IJwtPayload {
        const payload = this._jwtService.verify<IJwtPayload>(
            token,
            {
                secret: this._accessSecret,
            },
        );

        if (payload.type !== JwtType.ACCESS) {
            throw new Error('Invalid access token type');
        }

        return payload;
    }

    verifyRefreshToken(token: string): IJwtPayload {
        const payload = this._jwtService.verify<IJwtPayload>(
            token,
            {
                secret: this._refreshSecret,
            },
        );

        if (payload.type !== JwtType.REFRESH) {
            throw new Error('Invalid refresh token type');
        }

        return payload;
    }

    private _durationToSeconds(duration: string, settingName: string): number {
        const match = /^(\d+)(s|m|h|d|w)$/.exec(duration);
        if (!match) {
            throw new Error(`${settingName} must use s, m, h, d, or w units`);
        }

        const amount = Number(match[1]);
        const unitSeconds = (() => {
            switch (match[2]) {
                case 's': return 1;
                case 'm': return 60;
                case 'h': return 3600;
                case 'd': return 86400;
                case 'w': return 604800;
                default: return 0;
            }
        })();
        const seconds = amount * unitSeconds;
        if (!Number.isSafeInteger(seconds) || seconds <= 0) {
            throw new Error(`${settingName} must be a positive safe duration`);
        }

        return seconds;
    }

}