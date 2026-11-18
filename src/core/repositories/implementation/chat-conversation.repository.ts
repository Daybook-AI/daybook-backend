import { Injectable } from '@nestjs/common';
import { ChatConversation } from 'generated/prisma/client';

import { PrismaService } from 'src/core/config/prisma/prisma.service';
import { IChatConversationRepository } from 'src/core/repositories/interface/chat-conversation-repo.interface';

@Injectable()
export class ChatConversationRepository
    implements IChatConversationRepository {

    constructor(
        private readonly _prisma: PrismaService,
    ) { }

    create(
        userId: number,
        title = 'New Chat',
    ): Promise<ChatConversation> {
        return this._prisma.chatConversation.create({
            data: {
                userId,
                title,
            },
        });
    }

    findById(
        id: number,
    ): Promise<ChatConversation | null> {
        return this._prisma.chatConversation.findUnique({
            where: { id },
        });
    }

    findByIdAndUserId(
        id: number,
        userId: number,
    ): Promise<ChatConversation | null> {
        return this._prisma.chatConversation.findFirst({
            where: {
                id,
                userId,
            },
        });
    }

    findAllByUserId(
        userId: number,
        skip: number,
        take: number,
    ): Promise<ChatConversation[]> {
        return this._prisma.chatConversation.findMany({
            where: { userId },
            orderBy: { updatedAt: 'desc' },
            skip,
            take,
        });
    }

    rename(
        id: number,
        title: string,
    ): Promise<ChatConversation> {
        return this._prisma.chatConversation.update({
            where: { id },
            data: { title },
        });
    }

    updateActivity(
        id: number,
    ): Promise<ChatConversation> {
        return this._prisma.chatConversation.update({
            where: { id },
            data: {
                updatedAt: new Date(),
            },
        });
    }

    async updateSummaryIfVersionMatches(
        id: number,
        expectedVersion: number,
        summary: string | null,
        throughMessageId: number,
    ): Promise<boolean> {

        const result = await this._prisma.chatConversation.updateMany({
            where: {
                id,
                summaryVersion: expectedVersion,
            },
            data: {
                summary,
                summaryThroughMessageId: throughMessageId,
                summaryUpdatedAt: new Date(),
                summaryVersion: {
                    increment: 1,
                },
                updatedAt: new Date(),
            },
        });

        return result.count === 1;
    }

    delete(
        id: number,
    ): Promise<ChatConversation> {
        return this._prisma.chatConversation.delete({
            where: { id },
        });
    }
}