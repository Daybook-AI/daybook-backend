import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AI_TEXT_GENERATOR } from './tokens/ai.tokens';
import { NvidiaAIService } from './providers/nvidia-ai.service';

@Module({
    imports: [ConfigModule],
    providers: [
        NvidiaAIService,
        {
            provide: AI_TEXT_GENERATOR,
            useExisting: NvidiaAIService,
        },
    ],
    exports: [AI_TEXT_GENERATOR],
})
export class AIModule { }