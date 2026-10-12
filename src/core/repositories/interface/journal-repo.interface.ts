import { Prisma } from "generated/prisma/browser";
import { Journal } from "generated/prisma/client";
import { ICreateJournalData, IJournalFilters } from "src/core/interfaces/journal.interface";
import { JournalDocumentDto } from "src/modules/journal/dtos/journal.dto";

export interface IJournalRepository {
    create(data: ICreateJournalData): Promise<Journal>;
    findAllByUserId(userId: number, filters?: IJournalFilters): Promise<Journal[]>;
    findOneByJournalId(journalId: number, userId: number): Promise<Journal | null>;
    updateOneByJournalId(journalId: number, data: Prisma.JournalUpdateManyMutationInput): Promise<Journal | null>;
    toPrismaJson(value: JournalDocumentDto): Prisma.InputJsonValue;
    deleteOneByJournalId(journalId: number): Promise<Journal>;
}