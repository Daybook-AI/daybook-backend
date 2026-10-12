import { Body, Controller, Get, Inject, Post, Query, Param, Put, Patch, } from '@nestjs/common';
import { IResponse } from 'src/core/common/interface';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { IJournalClientResponse } from 'src/core/interfaces/journal.interface';
import { JOURNAL_SERVICE } from 'src/core/tokens/service.token';
import { JournalPayloadDto, JournalQueryDto } from 'src/modules/journal/dtos/journal.dto';
import { IJournalService } from 'src/modules/journal/services/interfaces/journal-service.interface';

@Controller('journal')
export class JournalController {
    constructor(
        @Inject(JOURNAL_SERVICE)
        private readonly _journalService: IJournalService
    ) { }

    @Post('')
    async createJournalEntry(
        @Body() journalPayload: JournalPayloadDto,
        @CurrentUser('sub') currentUserId: number):
        Promise<IResponse<IJournalClientResponse>> {
        return await this._journalService.createJournalEntry(currentUserId, journalPayload);
    }

    @Get('')
    async getAllJournalEntries(
        @CurrentUser('sub') currentUserId: number,
        @Query() journalfilters: JournalQueryDto):
        Promise<IResponse<IJournalClientResponse[]>> {
        return await this._journalService.getAllJournalEntries(currentUserId, journalfilters);
    }

    @Get(':id')
    async getJournalById(
        @Param('id') journalId: string,
        @CurrentUser('sub') currentUserId: number):
        Promise<IResponse<IJournalClientResponse>> {
        return this._journalService.getJournalById(currentUserId, journalId);
    }

    @Put(':id')
    async updateJournalEntry(
        @Param('id') journalId: string,
        @Body() journalPayload: JournalPayloadDto,
    ): Promise<IResponse<IJournalClientResponse>> {
        return this._journalService.updateJournalEntry(journalId, journalPayload);
    }

    @Patch(':id')
    async removeJournalEntry(
        @Param('id') journalId: string,
    ): Promise<IResponse<string>> {
        return this._journalService.removeJournalEntry(journalId);
    }
}
