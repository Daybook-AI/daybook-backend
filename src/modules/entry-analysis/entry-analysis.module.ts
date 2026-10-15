import { Module } from '@nestjs/common';
import { EntryAnalysisRepository } from 'src/core/repositories/implementation/entry-analysis.repository';
import { ENTRY_ANALYSIS_REPOSITORY } from 'src/core/tokens/repository.token';
import { ENTRY_ANALYSIS } from 'src/core/tokens/service.token';
import { NvidiaAIService } from 'src/infra/ai/providers/nvidia-ai.service';
import { AI_TEXT_GENERATOR } from 'src/infra/ai/tokens/ai.tokens';
import { EntryAnalysisController } from 'src/modules/entry-analysis/controllers/entry-analysis.controller';
import { EntryAnalysisService } from 'src/modules/entry-analysis/services/implementations/entry-analysis.service';
import { JournalModule } from 'src/modules/journal/journal.module';

@Module({
    imports: [JournalModule],
    controllers: [EntryAnalysisController],
    providers: [
        EntryAnalysisService,
        NvidiaAIService,
        EntryAnalysisRepository,

        {
            provide: ENTRY_ANALYSIS,
            useExisting: EntryAnalysisService
        },
        {
            provide: AI_TEXT_GENERATOR,
            useExisting: NvidiaAIService
        },
        {
            provide: ENTRY_ANALYSIS_REPOSITORY,
            useExisting: EntryAnalysisRepository
        }
    ],
    exports: []
})
export class EntryAnalysisModule { }
