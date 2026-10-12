import { IResponse } from "src/core/common/interface";
import { IJournalClientResponse } from "src/core/interfaces/journal.interface";
import { JournalPayloadDto, JournalQueryDto } from "src/modules/journal/dtos/journal.dto";

export interface IJournalService {
    createJournalEntry(userId: number, journalPayload: JournalPayloadDto): Promise<IResponse<IJournalClientResponse>>;
    getAllJournalEntries(userId: number, journalFilters?: JournalQueryDto): Promise<IResponse<IJournalClientResponse[]>>;
    getJournalById(userId: number, journalId: string): Promise<IResponse<IJournalClientResponse>>;
    updateJournalEntry(journalId: string, journalPayload: JournalPayloadDto): Promise<IResponse<IJournalClientResponse>>;
    removeJournalEntry(journalId: string): Promise<IResponse<string>>;
}