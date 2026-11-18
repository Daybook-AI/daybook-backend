import {
    Injectable,
    Inject,
    Logger,
    InternalServerErrorException,
} from '@nestjs/common';

import { ChatRole } from 'generated/prisma/enums';

import { IChatConversationRepository } from 'src/core/repositories/interface/chat-conversation-repo.interface';
import { IChatMessageRepository } from 'src/core/repositories/interface/chat-message-repo.interface';

import {
    CHAT_CONVERSATION_REPOSITORY,
    CHAT_MESSAGE_REPOSITORY,
} from 'src/core/tokens/repository.token';

import { IAITextGenerator } from 'src/infra/ai/interfaces/ai-text-generator.interface';
import { CONVERSATION_SUMMARY_COMPRESSION_PROMPT, CONVERSATION_SUMMARY_UPDATE_PROMPT } from 'src/infra/ai/prompts/conversation-summary.prompts';
import { AI_TEXT_GENERATOR } from 'src/infra/ai/tokens/ai.tokens';


const SUMMARY_MAX_LENGTH = 2000;
const SUMMARY_COMPRESSION_THRESHOLD = 1600;

const SUMMARY_COMPRESSION_TARGET = 1500;

const SUMMARY_UPDATE_MAX_TOKENS = 700;
const SUMMARY_COMPRESSION_MAX_TOKENS = 1000;

const MAX_UPDATE_ATTEMPTS = 3;
const RECENT_MESSAGES_TO_KEEP = 20;


@Injectable()
export class ConversationSummaryService {

    private readonly logger = new Logger(
        ConversationSummaryService.name,
    );

    constructor(
        @Inject(CHAT_CONVERSATION_REPOSITORY)
        private readonly _conversationRepository: IChatConversationRepository,

        @Inject(CHAT_MESSAGE_REPOSITORY)
        private readonly _messageRepository: IChatMessageRepository,

        @Inject(AI_TEXT_GENERATOR)
        private readonly _aiTextGenerator: IAITextGenerator,
    ) { }


    /**
     * Updates the accumulated conversation summary.
     *
     * Only messages after summaryThroughMessageId are processed.
     * A successful update advances the checkpoint.
     */
    async updateSummary(conversationId: number): Promise<void> {

        for (
            let attempt = 1;
            attempt <= MAX_UPDATE_ATTEMPTS;
            attempt++
        ) {

            const conversation =
                await this._conversationRepository.findById(conversationId);

            if (!conversation) {
                return;
            }

            const pendingMessages =
                await this._messageRepository.findAfterMessageId(
                    conversationId,
                    conversation.summaryThroughMessageId,
                );

            if (pendingMessages.length <= RECENT_MESSAGES_TO_KEEP) {
                return;
            }

            const messagesToSummarize = pendingMessages.slice(
                0,
                pendingMessages.length - RECENT_MESSAGES_TO_KEEP,
            );
            const latestMessageId =
                messagesToSummarize[messagesToSummarize.length - 1].id;

            try {

                // Generate a compact note from only the new messages.
                const newSummary =
                    await this.generateNewSummary(
                        conversation.summary,
                        messagesToSummarize.map(m => ({
                            role: m.role as ChatRole,
                            content: m.content
                        })),
                    );

                // Append new notes to the existing summary.
                let updatedSummary = this.appendSummary(
                    conversation.summary,
                    newSummary,
                );

                // Compress when the accumulated summary reaches its threshold.
                if (
                    this.getCharacterCount(updatedSummary)
                    >= SUMMARY_COMPRESSION_THRESHOLD
                ) {
                    updatedSummary =
                        await this.compressSummary(updatedSummary);
                }

                // Never persist a summary exceeding the maximum.
                if (
                    this.getCharacterCount(updatedSummary)
                    > SUMMARY_MAX_LENGTH
                ) {
                    throw new InternalServerErrorException(
                        'Generated summary exceeds the maximum length.',
                    );
                }

                // Optimistic locking prevents overwriting a newer summary.
                const saved =
                    await this._conversationRepository
                        .updateSummaryIfVersionMatches(
                            conversationId,
                            conversation.summaryVersion,
                            updatedSummary || null,
                            latestMessageId,
                        );

                if (saved) {
                    this.logger.log(
                        `Conversation ${conversationId} summary updated. ` +
                        `Length: ${this.getCharacterCount(updatedSummary)}`,
                    );

                    return;
                }

                // Another request updated the summary.
                // Reload the latest summary and retry.
                this.logger.debug(
                    `Summary version conflict for conversation ${conversationId}. ` +
                    `Retry ${attempt}/${MAX_UPDATE_ATTEMPTS}.`,
                );

            } catch (error: unknown) {

                this.logger.warn(
                    `Summary update failed for conversation ${conversationId}: ` +
                    `${error instanceof Error ? error.name : 'UnknownError'}`,
                );

                throw error;
            }
        }

        throw new InternalServerErrorException(
            'Unable to update conversation summary after multiple attempts.',
        );
    }

