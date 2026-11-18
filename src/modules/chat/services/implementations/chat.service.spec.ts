import { ChatConversation, ChatMessage, ChatRole } from 'generated/prisma/client';
import { IChatConversationRepository } from 'src/core/repositories/interface/chat-conversation-repo.interface';
import { IChatMessageRepository } from 'src/core/repositories/interface/chat-message-repo.interface';
import { IAITextGenerator } from 'src/infra/ai/interfaces/ai-text-generator.interface';
import { ConversationSummaryService } from './conversation-summary.service';
import { ChatService } from './chat.service';

describe('ChatService', () => {
    it('uses an AI-generated title for a conversation created by its first message', async () => {
        const now = new Date();
        const conversation = {
            id: 21,
            userId: 7,
            title: 'New Chat',
            summary: null,
            summaryThroughMessageId: null,
            summaryVersion: 0,
            summaryUpdatedAt: null,
            createdAt: now,
            updatedAt: now,
        } as ChatConversation;
        const titledConversation = {
            ...conversation,
            title: 'Exam Study Plan',
        };
        const userMessage = {
            id: 1,
            conversationId: conversation.id,
            role: ChatRole.USER,
            content: 'Help me make a study plan for my exams.',
            createdAt: now,
        } as ChatMessage;
        const assistantMessage = {
            id: 2,
            conversationId: conversation.id,
            role: ChatRole.ASSISTANT,
            content: 'Let’s make a focused plan.',
            createdAt: now,
        } as ChatMessage;

        const conversationRepository = {
            create: jest.fn().mockResolvedValue(conversation),
            findById: jest.fn(),
            findByIdAndUserId: jest.fn().mockResolvedValue(titledConversation),
            findAllByUserId: jest.fn(),
            rename: jest.fn().mockResolvedValue(titledConversation),
            updateActivity: jest.fn().mockResolvedValue(titledConversation),
            updateSummaryIfVersionMatches: jest.fn(),
            delete: jest.fn(),
        } as unknown as IChatConversationRepository;
        const messageRepository = {
            create: jest.fn()
                .mockResolvedValueOnce(userMessage)
                .mockResolvedValueOnce(assistantMessage),
            findById: jest.fn(),
            findAllByConversationId: jest.fn(),
            findRecentByConversationId: jest.fn().mockResolvedValue([userMessage]),
            findAfterMessageId: jest.fn(),
            findRecentAfterMessageId: jest.fn(),
            countByConversationId: jest.fn(),
        } as unknown as IChatMessageRepository;
        const aiGenerator = {
            generate: jest.fn()
                .mockResolvedValueOnce({
                    content: 'Let’s make a focused plan.',
                    model: 'test-model',
                })
                .mockResolvedValueOnce({
                    content: 'Exam Study Plan',
                    model: 'test-model',
                }),
        } as unknown as IAITextGenerator;
        const summaryService = new ConversationSummaryService(
            conversationRepository,
            messageRepository,
            aiGenerator,
        );
        jest.spyOn(summaryService, 'updateSummary').mockResolvedValue();

        const service = new ChatService(
            conversationRepository,
            messageRepository,
            aiGenerator,
            summaryService,
        );

        const response = await service.sendMessage(
            7,
            userMessage.content,
            null,
        );

        expect(conversationRepository.rename).toHaveBeenCalledWith(
            conversation.id,
            'Exam Study Plan',
        );
        expect(response.data.conversation.title).toBe('Exam Study Plan');
    });

    it('sends recent conversation messages to the AI generator in chronological order', async () => {
        const now = new Date();
        const conversation = {
            id: 12,
            userId: 7,
            title: 'Follow-up',
            summary: 'The user is preparing for an exam.',
            summaryThroughMessageId: 4,
            summaryVersion: 1,
            summaryUpdatedAt: now,
            createdAt: now,
            updatedAt: now,
        } as ChatConversation;
        const recentMessages = [
            { id: 7, conversationId: 12, role: ChatRole.USER, content: 'What should I do next?', createdAt: now },
            { id: 6, conversationId: 12, role: ChatRole.ASSISTANT, content: 'Try studying in short blocks.', createdAt: now },
            { id: 5, conversationId: 12, role: ChatRole.USER, content: 'I only have two days left.', createdAt: now },
        ] as ChatMessage[];
        const userMessage = recentMessages[0];
        const assistantMessage = {
            id: 8,
            conversationId: 12,
            role: ChatRole.ASSISTANT,
            content: 'Start with the highest-priority topics.',
            createdAt: now,
        } as ChatMessage;

        const conversationRepository = {
            create: jest.fn().mockResolvedValue(conversation),
            findById: jest.fn().mockResolvedValue(conversation),
            findByIdAndUserId: jest.fn().mockResolvedValue(conversation),
            findAllByUserId: jest.fn(),
            rename: jest.fn(),
            updateActivity: jest.fn().mockResolvedValue(conversation),
            updateSummaryIfVersionMatches: jest.fn(),
            delete: jest.fn(),
        } as unknown as IChatConversationRepository;
        const messageRepository = {
            create: jest.fn()
                .mockResolvedValueOnce(userMessage)
                .mockResolvedValueOnce(assistantMessage),
            findById: jest.fn(),
            findAllByConversationId: jest.fn(),
            findRecentByConversationId: jest.fn().mockResolvedValue(recentMessages),
            findAfterMessageId: jest.fn(),
            findRecentAfterMessageId: jest.fn(),
            countByConversationId: jest.fn(),
        } as unknown as IChatMessageRepository;
        const aiGenerator = {
            generate: jest.fn().mockResolvedValue({
                content: 'Start with the highest-priority topics.',
                model: 'test-model',
            }),
        } as unknown as IAITextGenerator;
        const summaryService = new ConversationSummaryService(
            conversationRepository,
            messageRepository,
            aiGenerator,
        );
        jest.spyOn(summaryService, 'updateSummary').mockResolvedValue();

        const service = new ChatService(
            conversationRepository,
            messageRepository,
            aiGenerator,
            summaryService,
        );

        await service.sendMessage(7, 'What should I do next?', 12);

        expect(messageRepository.findRecentByConversationId).toHaveBeenCalledWith(12, 20);
        expect(aiGenerator.generate).toHaveBeenCalledTimes(1);
        expect(aiGenerator.generate).toHaveBeenCalledWith(expect.objectContaining({
            messages: [
                expect.objectContaining({ role: 'system' }),
                { role: 'user', content: 'I only have two days left.' },
                { role: 'assistant', content: 'Try studying in short blocks.' },
                { role: 'user', content: 'What should I do next?' },
            ],
        }));
    });
});
