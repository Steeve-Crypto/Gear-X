import { Agent, AgentContext, AgentResult, Insight } from './types';

/**
 * Weaver Agent (replaces the old Connector)
 * Weaves multiple insights into coherent narrative threads / higher-order understanding.
 * This is not just linking IDs — it creates thematic threads the clock can remember.
 */
export const weaverAgent: Agent = {
  id: 'weaver',
  name: 'Weaver',
  description: 'Weaves insights into coherent narrative threads and higher-order patterns.',
  continuous: false,

  async run(ctx: AgentContext): Promise<AgentResult> {
    const insights = ctx.currentInsights || [];

    if (insights.length < 2) {
      return {
        agentId: 'weaver',
        success: true,
        data: { threads: [], message: 'Need at least 2 insights to weave' },
      };
    }

    // Group by type to form simple thematic threads
    const byType: Record<string, Insight[]> = {};
    for (const ins of insights) {
      if (!byType[ins.type]) byType[ins.type] = [];
      byType[ins.type].push(ins);
    }

    const threads = Object.entries(byType)
      .filter(([, list]) => list.length >= 1)
      .map(([type, list]) => ({
        theme: type,
        count: list.length,
        summary: list.map((i) => i.content).join(' → '),
        insightIds: list.map((i) => i.id),
      }));

    // Also create a chronological thread of the most recent items
    const recent = [...insights].slice(-5);
    if (recent.length >= 2) {
      threads.push({
        theme: 'timeline',
        count: recent.length,
        summary: recent.map((i) => i.content).join(' → '),
        insightIds: recent.map((i) => i.id),
      });
    }

    return {
      agentId: 'weaver',
      success: true,
      data: {
        threads,
        threadCount: threads.length,
        message: `Wove ${threads.length} knowledge thread(s)`,
      },
      events: threads.map((t) => ({
        type: 'link_created' as const,
        payload: t.summary,
        timestamp: Date.now(),
      })),
    };
  },
};
