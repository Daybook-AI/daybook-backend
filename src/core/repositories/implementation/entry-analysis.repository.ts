import { Injectable } from "@nestjs/common";
import { EntryAnalysis } from "generated/prisma/client";
import { PrismaService } from "src/core/config/prisma/prisma.service";
import { ICreateEntryAnalysis } from "src/core/interfaces/entry-analysis.interface";
import { IEntryAnalysisReposiotry } from "src/core/repositories/interface/entry-analysis-repo.interface";

@Injectable()
export class EntryAnalysisRepository implements IEntryAnalysisReposiotry {
    constructor(
        private readonly _prisma: PrismaService
    ) { }

    async create(data: ICreateEntryAnalysis): Promise<EntryAnalysis> {
        return this._prisma.entryAnalysis.create({
            data,
        });
    }

    async findOneByJournalId(journalId: number, contentHash?: string): Promise<EntryAnalysis | null> {
        const data: Record<string, string | number> = { journalId };
        if (contentHash) {
            data.contentHash = contentHash;
        }

        return this._prisma.entryAnalysis.findFirst({
            where: data,
            orderBy: {
                createdAt: 'desc',
            },
        });
    }
}