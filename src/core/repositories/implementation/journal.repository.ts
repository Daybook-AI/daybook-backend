import { Injectable } from "@nestjs/common";
import { Journal, Prisma } from "generated/prisma/client";
import { PrismaService } from "src/core/config/prisma/prisma.service";
import { ICreateJournalData } from "src/core/interfaces/journal.interface";
import { IJournalRepository } from "src/core/repositories/interface/journal-repo.interface";

@Injectable()
export class JournalRepository implements IJournalRepository {
    constructor(
        private readonly _prisma: PrismaService
    ) { }

    async create(data: ICreateJournalData): Promise<Journal> {
        const content: Prisma.InputJsonValue = data.content as unknown as Prisma.InputJsonValue;

        return this._prisma.journal.create({
            data: {
                userId: data.userId,
                title: data.title,
                content,
                mood: data.mood,
                tags: data.tags ?? [],
            },
        });
    }

    async findAllByUserId(userId: number): Promise<Journal[]> {
        return this._prisma.journal.findMany({
            where: {
                userId,
                isDeleted: false,
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 5,
        });
    }
}