import { ChatRole } from "generated/prisma/enums";

export interface IMessage {
    id: number;
    conversationId: number;
    role: ChatRole;
    content: string
    createdAt: Date;
}

export interface IConversation {
    id: number;
    userId: number;
    title: string;
    createdAt: Date;
    updatedAt: Date;
}