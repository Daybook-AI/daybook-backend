import {
    IsArray,
    IsNotEmpty,
    IsObject,
    IsOptional,
    IsString,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class JournalDocumentDto {
    @IsString()
    @IsNotEmpty()
    type!: 'doc';

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => JournalNodeDto)
    content!: JournalNodeDto[];
}

export class JournalNodeDto {
    @IsString()
    @IsNotEmpty()
    type!: string;

    @IsOptional()
    @IsString()
    text?: string;

    @IsOptional()
    @IsObject()
    attrs?: Record<string, unknown>;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => JournalNodeDto)
    content?: JournalNodeDto[];

    @IsOptional()
    @IsArray()
    marks?: Record<string, unknown>[];
}

export class CreateJournalDto {
    @IsString()
    @IsNotEmpty()
    title!: string;

    @ValidateNested()
    @Type(() => JournalDocumentDto)
    content!: JournalDocumentDto;

    @IsOptional()
    @IsString()
    mood?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    tags?: string[];
}