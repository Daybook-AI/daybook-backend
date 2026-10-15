import type { IAICompletionRequest, IAICompletionResult, } from './ai-completion.types';

export interface IAITextGenerator {
    generate(request: IAICompletionRequest): Promise<IAICompletionResult>;
}