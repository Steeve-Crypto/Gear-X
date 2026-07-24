import { Agent, AgentContext, AgentResult, Insight, KnowledgeEvent } from './types';

/**
 * Extractor Agent
 * Pulls structured insights from the live transcript.
 * MVP uses rule-based + pattern extraction.
 * Later: local LLM (Qwen / Llama) for high-quality extraction.
 */
export const extractorAgent: Agent = {
  id: 'extractor',
  name: 'Extractor',
  description: 'Pulls facts, decisions, action items, entities, deadlines, and open loops from the transcript.',
  continuous: false,

  async run(ctx: AgentContext): Promise<AgentResult> {
    if (!ctx.recentTranscript || ctx.recentTranscript.length < 10) {
      return {
        agentId: 'extractor',
        success: true,
        data: { insights: [] },
        events: [],
      };
    }

    const text = ctx.recentTranscript.toLowerCase();
    const insights: Insight[] = [];
    const now = Date.now();

    // Simple pattern-based extraction for the MVP demo
    // (replace with real LLM call later)
    const patterns: { type: Insight['type']; keywords: string[]; template: string }[] = [
      { type: 'action', keywords: ['need to', 'should', 'must', 'todo', 'action'], template: 'Action item detected' },
      { type: 'decision', keywords: ['decided', 'agreed', 'we will', 'going with'], template: 'Decision captured' },
      { type: 'deadline', keywords: ['by friday', 'deadline', 'due', 'tomorrow', 'next week'], template: 'Deadline mentioned' },
      { type: 'entity', keywords: ['project', 'client', 'team', 'meeting'], template: 'Key entity referenced' },
      { type: 'fact', keywords: ['is', 'are', 'was', 'were', 'has'], template: 'Fact extracted' },
      { type: 'open_loop', keywords: ['maybe', 'not sure', 'question', 'wondering', '?'], template: 'Open loop / question' },
    ];

    for (const p of patterns) {
      if (p.keywords.some((k) => text.includes(k))) {
        insights.push({
          id: `ins_${now}_${Math.random().toString(36).slice(2, 7)}`,
          type: p.type,
          content: `${p.template}: "${ctx.recentTranscript.slice(0, 80)}${ctx.recentTranscript.length > 80 ? '...' : ''}"`,
          sourceTimestamp: now,
          confidence: 0.7 + Math.random() * 0.2,
          linkedInsightIds: [],
          createdAt: now,
        });
      }
    }

    // Always produce at least one insight when we have speech (demo friendliness)
    if (insights.length === 0 && ctx.recentTranscript.length > 15) {
      insights.push({
        id: `ins_${now}_gen`,
        type: 'fact',
        content: `Conversation fragment: "${ctx.recentTranscript.slice(0, 100)}"`,
        sourceTimestamp: now,
        confidence: 0.6,
        linkedInsightIds: [],
        createdAt: now,
      });
    }

    const events: KnowledgeEvent[] = insights.map((ins) => ({
      type: 'new_insight',
      payload: ins,
      timestamp: now,
    }));

    return {
      agentId: 'extractor',
      success: true,
      data: { insights, count: insights.length },
      events,
    };
  },
};
