import { Body, Controller, Inject, Param, Post } from '@nestjs/common';
import { IResponse } from 'src/core/common/interface';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { IEntryAnalysis } from 'src/core/interfaces/entry-analysis.interface';
import { ENTRY_ANALYSIS } from 'src/core/tokens/service.token';
import { IEntryAnalysisService } from 'src/modules/entry-analysis/services/interfaces/entry-analysis-service.interface';

@Controller('analyse')
export class EntryAnalysisController {
    constructor(
        @Inject(ENTRY_ANALYSIS)
        private readonly _entryAnalysisService: IEntryAnalysisService,
    ) { }

    @Post('')
    async generateAnalysis(
        @Body() { journalId }: { journalId: number },
        @CurrentUser('sub') userId: number):
        Promise<IResponse<IEntryAnalysis>> {
        return this._entryAnalysisService.generateAnalysis(Number(journalId), Number(userId));
    }

}
