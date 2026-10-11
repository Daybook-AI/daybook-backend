import { Injectable } from "@nestjs/common";
import { Journal, Prisma } from "generated/prisma/client";
import { PrismaService } from "src/core/config/prisma/prisma.service";
import { ICreateJournalData, IJournalFilters } from "src/core/interfaces/journal.interface";
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

    async findAllByUserId(
        userId: number,
        filters: IJournalFilters = {},
    ): Promise<Journal[]> {
        const {
            page = 1,
            limit = 20,
            search,
            mood,
            tag,
            from,
            to,
            sort = 'desc',
        } = filters;

        const skip = (page - 1) * limit;

        const createdAt: {
            gte?: Date;
            lt?: Date;
        } = {};

        if (from) {
            createdAt.gte = new Date(from);
        }

        if (to) {
            const endDate = new Date(to);
            endDate.setDate(endDate.getDate() + 1);
            createdAt.lt = endDate;
        }

        return this._prisma.journal.findMany({
            where: {
                userId,
                isDeleted: false,

                ...(search && {
                    title: {
                        contains: search,
                        mode: 'insensitive',
                    },
                }),

                ...(mood && { mood }),

                ...(tag && {
                    tags: {
                        has: tag,
                    },
                }),

                ...(Object.keys(createdAt).length > 0 && {
                    createdAt,
                }),
            },

            orderBy: [
                { createdAt: sort },
                { id: sort },
            ],

            skip,
            take: limit,
        });
    }
}