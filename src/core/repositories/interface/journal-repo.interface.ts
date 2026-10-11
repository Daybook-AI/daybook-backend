import { Journal } from "generated/prisma/client";
import { ICreateJournalData, IJournalFilters } from "src/core/interfaces/journal.interface";

export interface IJournalRepository {
    create(data: ICreateJournalData): Promise<Journal>;
    findAllByUserId(userId: number, filters?: IJournalFilters): Promise<Journal[]>;
}