export interface IEntryAnalysis {
    id: number;
    journalId: number;
    summary: string;
    themes: string[];
    emotionalTone: string[];
    reflection: string;
    suggestedActions: string[];
    contentHash: string;
    aiModel?: string | null;
    createdAt: Date;
}

export interface IEntryAnalysisContentApiResponse {
    summary: string;
    themes: string[];
    emotionalTone: string[];
    reflection: string;
    suggestedActions: string[];
}

export interface ICreateEntryAnalysis {
    journalId: number;
    contentHash: string;
    aiModel: string;
    summary: IEntryAnalysisContentApiResponse['summary'];
    themes: IEntryAnalysisContentApiResponse['themes'];
    emotionalTone: IEntryAnalysisContentApiResponse['emotionalTone'];
    reflection: IEntryAnalysisContentApiResponse['reflection'];
    suggestedActions: IEntryAnalysisContentApiResponse['suggestedActions'];
}