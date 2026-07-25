import { Agent, AgentContext, AgentResult } from './types';
import { saveSummary, logEvent, SummaryRecord } from '../services/database';
import { validateSummaryOutput } from '../domain/validation';
import { requestInference } from '../services/inference';

/**
 * Summarizer Agent (Planet 4)
 * Compresses the current set of insights into a durable, high-signal note.
 * Prefers local LLM; falls back to structured rule-based summary.
 */
export const summarizerAgent: Agent = {
  id: 'summarizer',
  name: 'Summarizer',
  description: 'Compresses long conversations / insight sets into durable, high-signal notes.',
  continuous: false,

  async run(ctx: AgentContext): Promise<AgentResult> {
    const insights = ctx.currentInsights || [];

    if (insights.length < 2) {
      return {
        agentId: 'summarizer',
        success: true,
        data: { summary: null, message: 'Need at least 2 insights to summarize' },
      };
    }

    const now = Date.now();
    const insightBlock = insights
      .map((i, idx) => `${idx + 1}. [${i.type}] ${i.content}`)
      .join('\n');

    // --- Try local LLM ---
    const system = `You are the Summarizer agent inside Gear X, a living knowledge clock.
Produce a durable high-signal summary of the insights below.

Return ONLY valid JSON with this shape:
{
  "title": "short title (max 8 words)",
  "body": "2-5 sentence summary that captures decisions, actions, deadlines, and open loops. Be concrete."
}

No markdown. No extra text.`;

    const user = `Insights to summarize:\n${insightBlock}`;

    let title = '';
    let body = '';
    let source: 'llm' | 'rules' = 'rules';

    const llmRaw = await requestInference(ctx, 'summarize', {
      system,
      prompt: user,
      temperature: 0.25,
      maxTokens: 350,
    });

    if (llmRaw) {
      try {
        const parsed = validateSummaryOutput(llmRaw);
        title = parsed.title;
        body = parsed.body;
        source = 'llm';
      } catch {
        // Invalid provider output falls through to the deterministic local rules.
      }
    }

    // --- Rule-based fallback ---
    if (!title || !body) {
      source = 'rules';
      const byType: Record<string, string[]> = {};
      for (const ins of insights) {
        if (!byType[ins.type]) byType[ins.type] = [];
        byType[ins.type].push(ins.content);
      }

      const parts: string[] = [];
      if (byType.decision?.length) parts.push(`Decisions: ${byType.decision.join('; ')}`);
      if (byType.action?.length) parts.push(`Actions: ${byType.action.join('; ')}`);
      if (byType.deadline?.length) parts.push(`Deadlines: ${byType.deadline.join('; ')}`);
      if (byType.open_loop?.length) parts.push(`Open loops: ${byType.open_loop.join('; ')}`);
      if (byType.fact?.length) parts.push(`Facts: ${byType.fact.slice(0, 3).join('; ')}`);
      if (byType.entity?.length) parts.push(`Entities: ${byType.entity.slice(0, 3).join('; ')}`);

      title = `Summary of ${insights.length} insights`;
      body =
        parts.join(' ') ||
        insights
          .slice(-5)
          .map((i) => i.content)
          .join(' → ');
    }

    const summary: SummaryRecord = {
      id: `sum_${now}`,
      sessionId: ctx.sessionId ?? null,
      threadId: ctx.threadId ?? null,
      scope: ctx.summaryScope ?? (ctx.threadId ? 'thread' : 'session'),
      title,
      body,
      insightIds: insights.map((i) => i.id),
      insightCount: insights.length,
      source,
      createdAt: now,
      updatedAt: now,
    };

    await saveSummary(summary);
    await logEvent('summary_ready', { id: summary.id, title: summary.title, source });

    return {
      agentId: 'summarizer',
      success: true,
      data: {
        summary,
        source,
        message: `Summary ready · ${source}`,
      },
      events: [
        {
          type: 'summary_ready',
          payload: summary.body,
          timestamp: now,
        },
      ],
    };
  },
};