    private async generateNewSummary(
        existingSummary: string | null,
        messages: {
            role: ChatRole;
            content: string;
        }[],
    ): Promise<string> {

        const transcript = messages
            .map((message) => {
                const role =
                    message.role === ChatRole.USER
                        ? 'USER'
                        : 'ASSISTANT';

                return `${role}: ${message.content}`;
            })
            .join('\n\n');

        const prompt =
            CONVERSATION_SUMMARY_UPDATE_PROMPT
                .replace(
                    '{{EXISTING_SUMMARY}}',
                    existingSummary || 'No existing memory.',
                )
                .replace(
                    '{{NEW_MESSAGES}}',
                    transcript,
                );

        const response = await this._aiTextGenerator.generate({
            messages: [
                {
                    role: 'system',
                    content: prompt,
                },
                {
                    role: 'user',
                    content: 'Extract the important new information.',
                },
            ],
            options: {
                temperature: 0.2,
                maxTokens: SUMMARY_UPDATE_MAX_TOKENS,
            },
        });

        const result = response.content.trim();

        if (result.toUpperCase() === 'NO_UPDATE') {
            return '';
        }

        if (!result) {
            throw new InternalServerErrorException(
                'Summary generation returned an empty response.',
            );
        }

        return result;
    }

    private appendSummary(
        existingSummary: string | null,
        newSummary: string,
    ): string {

        if (!newSummary.trim()) {
            return existingSummary || '';
        }

        if (!existingSummary?.trim()) {
            return newSummary.trim();
        }

        return `${existingSummary.trim()}\n${newSummary.trim()}`;
    }

    private async compressSummary(
        summary: string,
    ): Promise<string> {

        const prompt =
            CONVERSATION_SUMMARY_COMPRESSION_PROMPT
                .replace('{{SUMMARY}}', summary)
                .replace(
                    '1500 characters',
                    `${SUMMARY_COMPRESSION_TARGET} characters`,
                );

        const response = await this._aiTextGenerator.generate({
            messages: [
                {
                    role: 'system',
                    content: prompt,
                },
                {
                    role: 'user',
                    content: 'Compress the conversation memory.',
                },
            ],
            options: {
                temperature: 0.1,
                maxTokens: SUMMARY_COMPRESSION_MAX_TOKENS,
            },
        });

        const compressedSummary = response.content.trim();

        if (!compressedSummary) {
            throw new InternalServerErrorException(
                'Summary compression returned an empty response.',
            );
        }

        if (
            this.getCharacterCount(compressedSummary)
            > SUMMARY_MAX_LENGTH
        ) {
            throw new InternalServerErrorException(
                'Compressed summary still exceeds the maximum character limit.',
            );
        }

        return compressedSummary;
    }

    private getCharacterCount(value: string): number {
        return Array.from(value).length;
    }
}