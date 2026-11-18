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

const DEFAULT_MODEL = 'nvidia/nemotron-3-ultra-550b-a55b:free';

@Injectable()
export class OpenRouterAIService implements IAITextGenerator {
    private readonly logger = new Logger(OpenRouterAIService.name);
    private client?: OpenAI;
    private readonly model: string;
    private readonly defaultHeaders: Record<string, string>;

    constructor(private readonly configService: ConfigService) {
        this.model =
            this.configService.get<string>('OPENROUTER_MODEL') || DEFAULT_MODEL;

        const siteUrl = this.configService.get<string>('OPENROUTER_SITE_URL');
        const appName =
            this.configService.get<string>('OPENROUTER_APP_NAME') ?? 'Daybook AI';
        this.defaultHeaders = {};

        if (siteUrl) {
            this.defaultHeaders['HTTP-Referer'] = siteUrl;
        }
        if (appName) {
            this.defaultHeaders['X-OpenRouter-Title'] = appName;
        }
    }

    async generate(request: IAICompletionRequest): Promise<IAICompletionResult> {
        try {
            const response = await this.getClient().chat.completions.create({
                model: this.model,
                messages: request.messages,
                temperature: request.options?.temperature ?? 0.3,
                max_tokens: request.options?.maxTokens ?? 1_000,
                stream: false,
            });

            const content = response.choices[0]?.message?.content;

            if (typeof content !== 'string' || !content.trim()) {
                throw new ServiceUnavailableException(
                    'The AI provider returned an empty or invalid response',
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

            this.logger.warn(
                `AI provider request failed: ${this.getErrorType(error)}`,
            );

            throw new ServiceUnavailableException(
                'AI analysis is temporarily unavailable. Please try again.',
            );
        }
    }

    private getErrorType(error: unknown): string {
        return error instanceof Error ? error.name : 'UnknownError';
    }

    private getClient(): OpenAI {
        if (this.client) {
            return this.client;
        }

        const apiKey = this.configService.get<string>('OPENROUTER_API_KEY');

        if (!apiKey) {
            throw new ServiceUnavailableException(
                'OpenRouter is not configured. Set OPENROUTER_API_KEY to enable it.',
            );
        }

        this.client = new OpenAI({
            apiKey,
            baseURL: 'https://openrouter.ai/api/v1',
            timeout: 60_000,
            maxRetries: 0,
            ...(Object.keys(this.defaultHeaders).length > 0
                ? { defaultHeaders: this.defaultHeaders }
                : {}),
        });

        return this.client;
    }
}
