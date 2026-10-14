
import dotenv from 'dotenv';

dotenv.config({ quiet: true });

import OpenAI from 'openai';
import { describe, it, expect } from '@jest/globals';
import { performance } from 'node:perf_hooks';

const MODEL = 'openai/gpt-oss-20b';
const CONCURRENCY = 5;

const client = new OpenAI({
    baseURL: 'https://integrate.api.nvidia.com/v1',
    apiKey: process.env.NVIDIA_API_KEY || 'missing-api-key',
    timeout: 120_000,
    maxRetries: 0,
});

interface EntryAnalysisResult {
    summary: string;
    themes: string[];
    emotionalTone: string[];
    reflection: string;
    suggestedActions: string[];
}

interface JournalTestCase {
    id: number;
    name: string;
    entry: string;
}

interface RequestResult {
    id: number;
    name: string;
    latencyMs: number;
    analysis: EntryAnalysisResult;
    totalTokens: number | undefined;
}

const entries: JournalTestCase[] = [
    {
        id: 1,
        name: 'Positive day',
        entry:
            'I finished my planned tasks today and spent time reading. ' +
            'I feel happy and satisfied with my progress.',
    },
    {
        id: 2,
        name: 'Neutral day',
        entry:
            'I woke up, attended classes, had lunch, and read a book. ' +
            'Nothing unusual happened today.',
    },
    {
        id: 3,
        name: 'Mixed emotions',
        entry:
            'I received an opportunity to work at a company I like. ' +
            'I feel excited but nervous about whether I am ready.',
    },
    {
        id: 4,
        name: 'Debugging frustration',
        entry:
            'I spent hours debugging my application. I felt frustrated, ' +
            'but eventually found the root cause of the problem.',
    },
    {
        id: 5,
        name: 'Short entry',
        entry: 'Feeling tired today. Need some rest.',
    },
];

const systemPrompt = `
Analyze the user's personal journal entry.

Return only valid JSON with exactly these fields:
- summary: string
- themes: array of strings
- emotionalTone: array of strings
- reflection: string
- suggestedActions: array of strings

Rules:
- Be accurate and grounded in the entry.
- Do not invent facts or diagnose the writer.
- Recognize mixed emotions where appropriate.
- Do not force advice onto neutral entries.
- Keep the analysis concise and supportive.
- Return JSON only, without Markdown fences.
`.trim();

function validateAnalysis(
    data: unknown,
): data is EntryAnalysisResult {
    if (
        data === null ||
        typeof data !== 'object' ||
        Array.isArray(data)
    ) {
        return false;
    }

    const result = data as Record<string, unknown>;

    const expectedKeys = [
        'summary',
        'themes',
        'emotionalTone',
        'reflection',
        'suggestedActions',
    ].sort();

    if (
        JSON.stringify(Object.keys(result).sort()) !==
        JSON.stringify(expectedKeys)
    ) {
        return false;
    }

    return (
        typeof result.summary === 'string' &&
        typeof result.reflection === 'string' &&
        Array.isArray(result.themes) &&
        result.themes.every(
            (item: unknown) => typeof item === 'string',
        ) &&
        Array.isArray(result.emotionalTone) &&
        result.emotionalTone.every(
            (item: unknown) => typeof item === 'string',
        ) &&
        Array.isArray(result.suggestedActions) &&
        result.suggestedActions.every(
            (item: unknown) => typeof item === 'string',
        )
    );
}

async function analyzeEntry(
    testCase: JournalTestCase,
): Promise<RequestResult> {
    const startedAt = performance.now();

    const completion = await client.chat.completions.create({
        model: MODEL,
        messages: [
            {
                role: 'system',
                content: systemPrompt,
            },
            {
                role: 'user',
                content: `Analyze this journal entry:\n${testCase.entry}`,
            },
        ],
        temperature: 0.2,
        max_tokens: 1200,
        stream: false,
    });

    const latencyMs = Math.round(
        performance.now() - startedAt,
    );

    const content = completion.choices[0]?.message?.content;

    if (typeof content !== 'string' || !content.trim()) {
        throw new Error('The model returned an empty response.');
    }

    let parsed: unknown;

    try {
        parsed = JSON.parse(content);
    } catch {
        throw new Error(`Invalid JSON returned:\n${content}`);
    }

    if (!validateAnalysis(parsed)) {
        throw new Error(
            `Invalid analysis schema:\n${JSON.stringify(parsed)}`,
        );
    }

    return {
        id: testCase.id,
        name: testCase.name,
        latencyMs,
        analysis: parsed,
        totalTokens: completion.usage?.total_tokens,
    };
}

