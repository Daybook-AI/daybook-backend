import { IResponse } from "src/core/common/interface";
import { IJournalClientResponse } from "src/core/interfaces/journal.interface";
import { CreateJournalDto, JournalQueryDto } from "src/modules/journal/dtos/journal.dto";

export interface IJournalService {
    createJournalEntry(userId: number, journalPayload: CreateJournalDto): Promise<IResponse<IJournalClientResponse>>;
    getAllJournalEntries(userId: number, journalFilters?: JournalQueryDto): Promise<IResponse<IJournalClientResponse[]>>;
}