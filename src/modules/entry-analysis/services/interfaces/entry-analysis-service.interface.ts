import { IResponse } from "src/core/common/interface";
import { IEntryAnalysis } from "src/core/interfaces/entry-analysis.interface";

export interface IEntryAnalysisService {
    generateAnalysis(journaId: number, userId: number): Promise<IResponse<IEntryAnalysis>>;
}