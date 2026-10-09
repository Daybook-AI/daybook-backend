import { User } from "generated/prisma/client";
import { ICreateUserData, IUpdateUserData } from "src/core/interfaces/user.interface";

export interface IUserRepository {
    create(data: ICreateUserData): Promise<User>;

    findById(id: number): Promise<User | null>;

    findByEmail(email: string): Promise<User | null>;


    // findByUsername(username: string): Promise<User | null>;

    // update(id: number, data: IUpdateUserData): Promise<User>;

    // delete(id: number): Promise<User>;
}