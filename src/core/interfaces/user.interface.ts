import type { IBaseEntity } from "src/core/common/interface";

export interface ICreateUserData {
    username: string;
    email: string;
    password: string;
}

export interface IUpdateUserData {
    username?: string;
    email?: string;
    password?: string;
}

export interface IClientUserResponse extends IBaseEntity {
    username: string;
    email: string;
    isEmailVerified: boolean;
    // emailVerifiedAt: Date | null;
    isActive: boolean;
}