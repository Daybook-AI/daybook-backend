import { ChatMessage, ChatRole } from 'generated/prisma/client';

export interface IChatMessageRepository {
    create(
        conversationId: number,
        role: ChatRole,
        content: string,
    ): Promise<ChatMessage>;

    findById(id: number): Promise<ChatMessage | null>;

    findAllByConversationId(
        conversationId: number,
        skip: number,
        take: number,
    ): Promise<ChatMessage[]>;

    findRecentByConversationId(
        conversationId: number,
        take: number,
    ): Promise<ChatMessage[]>;

    findAfterMessageId(
        conversationId: number,
        afterMessageId: number | null,
    ): Promise<ChatMessage[]>;

    findRecentAfterMessageId(
        conversationId: number,
        afterMessageId: number | null,
        take: number,
    ): Promise<ChatMessage[]>;

    countByConversationId(
        conversationId: number,
    ): Promise<number>;
}