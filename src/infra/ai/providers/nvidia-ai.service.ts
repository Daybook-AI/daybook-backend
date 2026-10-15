import {
    Injectable,
    Logger,
    ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

import type {
    IAICompletionRequest,
    IAICompletionResult,
} from '../interfaces/ai-completion.types';
import type { IAITextGenerator } from '../interfaces/ai-text-generator.interface';

@Injectable()
export class NvidiaAIService implements IAITextGenerator {
    private readonly logger = new Logger(NvidiaAIService.name);
    private readonly client: OpenAI;
    private readonly model: string;

    constructor(private readonly configService: ConfigService) {
        const apiKey = this.configService.get<string>('NVIDIA_API_KEY');

        if (!apiKey) {
            throw new Error('NVIDIA_API_KEY is not configured');
        }

        this.model =
            this.configService.get<string>('NVIDIA_MODEL') ??
            'openai/gpt-oss-20b';

        this.client = new OpenAI({
            apiKey,
            baseURL: 'https://integrate.api.nvidia.com/v1',
            timeout: 60_000,
            maxRetries: 0,
        });
    }

    async generate(request: IAICompletionRequest): Promise<IAICompletionResult> {
        try {
            const response = await this.client.chat.completions.create({
                model: this.model,
                messages: request.messages,
                temperature: request.options?.temperature ?? 0.3,
                max_tokens: request.options?.maxTokens ?? 1_000,
            });

            const content = response.choices[0]?.message?.content;

            if (!content?.trim()) {
                throw new ServiceUnavailableException(
                    'The AI provider returned an empty response',
                );
            }

            return {
                content,
                model: response.model || this.model,
                inputTokens: response.usage?.prompt_tokens,
                outputTokens: response.usage?.completion_tokens,
            };
        } catch (error: unknown) {
            if (error instanceof ServiceUnavailableException) {
                throw error;
            }

            // Log operational metadata only; never log journal content or prompts.
            this.logger.warn(
                `AI provider request failed: ${this.getErrorType(error)}`,
            );

            throw new ServiceUnavailableException(
                'AI analysis is temporarily unavailable. Please try again.',
            );
        }
    }

    private getErrorType(error: unknown): string {
        if (error instanceof Error) {
            return error.name;
        }

        return 'UnknownError';
    }
}