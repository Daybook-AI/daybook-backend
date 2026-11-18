import { Injectable } from '@nestjs/common';
import { ChatMessage, ChatRole } from 'generated/prisma/client';

import { PrismaService } from 'src/core/config/prisma/prisma.service';
import { IChatMessageRepository } from 'src/core/repositories/interface/chat-message-repo.interface';

@Injectable()
export class ChatMessageRepository implements IChatMessageRepository {

    constructor(
        private readonly _prisma: PrismaService,
    ) { }

    create(
        conversationId: number,
        role: ChatRole,
        content: string,
    ): Promise<ChatMessage> {
        return this._prisma.chatMessage.create({
            data: {
                conversationId,
                role,
                content,
            },
        });
    }

    findById(
        id: number,
    ): Promise<ChatMessage | null> {
        return this._prisma.chatMessage.findUnique({
            where: { id },
        });
    }

    findAllByConversationId(
        conversationId: number,
        skip: number,
        take: number,
    ): Promise<ChatMessage[]> {
        return this._prisma.chatMessage.findMany({
            where: { conversationId },
            orderBy: [
                { createdAt: 'asc' },
                { id: 'asc' },
            ],
            skip,
            take,
        });
    }

    findRecentByConversationId(
        conversationId: number,
        take: number,
    ): Promise<ChatMessage[]> {
        return this._prisma.chatMessage.findMany({
            where: { conversationId },
            orderBy: [
                { createdAt: 'desc' },
                { id: 'desc' },
            ],
            take,
        });
    }

    findAfterMessageId(
        conversationId: number,
        afterMessageId: number | null,
    ): Promise<ChatMessage[]> {
        return this._prisma.chatMessage.findMany({
            where: {
                conversationId,
                ...(afterMessageId !== null
                    ? {
                        id: {
                            gt: afterMessageId,
                        },
                    }
                    : {}),
            },
            orderBy: {
                id: 'asc',
            },
        });
    }

    findRecentAfterMessageId(
        conversationId: number,
        afterMessageId: number | null,
        take: number,
    ): Promise<ChatMessage[]> {
        return this._prisma.chatMessage.findMany({
            where: {
                conversationId,
                ...(afterMessageId !== null
                    ? {
                        id: {
                            gt: afterMessageId,
                        },
                    }
                    : {}),
            },
            orderBy: {
                id: 'desc',
            },
            take,
        });
    }

    countByConversationId(
        conversationId: number,
    ): Promise<number> {
        return this._prisma.chatMessage.count({
            where: { conversationId },
        });
    }
}