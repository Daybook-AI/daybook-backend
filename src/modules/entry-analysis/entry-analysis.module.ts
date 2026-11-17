import { Module } from '@nestjs/common';
import { EntryAnalysisRepository } from 'src/core/repositories/implementation/entry-analysis.repository';
import { ENTRY_ANALYSIS_REPOSITORY } from 'src/core/tokens/repository.token';
import { ENTRY_ANALYSIS_SERVICE } from 'src/core/tokens/service.token';
import { AIModule } from 'src/infra/ai/ai.module';
import { EntryAnalysisController } from 'src/modules/entry-analysis/controllers/entry-analysis.controller';
import { EntryAnalysisService } from 'src/modules/entry-analysis/services/implementations/entry-analysis.service';
import { JournalModule } from 'src/modules/journal/journal.module';

@Module({
    imports: [JournalModule, AIModule],
    controllers: [EntryAnalysisController],
    providers: [
        EntryAnalysisService,
        EntryAnalysisRepository,

        {
            provide: ENTRY_ANALYSIS_SERVICE,
            useExisting: EntryAnalysisService
        },
        {
            provide: ENTRY_ANALYSIS_REPOSITORY,
            useExisting: EntryAnalysisRepository
        }
    ],
    exports: []
})
export class EntryAnalysisModule { }
