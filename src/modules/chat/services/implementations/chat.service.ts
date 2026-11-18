import {
    BadRequestException,
    Inject,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common';

import { ChatConversation, ChatMessage } from 'generated/prisma/client';
import { ChatRole } from 'generated/prisma/enums';

import { IApiResponse } from 'src/core/common/interface';
import { ErrorMessagesEnum } from 'src/core/enums/errors.enum';
import { SuccessMessagesEnum } from 'src/core/enums/success.enum';

import { IChatConversationRepository } from 'src/core/repositories/interface/chat-conversation-repo.interface';
import { IChatMessageRepository } from 'src/core/repositories/interface/chat-message-repo.interface';

import {
    CHAT_CONVERSATION_REPOSITORY,
    CHAT_MESSAGE_REPOSITORY,
} from 'src/core/tokens/repository.token';

import { IAITextGenerator } from 'src/infra/ai/interfaces/ai-text-generator.interface';
import { AI_TEXT_GENERATOR } from 'src/infra/ai/tokens/ai.tokens';

import { CHAT_SYSTEM_PROMPT } from 'src/infra/ai/prompts/chat-system.prompt';

import { ConversationSummaryService } from './conversation-summary.service';
import { IChatService } from 'src/modules/chat/services/interfaces/chat-service.interface';


const CHAT_HISTORY_LIMIT = 20;

@Injectable()
export class ChatService implements IChatService {

    private readonly logger = new Logger(ChatService.name);

    constructor(

        @Inject(CHAT_CONVERSATION_REPOSITORY)
        private readonly _chatConversationRepository: IChatConversationRepository,
        @Inject(CHAT_MESSAGE_REPOSITORY)
        private readonly _chatMessageRepository: IChatMessageRepository,
        @Inject(AI_TEXT_GENERATOR)
        private readonly _aiTextGenerator: IAITextGenerator,
        private readonly _conversationSummaryService: ConversationSummaryService,

    ) { }


    async getConversations(userId: number): Promise<IApiResponse<ChatConversation[]>> {
        if (!Number.isInteger(userId) || userId <= 0) {
            throw new BadRequestException('Invalid user ID.');
        }

        const conversations = await this._chatConversationRepository.findAllByUserId(userId, 0, 50);

        return {
            status: 'success',
            message: SuccessMessagesEnum.ChatConversationsFetchSuccess,
            data: conversations,
        };
    }

    async getConversation(
        userId: number,
        conversationId: number,
    ): Promise<IApiResponse<{
        conversation: ChatConversation;
        messages: ChatMessage[];
    }>> {
        if (!Number.isInteger(userId) || userId <= 0) {
            throw new BadRequestException('Invalid user ID.');
        }

        if (!Number.isInteger(conversationId) || conversationId <= 0) {
            throw new BadRequestException('Invalid conversation ID.');
        }

        const conversation = await this._chatConversationRepository.findByIdAndUserId(
            conversationId,
            userId,
        );

        if (!conversation) {
            throw new NotFoundException(ErrorMessagesEnum.ConversationNotFound);
        }

        const messages = await this._chatMessageRepository.findAllByConversationId(
            conversationId,
            0,
            200,
        );

        return {
            status: 'success',
            message: SuccessMessagesEnum.ChatConversationFetchSuccess,
            data: {
                conversation,
                messages,
            },
        };
    }

    async renameConversation(
        userId: number,
        conversationId: number,
        title: string,
    ): Promise<IApiResponse<ChatConversation>> {
        const trimmedTitle = title?.trim();

        if (!Number.isInteger(userId) || userId <= 0) {
            throw new BadRequestException('Invalid user ID.');
        }

        if (!Number.isInteger(conversationId) || conversationId <= 0) {
            throw new BadRequestException('Invalid conversation ID.');
        }

        if (!trimmedTitle) {
            throw new BadRequestException('Conversation title cannot be empty.');
        }

        const conversation = await this._chatConversationRepository.findByIdAndUserId(
            conversationId,
            userId,
        );

        if (!conversation) {
            throw new NotFoundException(ErrorMessagesEnum.ConversationNotFound);
        }

        const renamedConversation = await this._chatConversationRepository.rename(conversationId, trimmedTitle);

        return {
            status: 'success',
            message: SuccessMessagesEnum.ChatConversationRenameSuccess,
            data: renamedConversation,
        };
    }

    async deleteConversation(
        userId: number,
        conversationId: number,
    ): Promise<IApiResponse<{ success: boolean }>> {
        if (!Number.isInteger(userId) || userId <= 0) {
            throw new BadRequestException('Invalid user ID.');
        }

        if (!Number.isInteger(conversationId) || conversationId <= 0) {
            throw new BadRequestException('Invalid conversation ID.');
        }

        const conversation = await this._chatConversationRepository.findByIdAndUserId(
            conversationId,
            userId,
        );

        if (!conversation) {
            throw new NotFoundException(ErrorMessagesEnum.ConversationNotFound);
        }

        await this._chatConversationRepository.delete(conversationId);

        return {
            status: 'success',
            message: SuccessMessagesEnum.ChatConversationDeleteSuccess,
            data: { success: true },
        };
    }

    async sendMessage(
        userId: number,
        content: string,
        conversationId: number | null,
    ): Promise<IApiResponse<{
        conversation: ChatConversation;
        messages: ChatMessage[];
    }>> {

        if (
            !Number.isInteger(userId) ||
            userId <= 0 ||
            !content?.trim()
        ) {
            throw new BadRequestException(
                ErrorMessagesEnum.EmptySearchQuery,
            );
        }

        if (
            conversationId !== null &&
            (!Number.isInteger(conversationId) || conversationId <= 0)
        ) {
            throw new BadRequestException(
                'Invalid conversation ID.',
            );
        }


        const conversation = conversationId !== null
            ? await this._chatConversationRepository.findByIdAndUserId(
                conversationId,
                userId,
            )
            : await this._chatConversationRepository.create(userId);


        if (!conversation) {
            throw new NotFoundException(
                ErrorMessagesEnum.ConversationNotFound,
            );
        }


        const userMessage =
            await this._chatMessageRepository.create(
                conversation.id,
                ChatRole.USER,
                content.trim(),
            );

        const recentMessages =
            await this._chatMessageRepository.findRecentByConversationId(
                conversation.id,
                CHAT_HISTORY_LIMIT,
            );

        // Reverse to restore chronological order.
        const history = recentMessages.reverse();
        const shouldGenerateTitle =
            history.length === 1 &&
            history[0].id === userMessage.id &&
            conversation.title === 'New Chat';

        const systemPrompt = conversation.summary
            ? `${CHAT_SYSTEM_PROMPT}

CONVERSATION MEMORY:

The following is a summary of important information
from earlier parts of this conversation.

Use it to maintain continuity.

${conversation.summary}

END OF CONVERSATION MEMORY.`
            : CHAT_SYSTEM_PROMPT;


        const replyPromise = this._aiTextGenerator.generate({

            messages: [

                {
                    role: 'system',
                    content: systemPrompt,
                },

                ...history.map((message) => ({
                    role: message.role === ChatRole.USER
                        ? 'user' as const
                        : 'assistant' as const,

                    content: message.content,
                })),

            ],

            options: {
                temperature: 0.3,
                maxTokens: 1_000,
            },

        });

        const titlePromise = shouldGenerateTitle
            ? this.generateConversationTitle(content).catch((error: unknown) => {
                this.logger.warn(
                    `Could not generate title for conversation ${conversation.id}: ` +
                    `${error instanceof Error ? error.name : 'UnknownError'}`,
                );
                return this.createFallbackTitle(content);
            })
            : Promise.resolve(conversation.title);

        const [reply, generatedTitle] = await Promise.all([
            replyPromise,
            titlePromise,
        ]);

        const assistantMessage =
            await this._chatMessageRepository.create(
                conversation.id,
                ChatRole.ASSISTANT,
                reply.content.trim(),
            );

        if (shouldGenerateTitle) {
            await this._chatConversationRepository.rename(
                conversation.id,
                generatedTitle,
            );
        }

        await this._chatConversationRepository.updateActivity(
            conversation.id,
        );

        try {

            await this._conversationSummaryService.updateSummary(
                conversation.id,
            );

        } catch (error: unknown) {

            this.logger.warn(
                `Could not update summary for conversation ${conversation.id}: ` +
                `${error instanceof Error ? error.name : 'UnknownError'}`,
            );

        }

        const updatedConversation =
            await this._chatConversationRepository.findByIdAndUserId(
                conversation.id,
                userId,
            );

        if (!updatedConversation) {
            throw new NotFoundException(
                ErrorMessagesEnum.ConversationNotFound,
            );
        }

        return {
            status: 'success',
            message: SuccessMessagesEnum.ChatMessageSendSuccess,
            data: {
                conversation: updatedConversation,
                messages: [
                    userMessage,
                    assistantMessage,
                ] satisfies ChatMessage[],
            },
        };
    }

    private async generateConversationTitle(message: string): Promise<string> {
        const response = await this._aiTextGenerator.generate({
            messages: [
                {
                    role: 'system',
                    content:
                        'Create a concise, specific title for a personal chat based on the user message. ' +
                        'Use 2 to 6 words. Return only the title, with no quotes or explanation.',
                },
                {
                    role: 'user',
                    content: message,
                },
            ],
            options: {
                temperature: 0.2,
                maxTokens: 32,
            },
        });

        const title = response.content
            .split(/\r?\n/, 1)[0]
            .trim()
            .replace(/^["'“”]+|["'“”]+$/g, '')
            .slice(0, 60)
            .trim();

        return title || this.createFallbackTitle(message);
    }

    private createFallbackTitle(message: string): string {
        const normalized = message.replace(/\s+/g, ' ').trim();

        return normalized.length > 60
            ? `${normalized.slice(0, 57).trimEnd()}...`
            : normalized;
    }
}