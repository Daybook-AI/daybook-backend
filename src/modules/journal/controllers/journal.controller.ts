import { Body, Controller, Get, Inject, Post } from '@nestjs/common';
import { IResponse } from 'src/core/common/interface';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { IJournalClientResponse } from 'src/core/interfaces/journal.interface';
import { JOURNAL_SERVICE } from 'src/core/tokens/service.token';
import { CreateJournalDto } from 'src/modules/journal/dtos/journal.dto';
import { IJournalService } from 'src/modules/journal/services/interfaces/journal-service.interface';

@Controller('journal')
export class JournalController {
    constructor(
        @Inject(JOURNAL_SERVICE)
        private readonly _journalService: IJournalService
    ) { }

    @Post('')
    async createJournalEntry(@Body() journalPayload: CreateJournalDto, @CurrentUser('sub') currentUserId: number): Promise<IResponse<IJournalClientResponse>> {
        return await this._journalService.createJournalEntry(currentUserId, journalPayload);
    }

    @Get('')
    async getAllJournalEntries(@CurrentUser('sub') currentUserId: number): Promise<IResponse<IJournalClientResponse[]>> {
        return await this._journalService.getAllJournalEntries(currentUserId);
    }
}
