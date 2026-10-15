export type AIMessageRole = 'system' | 'user' | 'assistant';

export interface IAIMessage {
    role: AIMessageRole;
    content: string;
}

export interface IAICompletionOptions {
    temperature?: number;
    maxTokens?: number;
}

export interface IAICompletionRequest {
    messages: IAIMessage[];
    options?: IAICompletionOptions;
}

export interface IAICompletionResult {
    content: string;
    model: string;
    inputTokens?: number;
    outputTokens?: number;
}