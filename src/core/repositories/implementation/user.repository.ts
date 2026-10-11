import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/core/config/prisma/prisma.service";
import type { ICreateUserData } from "src/core/interfaces/user.interface";
import type { User } from "generated/prisma/client";
import type { IUserRepository } from "src/core/repositories/interface/user-repo.interface";

@Injectable()
export class UserRepository implements IUserRepository {
    constructor(
        private readonly _prisma: PrismaService,
    ) { }

    async create(data: ICreateUserData): Promise<User> {
        return this._prisma.user.create({ data });
    }

    async findByEmail(email: string): Promise<User | null> {
        return this._prisma.user.findUnique({
            where: { email }
        });
    }

    async findById(id: number): Promise<User | null> {
        return this._prisma.user.findUnique({
            where: { id }
        });
    }

}