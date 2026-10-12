import {
    IsArray,
    IsDateString,
    IsIn,
    IsInt,
    IsNotEmpty,
    IsNumber,
    IsObject,
    IsOptional,
    IsString,
    Max,
    MaxLength,
    Min,
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

export class JournalPayloadDto {
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

export class JournalQueryDto {
    // Pagination
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page = 1;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit = 20;

    // Search
    @IsOptional()
    @IsString()
    @MaxLength(100)
    search?: string;

    // Filters
    @IsOptional()
    @IsString()
    mood?: string;

    @IsOptional()
    @IsString()
    tag?: string;

    @IsOptional()
    @IsDateString()
    from?: string;

    @IsOptional()
    @IsDateString()
    to?: string;

    // Sorting
    @IsOptional()
    @IsIn(['asc', 'desc'])
    sort: 'asc' | 'desc' = 'desc';
}