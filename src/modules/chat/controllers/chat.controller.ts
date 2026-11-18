import { Body, Controller, Delete, Get, Inject, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { IApiResponse } from 'src/core/common/interface';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { ChatConversation, ChatMessage } from 'generated/prisma/client';
import { CHAT_SERVICE } from 'src/core/tokens/service.token';
import { NewMessageDto } from 'src/modules/chat/dtos/chat.dto';
import { IChatService } from 'src/modules/chat/services/interfaces/chat-service.interface';

@Controller('chat')
export class ChatController {

    constructor(
        @Inject(CHAT_SERVICE)
        private readonly _chatService: IChatService,
    ) { }

    @Post('message')
    async sendOrCreateConversations(
        @CurrentUser('sub') userId: number,
        @Body() newMessageDto: NewMessageDto,
    ): Promise<IApiResponse<{ conversation: ChatConversation; messages: ChatMessage[] }>> {
        return this._chatService.sendMessage(
            userId,
            newMessageDto.content,
            newMessageDto.conversationId,
        );
    }

    @Get('conversations')
    async loadConversations(
        @CurrentUser('sub') userId: number,
    ): Promise<IApiResponse<ChatConversation[]>> {
        return this._chatService.getConversations(userId);
    }

    @Get('conversations/:id')
    async loadConversationById(
        @CurrentUser('sub') userId: number,
        @Param('id', ParseIntPipe) conversationId: number,
    ): Promise<IApiResponse<{ conversation: ChatConversation; messages: ChatMessage[] }>> {
        return this._chatService.getConversation(userId, conversationId);
    }

    @Patch('conversations/:id')
    async renameConversationById(
        @CurrentUser('sub') userId: number,
        @Param('id', ParseIntPipe) conversationId: number,
        @Body('title') title: string,
    ): Promise<IApiResponse<ChatConversation>> {
        return this._chatService.renameConversation(userId, conversationId, title);
    }

    @Delete('conversations/:id')
    async deleteConversationById(
        @CurrentUser('sub') userId: number,
        @Param('id', ParseIntPipe) conversationId: number,
    ): Promise<IApiResponse<{ success: boolean }>> {
        return this._chatService.deleteConversation(userId, conversationId);
    }
}
