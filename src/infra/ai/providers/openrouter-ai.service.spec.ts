import { ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { afterEach, describe, expect, it, jest } from '@jest/globals';
import OpenAI from 'openai';

import type { IAICompletionRequest } from '../interfaces/ai-completion.types';
import { OpenRouterAIService } from './openrouter-ai.service';

jest.mock('openai', () => ({
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
        chat: {
            completions: {
                create: jest.fn(),
            },
        },
    })),
}));

const apiKey = 'openrouter-test-key';
const model = 'nvidia/nemotron-3-ultra-550b-a55b:free';
const request: IAICompletionRequest = {
    messages: [{ role: 'user', content: 'Test prompt' }],
};

function createService(config: Record<string, string | undefined> = {}) {
    const configService = {
        get: jest.fn((key: string) => config[key]),
    } as unknown as ConfigService;
    const createCompletion = jest.fn<(...args: unknown[]) => Promise<unknown>>();
    jest.mocked(OpenAI).mockImplementation(() => ({
        chat: {
            completions: {
                create: createCompletion,
            },
        },
    }) as unknown as jest.Mocked<OpenAI>);
    const service = new OpenRouterAIService(configService);

    return { service, createCompletion };
}

describe('OpenRouterAIService', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('uses the independent OpenRouter key, endpoint, model, and optional headers', async () => {
        const { service, createCompletion } = createService({
            OPENROUTER_API_KEY: apiKey,
            OPENROUTER_MODEL: model,
            OPENROUTER_SITE_URL: 'https://daybook.example',
            OPENROUTER_APP_NAME: 'Daybook AI',
            NVIDIA_API_KEY: 'must-not-be-used',
        });
        createCompletion.mockResolvedValue({
            model,
            choices: [{ message: { content: 'Generated response' } }],
        });

        await service.generate(request);

        expect(jest.mocked(OpenAI)).toHaveBeenCalledWith(expect.objectContaining({
            apiKey,
            baseURL: 'https://openrouter.ai/api/v1',
            timeout: 60_000,
            maxRetries: 0,
            defaultHeaders: {
                'HTTP-Referer': 'https://daybook.example',
                'X-Title': 'Daybook AI',
            },
        }));
    });

    it('maps completion content, model, and token usage', async () => {
        const { service, createCompletion } = createService({
            OPENROUTER_API_KEY: apiKey,
        });
        createCompletion.mockResolvedValue({
            model,
            choices: [{ message: { content: 'Generated response' } }],
            usage: { prompt_tokens: 12, completion_tokens: 8 },
        });

        await expect(service.generate(request)).resolves.toEqual({
            content: 'Generated response',
            model,
            inputTokens: 12,
            outputTokens: 8,
        });
        expect(createCompletion).toHaveBeenCalledWith(expect.objectContaining({
            model,
            messages: request.messages,
            stream: false,
        }));
    });

    it.each([null, '', '   '])(
        'rejects empty or malformed response content (%s)',
        async (content) => {
            const { service, createCompletion } = createService({
                OPENROUTER_API_KEY: apiKey,
            });
            createCompletion.mockResolvedValue({
                choices: [{ message: { content } }],
            });

            await expect(service.generate(request)).rejects.toBeInstanceOf(
                ServiceUnavailableException,
            );
        },
    );

    it.each([
        ['API error', Object.assign(new Error('API error'), { name: 'APIError' })],
        ['rate limit', Object.assign(new Error('Rate limited'), { name: 'RateLimitError' })],
        ['timeout', Object.assign(new Error('Timed out'), { name: 'APIConnectionTimeoutError' })],
    ])('maps %s failures to a service-unavailable error', async (_, error) => {
        const { service, createCompletion } = createService({
            OPENROUTER_API_KEY: apiKey,
        });
        createCompletion.mockRejectedValue(error);

        await expect(service.generate(request)).rejects.toBeInstanceOf(
            ServiceUnavailableException,
        );
    });

    it('requires an OpenRouter API key rather than falling back to NVIDIA credentials', async () => {
        const { service } = createService({
            NVIDIA_API_KEY: 'nvidia-only-key',
        });

        await expect(service.generate(request)).rejects.toThrow(
            'OpenRouter is not configured',
        );
        expect(jest.mocked(OpenAI)).not.toHaveBeenCalled();
    });
});
