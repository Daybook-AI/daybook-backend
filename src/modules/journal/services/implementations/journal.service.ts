import { Inject, Injectable } from '@nestjs/common';
import { IResponse } from 'src/core/common/interface';
import { SuccessMessagesEnum } from 'src/core/enums/success.enum';
import { ICreateJournalData, IJournalClientResponse, IJournalDocument, IJournalFilters } from 'src/core/interfaces/journal.interface';
import { IJournalRepository } from 'src/core/repositories/interface/journal-repo.interface';
import { JOURNAL_REPOSITORY } from 'src/core/tokens/repository.token';
import { CreateJournalDto, JournalQueryDto } from 'src/modules/journal/dtos/journal.dto';
import { IJournalService } from 'src/modules/journal/services/interfaces/journal-service.interface';

@Injectable()
export class JournalService implements IJournalService {
    constructor(
        @Inject(JOURNAL_REPOSITORY)
        private readonly _journalRepository: IJournalRepository,
    ) { }

    async createJournalEntry(
        userId: number,
        journalPayload: CreateJournalDto):
        Promise<IResponse<IJournalClientResponse>> {

        const journalData: ICreateJournalData = {
            userId,
            title: journalPayload.title,
            content: journalPayload.content as IJournalDocument,
            mood: journalPayload.mood,
            tags: journalPayload.tags,
        };

        const journal = await this._journalRepository.create(journalData);

        return {
            status: 'success',
            message: SuccessMessagesEnum.JournalCreationSuccess,
            data: {
                id: journal.id,
                content: journal.content,
                title: journal.title,
                mood: journal.mood,
                tags: journal.tags,
                createdAt: journal.createdAt,
                updatedAt: journal.updatedAt
            }
        }
    }

    async getAllJournalEntries(
        userId: number,
        journalFilters?: JournalQueryDto,
    ): Promise<IResponse<IJournalClientResponse[]>> {

        const filters: IJournalFilters = {
            page: journalFilters?.page ?? 1,
            limit: journalFilters?.limit ?? 20,
            search: journalFilters?.search || undefined,
            mood:
                journalFilters?.mood && journalFilters.mood !== 'All'
                    ? journalFilters.mood
                    : undefined,
            tag:
                journalFilters?.tag && journalFilters.tag !== 'All'
                    ? journalFilters.tag
                    : undefined,
            from: journalFilters?.from || undefined,
            to: journalFilters?.to || undefined,
            sort: journalFilters?.sort ?? 'desc',
        };

        const journals = await this._journalRepository.findAllByUserId(
            userId,
            filters,
        );

        return {
            status: 'success',
            message: SuccessMessagesEnum.JournalFetchSuccess,
            data: journals.map((journal) => ({
                id: journal.id,
                content: journal.content,
                title: journal.title,
                mood: journal.mood,
                tags: journal.tags,
                createdAt: journal.createdAt,
                updatedAt: journal.updatedAt,
            })),
        };
    }
}
