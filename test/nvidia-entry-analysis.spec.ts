
import dotenv from 'dotenv';

dotenv.config({ quiet: true });

import OpenAI from 'openai';
import { describe, it, expect } from '@jest/globals';
import { performance } from 'node:perf_hooks';

const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1';
const NVIDIA_MODEL = 'openai/gpt-oss-20b';

const client = new OpenAI({
  baseURL: NVIDIA_BASE_URL,
  apiKey: process.env.NVIDIA_API_KEY || 'missing-api-key',
  timeout: 90_000,
  maxRetries: 1,
});

interface EntryAnalysisResult {
  summary: string;
  themes: string[];
  emotionalTone: string[];
  reflection: string;
  suggestedActions: string[];
}

interface JournalTestCase {
  name: string;
  entry: string;
  expectedSignals: string[];
}

const journalTestCases: JournalTestCase[] = [
  {
    name: 'positive journal entry',
    entry: `
      Today was a really good day. I completed the main tasks I planned
      for work, helped a friend with a problem, and spent the evening
      reading a book. I feel satisfied with how I used my time.
    `,
    expectedSignals: ['satisfaction', 'productivity', 'accomplishment'],
  },
  {
    name: 'neutral journal entry',
    entry: `
      Today I woke up at 8 AM, had breakfast, attended my usual classes,
      came home, and read a few chapters of a book. Nothing unusual
      happened, but it was a quiet and ordinary day.
    `,
    expectedSignals: ['routine', 'ordinary', 'quiet'],
  },
  {
    name: 'mixed emotions',
    entry: `
      My friend told me that I might get an opportunity to work at a
      company I really like. I am excited because this could be a big
      step forward, but I am also nervous because I don't know whether
      I am ready. I want to try, even though I am afraid of failing.
    `,
    expectedSignals: ['excitement', 'nervousness', 'uncertainty'],
  },
  {
    name: 'frustration while debugging',
    entry: `
      I spent almost the entire day debugging an issue in my application.
      Every time I fixed one bug, another problem appeared. I felt
      frustrated and started doubting my ability, but eventually I
      discovered the root cause. I still have more work to do tomorrow.
    `,
    expectedSignals: ['frustration', 'persistence', 'problem-solving'],
  },
  {
    name: 'very short journal entry',
    entry: 'Feeling tired today. Need some rest.',
    expectedSignals: ['tiredness', 'rest'],
  },
];

const systemPrompt = `
You analyze personal journal entries for a journaling application.

Return exactly one valid JSON object with these fields:
- summary: string
- themes: array of strings
- emotionalTone: array of strings
- reflection: string
- suggestedActions: array of strings

Requirements:
- Base observations only on the journal entry.
- Do not invent events, intentions, or feelings.
- Do not diagnose the writer or make medical claims.
- Recognize mixed emotions when appropriate.
- Do not force advice onto neutral or ordinary experiences.
- A short entry should receive a proportionately concise analysis.
- Suggested actions must be practical and relevant.
- Do not repeat the same idea across fields.
- Use supportive, non-judgmental language.
- Return JSON only, without Markdown fences or additional text.
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

  const actualKeys = Object.keys(result).sort();

  if (
    JSON.stringify(actualKeys) !==
    JSON.stringify(expectedKeys)
  ) {
    return false;
  }

  return (
    typeof result.summary === 'string' &&
    Array.isArray(result.themes) &&
    result.themes.every(
      (item: unknown) => typeof item === 'string',
    ) &&
    Array.isArray(result.emotionalTone) &&
    result.emotionalTone.every(
      (item: unknown) => typeof item === 'string',
    ) &&
    typeof result.reflection === 'string' &&
    Array.isArray(result.suggestedActions) &&
    result.suggestedActions.every(
      (item: unknown) => typeof item === 'string',
    )
  );
}

async function analyzeEntry(
  entry: string,
): Promise<{
  analysis: EntryAnalysisResult;
  latencyMs: number;
  finishReason: string | null;
  usage: unknown;
}> {
  if (!process.env.NVIDIA_API_KEY) {
    throw new Error(
      'NVIDIA_API_KEY is missing. Check your backend .env file.',
    );
  }

  const startedAt = performance.now();

  const completion = await client.chat.completions.create({
    model: NVIDIA_MODEL,
    messages: [
      {
        role: 'system',
        content: systemPrompt,
      },
      {
        role: 'user',
        content: `Analyze this journal entry:\n${entry}`,
      },
    ],
    temperature: 0.2,
    max_tokens: 1200,
    stream: false,
  });

  const latencyMs = Math.round(
    performance.now() - startedAt,
  );

  const choice = completion.choices[0];
  const content = choice?.message?.content;

  if (typeof content !== 'string' || !content.trim()) {
    throw new Error(
      `Empty model response. Finish reason: ${choice?.finish_reason ?? 'unknown'
      }`,
    );
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error(
      `Invalid JSON returned by NVIDIA:\n${content}`,
    );
  }

  if (!validateAnalysis(parsed)) {
    throw new Error(
      `Response schema validation failed:\n${JSON.stringify(
        parsed,
        null,
        2,
      )}`,
    );
  }

  return {
    analysis: parsed,
    latencyMs,
    finishReason: choice.finish_reason,
    usage: completion.usage,
  };
}

describe('NVIDIA Entry Analysis API', () => {
  it.each(journalTestCases)(
    'analyzes a $name',
    async ({ name, entry, expectedSignals }) => {
      const result = await analyzeEntry(entry);
      const { analysis } = result;

      // Structural validation
      expect(validateAnalysis(analysis)).toBe(true);

      // Text fields must contain meaningful output.
      expect(analysis.summary.trim().length).toBeGreaterThan(0);
      expect(analysis.reflection.trim().length).toBeGreaterThan(0);

      // Avoid empty or whitespace-only array items.
      for (const field of [
        analysis.themes,
        analysis.emotionalTone,
        analysis.suggestedActions,
      ]) {
        expect(
          field.every((item) => item.trim().length > 0),
        ).toBe(true);
      }

      expect(result.latencyMs).toBeGreaterThan(0);

      console.log(`\n--- ${name.toUpperCase()} ---`);
      console.log('Model:', NVIDIA_MODEL);
      console.log('Latency:', `${result.latencyMs} ms`);
      console.log('Finish reason:', result.finishReason);
      console.log('Usage:', result.usage);
      console.log(
        'Analysis:',
        JSON.stringify(analysis, null, 2),
      );

      // These are review cues, not strict assertions.
      // The model may use different wording for the same idea.
      console.log('Review for:', expectedSignals.join(', '));
    },
    120_000,
  );
});
