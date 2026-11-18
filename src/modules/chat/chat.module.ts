import { Module } from '@nestjs/common';
import { ChatController } from './controllers/chat.controller';
import { ChatConversationRepository } from 'src/core/repositories/implementation/chat-conversation.repository';
import { ChatMessageRepository } from 'src/core/repositories/implementation/chat-message.repository';
import { CHAT_CONVERSATION_REPOSITORY, CHAT_MESSAGE_REPOSITORY } from 'src/core/tokens/repository.token';
import { AIModule } from 'src/infra/ai/ai.module';
import { ChatService } from 'src/modules/chat/services/implementations/chat.service';
import { CHAT_SERVICE } from 'src/core/tokens/service.token';
import { ConversationSummaryService } from 'src/modules/chat/services/implementations/conversation-summary.service';

@Module({
    imports: [AIModule],
    controllers: [ChatController],
    providers: [
        ChatConversationRepository,
        ChatMessageRepository,
        ChatService,
        ConversationSummaryService,

        {
            provide: CHAT_CONVERSATION_REPOSITORY,
            useExisting: ChatConversationRepository
        },
        {
            provide: CHAT_MESSAGE_REPOSITORY,
            useExisting: ChatMessageRepository
        },
        {
            provide: CHAT_SERVICE,
            useExisting: ChatService
        }
    ]
})
export class ChatModule { }
