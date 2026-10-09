export type UserRole = 'user' | 'admin';

export enum JwtType {
    ACCESS = 'access',
    REFRESH = 'refresh',
}

export interface IJwtPayload {
    sub: number;
    email: string;
    role: UserRole;
    type: JwtType;
    jti: string;
    sid?: string;
    iat?: number;
    exp?: number
}

export interface IGenerateTokenPayload {
    userId: number;
    email: string;
    role: UserRole;
}


export type JwtPayloadToSign = Omit<IJwtPayload, 'iat' | 'exp'>;
