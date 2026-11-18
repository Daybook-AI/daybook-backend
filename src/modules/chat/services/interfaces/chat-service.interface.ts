
import { ChatConversation, ChatMessage } from 'generated/prisma/client';
import { IApiResponse } from 'src/core/common/interface';

export interface IChatService {
    getConversations(userId: number): Promise<IApiResponse<ChatConversation[]>>;

    getConversation(
        userId: number,
        conversationId: number,
    ): Promise<IApiResponse<{
        conversation: ChatConversation;
        messages: ChatMessage[];
    }>>;

    renameConversation(
        userId: number,
        conversationId: number,
        title: string,
    ): Promise<IApiResponse<ChatConversation>>;

    deleteConversation(
        userId: number,
        conversationId: number,
    ): Promise<IApiResponse<{ success: boolean }>>;

    sendMessage(
        userId: number,
        content: string,
        conversationId: number | null,
    ): Promise<IApiResponse<{
        conversation: ChatConversation;
        messages: ChatMessage[];
    }>>;
}
