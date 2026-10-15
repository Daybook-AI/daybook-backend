import { BadRequestException, ConflictException, Inject, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { EntryAnalysis } from 'generated/prisma/client';
import { IResponse } from 'src/core/common/interface';
import { ErrorMessagesEnum } from 'src/core/enums/errors.enum';
import { IEntryAnalysis, IEntryAnalysisContentApiResponse } from 'src/core/interfaces/entry-analysis.interface';
import { JournalContentType } from 'src/core/interfaces/journal.interface';
import { IEntryAnalysisReposiotry } from 'src/core/repositories/interface/entry-analysis-repo.interface';
import { IJournalRepository } from 'src/core/repositories/interface/journal-repo.interface';
import { ENTRY_ANALYSIS_REPOSITORY, JOURNAL_REPOSITORY } from 'src/core/tokens/repository.token';
import { createContentHash } from 'src/core/utility/implementation/content-hash';
import { IAITextGenerator } from 'src/infra/ai/interfaces/ai-text-generator.interface';
import { ENTRY_ANALYSIS_SYSTEM_PROMPT } from 'src/infra/ai/prompts/entry-analysis.prompt';
import { AI_TEXT_GENERATOR } from 'src/infra/ai/tokens/ai.tokens';
import { IEntryAnalysisService } from 'src/modules/entry-analysis/services/interfaces/entry-analysis-service.interface';


@Injectable()
export class EntryAnalysisService implements IEntryAnalysisService {
    constructor(
        @Inject(AI_TEXT_GENERATOR)
        private readonly _aiTextGenerator: IAITextGenerator,
        @Inject(JOURNAL_REPOSITORY)
        private readonly _journalRepository: IJournalRepository,
        @Inject(ENTRY_ANALYSIS_REPOSITORY)
        private readonly _entryAnalysisRepository: IEntryAnalysisReposiotry,

    ) { }

    async generateAnalysis(journalId: number, userId: number): Promise<IResponse<IEntryAnalysis>> {
        if (!Number.isInteger(journalId) || !Number.isInteger(userId)) {
            throw new BadRequestException(ErrorMessagesEnum.BadRequest);
        }

        const getEntryAnalysisResponse = (analysis: EntryAnalysis): IEntryAnalysis => ({
            id: analysis.id,
            journalId: analysis.journalId,
            contentHash: analysis.contentHash,
            emotionalTone: analysis.emotionalTone,
            createdAt: analysis.createdAt,
            reflection: analysis.reflection,
            suggestedActions: analysis.suggestedActions,
            summary: analysis.summary,
            themes: analysis.themes,
            aiModel: analysis.aiModel,
        });

        const journal = await this._journalRepository.findOneByJournalId(
            journalId,
            userId,
        );

        if (!journal) {
            throw new NotFoundException(ErrorMessagesEnum.FailedDbOp);
        }

        const journalContent = this._extractJournalText(journal.content);

        const currentHash = createContentHash(journalContent);

        const existingAnalysis = await this._entryAnalysisRepository.findOneByJournalId(
            journal.id,
            currentHash,
        );

        if (existingAnalysis) {
            return {
                status: 'success',
                message: 'Existing analysis fetched',
                data: getEntryAnalysisResponse(existingAnalysis),
            };
        }

        const result = await this._aiTextGenerator.generate({
            messages: [
                {
                    role: 'system',
                    content: ENTRY_ANALYSIS_SYSTEM_PROMPT,
                },
                {
                    role: 'user',
                    content: journalContent,
                },
            ],
            options: {
                temperature: 0.3,
                maxTokens: 1_000,
            },
        });

        let analysisContent: IEntryAnalysisContentApiResponse;

        try {
            analysisContent = JSON.parse(result.content);
        } catch {
            throw new InternalServerErrorException(
                'Failed to parse AI analysis response',
            );
        }

        const savedAnalysis = await this._entryAnalysisRepository.create({
            journalId: journal.id,
            contentHash: currentHash,
            summary: analysisContent.summary,
            themes: analysisContent.themes,
            emotionalTone: analysisContent.emotionalTone,
            reflection: analysisContent.reflection,
            suggestedActions: analysisContent.suggestedActions,
            aiModel: result.model,
        });

        return {
            status: 'success',
            message: 'Analysis generated successfully',
            data: getEntryAnalysisResponse(savedAnalysis),
        };
    }

    private _extractJournalText(content: JournalContentType | null | undefined): string {
        const visited = new Set<object>();
        const texts: string[] = [];

        const walk = (node: Record<string, unknown> | null | undefined): void => {
            if (!node || typeof node !== 'object') {
                return;
            }

            if (visited.has(node)) {
                return;
            }

            visited.add(node);

            if (typeof node['text'] === 'string') {
                texts.push(node['text']);
            }

            if (Array.isArray(node['content'])) {
                for (const child of node['content']) {
                    if (child && typeof child === 'object' && !Array.isArray(child)) {
                        walk(child as Record<string, unknown>);
                    }
                }
            }
        };

        walk(content as Record<string, unknown> | null | undefined);

        return texts.join(' ').trim();
    }
}

