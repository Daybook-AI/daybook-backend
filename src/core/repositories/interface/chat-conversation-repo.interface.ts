import { ChatConversation } from "generated/prisma/client";


export interface IChatConversationRepository {
    create(userId: number, title?: string): Promise<ChatConversation>;

    findById(id: number): Promise<ChatConversation | null>;

    findByIdAndUserId(
        id: number,
        userId: number,
    ): Promise<ChatConversation | null>;

    findAllByUserId(
        userId: number,
        skip: number,
        take: number,
    ): Promise<ChatConversation[]>;

    rename(
        id: number,
        title: string,
    ): Promise<ChatConversation>;

    updateActivity(id: number): Promise<ChatConversation>;

    updateSummaryIfVersionMatches(
        id: number,
        expectedVersion: number,
        summary: string | null,
        throughMessageId: number,
    ): Promise<boolean>;

    delete(id: number): Promise<ChatConversation>;
}
