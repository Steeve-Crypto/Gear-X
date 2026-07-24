import { knowledgeRepository } from '../repositories/knowledgeRepository';
import { Agent, AgentResult, Insight } from './types';

/**
 * Weaver creates explicit, inspectable relationships. It never treats
 * concatenated insight text as a relationship.
 */
export const weaverAgent: Agent = {
  id: 'weaver',
  name: 'Weaver',
  description: 'Creates durable narrative threads with explicit relationship rationales.',
  continuous: false,
  idempotent: true,

  async run(ctx): Promise<AgentResult> {
    const insights = ctx.currentInsights ?? [];
    if (insights.length < 2) {
      return {
        agentId: 'weaver',
        success: true,
        data: { threads: [], message: 'Need at least two insights to weave.' },
      };
    }

    const byType = new Map<Insight['type'], Insight[]>();
    for (const insight of insights) {
      byType.set(insight.type, [...(byType.get(insight.type) ?? []), insight]);
    }

    const threads: Array<{
      id: string;
      theme: string;
      count: number;
      rationale: string;
      insightIds: string[];
    }> = [];
    for (const [type, related] of byType) {
      if (related.length < 2) continue;
      const rationale =
        `These records share the "${type}" classification and form one inspectable knowledge pattern.`;
      const id = await knowledgeRepository.saveThread({
        id: `thread_type_${type}`,
        title: `${type.replace('_', ' ')} thread`,
        description: `A durable relationship between ${related.length} ${type.replace('_', ' ')} insights.`,
        confidence: 0.72,
        links: related.map((insight) => ({
          insightId: insight.id,
          relationship: 'shared_classification',
          rationale,
          confidence: Math.min(insight.confidence, 0.8),
        })),
      });
      threads.push({
        id,
        theme: type,
        count: related.length,
        rationale,
        insightIds: related.map((insight) => insight.id),
      });
    }

    return {
      agentId: 'weaver',
      success: true,
      data: {
        threads,
        threadCount: threads.length,
        message: `Wove ${threads.length} inspectable thread(s).`,
      },
      events: threads.map((thread) => ({
        type: 'link_created',
        payload: thread.rationale,
        timestamp: Date.now(),
      })),
    };
  },
};