describe('NVIDIA Parallel Entry Analysis', () => {
    it(
        `analyzes ${CONCURRENCY} entries concurrently and measures latency`,
        async () => {
            expect(process.env.NVIDIA_API_KEY).toBeTruthy();
            const selectedEntries = entries.slice(0, CONCURRENCY);

            expect(selectedEntries).toHaveLength(CONCURRENCY);

            console.log('\n--- PARALLEL TEST STARTED ---');
            console.log('Model:', MODEL);
            console.log('Concurrent requests:', CONCURRENCY);

            // Start the timer immediately before launching all requests.
            const batchStartedAt = performance.now();

            // Every request starts without waiting for the previous one.
            const settledResults = await Promise.allSettled(
                selectedEntries.map((entry) => analyzeEntry(entry)),
            );

            const batchLatencyMs = Math.round(
                performance.now() - batchStartedAt,
            );

            const successfulResults: RequestResult[] = [];
            const failures: {
                name: string;
                error: string;
            }[] = [];

            settledResults.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    successfulResults.push(result.value);
                } else {
                    const reason = result.reason;

                    const error =
                        reason instanceof Error
                            ? {
                                name: reason.name,
                                message: reason.message,
                                cause: reason.cause,
                                stack: reason.stack,
                            }
                            : reason;

                    failures.push({
                        name: entries[index].name,
                        error,
                    });
                }
            });

            // Report every successful request.
            console.log('\n--- INDIVIDUAL REQUEST RESULTS ---');

            for (const result of successfulResults) {
                console.log({
                    entry: result.name,
                    latencyMs: result.latencyMs,
                    totalTokens: result.totalTokens,
                });
            }

            // Report failures without hiding successful results.
            if (failures.length > 0) {
                console.log('\n--- FAILED REQUESTS ---');

                for (const failure of failures) {
                    console.log(failure);
                }
            }

            const latencies = successfulResults
                .map((result) => result.latencyMs)
                .sort((a, b) => a - b);

            const averageLatencyMs =
                latencies.length > 0
                    ? Math.round(
                        latencies.reduce((sum, value) => sum + value, 0) /
                        latencies.length,
                    )
                    : 0;

            const minLatencyMs =
                latencies.length > 0 ? latencies[0] : 0;

            const maxLatencyMs =
                latencies.length > 0
                    ? latencies[latencies.length - 1]
                    : 0;

            const throughput =
                batchLatencyMs > 0
                    ? Number(
                        (
                            successfulResults.length /
                            (batchLatencyMs / 1000)
                        ).toFixed(3),
                    )
                    : 0;

            console.log('\n--- PARALLEL TEST SUMMARY ---');
            console.log('Total entries:', selectedEntries.length);
            console.log('Successful:', successfulResults.length);
            console.log('Failed:', failures.length);
            console.log('Batch latency:', `${batchLatencyMs} ms`);
            console.log('Average request latency:', `${averageLatencyMs} ms`);
            console.log('Fastest request:', `${minLatencyMs} ms`);
            console.log('Slowest request:', `${maxLatencyMs} ms`);
            console.log('Throughput:', `${throughput} entries/second`);

            console.log('\n--- GENERATED ANALYSES ---');

            for (const result of successfulResults) {
                console.log(`\n${result.name}`);
                console.log(JSON.stringify(result.analysis, null, 2));
            }

            // Fail the test if any request failed.
            expect(failures).toHaveLength(0);
            expect(successfulResults).toHaveLength(selectedEntries.length);
        },
        180_000,
    );
});
