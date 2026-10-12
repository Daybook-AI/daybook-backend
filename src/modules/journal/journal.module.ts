import { Module } from '@nestjs/common';
import { JournalController } from 'src/modules/journal/controllers/journal.controller';
import { JournalService } from './services/implementations/journal.service';
import { JOURNAL_SERVICE } from 'src/core/tokens/service.token';
import { JournalRepository } from 'src/core/repositories/implementation/journal.repository';
import { JOURNAL_REPOSITORY } from 'src/core/tokens/repository.token';

@Module({
    controllers: [JournalController],
    providers: [
        JournalService,
        JournalRepository,


        {
            provide: JOURNAL_SERVICE,
            useExisting: JournalService
        },
        {
            provide: JOURNAL_REPOSITORY,
            useExisting: JournalRepository
        }
    ]
})
export class JournalModule { }
