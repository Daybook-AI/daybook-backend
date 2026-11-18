import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AI_TEXT_GENERATOR } from './tokens/ai.tokens';
// import { NvidiaAIService } from './providers/nvidia-ai.service';
import { OpenRouterAIService } from './providers/openrouter-ai.service';

@Module({
    imports: [ConfigModule],
    providers: [
        OpenRouterAIService,
        {
            provide: AI_TEXT_GENERATOR,
            useExisting: OpenRouterAIService,
        },
    ],
    exports: [AI_TEXT_GENERATOR, OpenRouterAIService],
})
export class AIModule { }