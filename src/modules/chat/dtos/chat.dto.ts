import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class NewMessageDto {
    @IsOptional()
    @IsNumber()
    conversationId: number | null;

    @IsString()
    @IsNotEmpty()
    content!: string;
}