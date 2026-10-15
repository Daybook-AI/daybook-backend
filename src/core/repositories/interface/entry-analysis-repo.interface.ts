import { EntryAnalysis } from "generated/prisma/browser";
import { ICreateEntryAnalysis } from "src/core/interfaces/entry-analysis.interface";

export interface IEntryAnalysisReposiotry {
    findOneByJournalId(journalId: number, contentHash?: string): Promise<EntryAnalysis | null>;
    create(data: ICreateEntryAnalysis): Promise<EntryAnalysis>;
}