import { JsonValue } from "@prisma/client/runtime/client";

export type JournalContentType = JsonValue;

export interface IJournalDocument {
    type: 'doc';
    content: IJournalNode[];
}

export interface IJournalNode {
    type: string;
    text?: string;
    attrs?: Record<string, unknown>;
    content?: IJournalNode[];
    marks?: IJournalMark[];
}

export interface IJournalMark {
    type: string;
    attrs?: Record<string, unknown>;
}

export interface ICreateJournalData {
    userId: number;
    title: string;
    content: IJournalDocument;
    mood?: string;
    tags?: string[];
}

export interface IUpdateJournalData {
    title?: string;
    content?: IJournalDocument;
    mood?: string | null;
    tags?: string[];
}

export interface IJournalClientResponse {
    id: number;
    title: string;
    content: JournalContentType;
    mood: string | null;
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
}

export interface IJournalFilters {
    page?: number;
    limit?: number;

    search?: string;
    mood?: string;
    tag?: string;

    from?: string;
    to?: string;

    sort?: 'asc' | 'desc';
}