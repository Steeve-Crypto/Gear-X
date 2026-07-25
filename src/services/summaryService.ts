import { Insight } from '../agents/types';
import { summarizerAgent } from '../agents/summarizer';
import { VaultInsight } from '../domain/models';
import { knowledgeRepository } from '../repositories/knowledgeRepository';
import {
  deleteSummary,
  loadAllSummaries,
  SummaryRecord,
  updateSummary,
} from './database';

export type SummaryRequest =
  | { scope: 'session'; sourceId: string }
  | { scope: 'thread'; sourceId: string }
  | { scope: 'daily'; date: string };

function toAgentInsight(item: VaultInsight): Insight {
  return {
    id: item.id,
    sessionId: item.sessionId,
    type: item.type,
    content: item.content,
    sourceTimestamp: item.createdAt,
    sourceSegmentIds: item.sourceSegmentIds,
    confidence: item.confidence,
    linkedInsightIds: [],
    pinned: item.pinned,
    archived: item.archived,
    unresolved: item.unresolved,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

async function sourceInsights(request: SummaryRequest): Promise<Insight[]> {
  if (request.scope === 'thread') {
    const detail = await knowledgeRepository.thread(request.sourceId);
    return detail?.links.map(toAgentInsight) ?? [];
  }
  if (request.scope === 'session') {
    return (await knowledgeRepository.insights({
      sessionId: request.sourceId,
      includeArchived: true,
      limit: 100,
    })).map(toAgentInsight);
  }
  const start = Date.parse(`${request.date}T00:00:00`);
  if (!Number.isFinite(start)) return [];
  return (await knowledgeRepository.insights({
    includeArchived: true,
    createdAfter: start,
    createdBefore: start + 86_400_000 - 1,
    limit: 100,
  })).map(toAgentInsight);
}

export const summaryService = {
  list: loadAllSummaries,
  update: updateSummary,
  remove: deleteSummary,
  async generate(request: SummaryRequest): Promise<SummaryRecord | null> {
    const insights = await sourceInsights(request);
    const result = await summarizerAgent.run({
      recentTranscript: '',
      currentInsights: insights,
      isListening: false,
      sessionId: request.scope === 'session' ? request.sourceId : undefined,
      threadId: request.scope === 'thread' ? request.sourceId : undefined,
      summaryScope: request.scope,
    });
    return result.data?.summary ?? null;
  },
  async regenerate(summary: SummaryRecord): Promise<SummaryRecord | null> {
    const request: SummaryRequest = summary.scope === 'thread' && summary.threadId
      ? { scope: 'thread', sourceId: summary.threadId }
      : summary.scope === 'daily'
        ? { scope: 'daily', date: new Date(summary.createdAt).toISOString().slice(0, 10) }
        : { scope: 'session', sourceId: summary.sessionId ?? '' };
    const next = await this.generate(request);
    if (next) await deleteSummary(summary.id);
    return next;
  },
};
