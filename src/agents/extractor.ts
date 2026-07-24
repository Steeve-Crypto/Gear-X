import { Agent, AgentContext, AgentResult, Insight, KnowledgeEvent } from './types';
import { callLocalLLM } from '../services/llm';

/**
 * Extractor Agent
 * Prefers local LLM (Ollama / llama.cpp via Ollama API).
 * Falls back to fast rule-based extraction when offline.
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
        data: { insights: [], source: 'none' },
        events: [],
      };
    }

    const now = Date.now();
    let insights: Insight[] = [];
    let source: 'llm' | 'rules' = 'rules';

    // --- Try local LLM first ---
    const system = `You are the Extractor agent inside Gear X, a living knowledge clock.
Extract structured insights from the conversation transcript.
Return ONLY a valid JSON array of objects. Each object must have:
  "type": one of "fact" | "decision" | "action" | "entity" | "deadline" | "open_loop"
  "content": short clear sentence
  "confidence": number between 0.5 and 1.0

Rules:
- Be concise.
- Prefer high-signal items (decisions, actions, deadlines, open loops).
- Max 5 insights.
- No markdown, no explanation, pure JSON array.`;

    const user = `Transcript:\n"""\n${ctx.recentTranscript}\n"""`;

    const llmRaw = await callLocalLLM(system, user, { temperature: 0.2, maxTokens: 400 });

    if (llmRaw) {
      try {
        // Clean possible markdown fences
        const cleaned = llmRaw.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(cleaned);

        if (Array.isArray(parsed)) {
          insights = parsed.slice(0, 5).map((item: any, i: number) => ({
            id: `ins_${now}_${i}`,
            type: (['fact', 'decision', 'action', 'entity', 'deadline', 'open_loop'].includes(item.type)
              ? item.type
              : 'fact') as Insight['type'],
            content: String(item.content || '').slice(0, 200),
            sourceTimestamp: now,
            confidence: Math.min(1, Math.max(0.5, Number(item.confidence) || 0.75)),
            linkedInsightIds: [],
            createdAt: now,
          }));
          source = 'llm';
        }
      } catch (e) {
        console.warn('[Extractor] LLM JSON parse failed, using rules', e);
      }
    }

    // --- Fallback: rule-based ---
    if (insights.length === 0) {
      const text = ctx.recentTranscript.toLowerCase();
      const patterns: { type: Insight['type']; keywords: string[]; template: string }[] = [
        { type: 'action', keywords: ['need to', 'should', 'must', 'todo', 'action'], template: 'Action item' },
        { type: 'decision', keywords: ['decided', 'agreed', 'we will', 'going with'], template: 'Decision' },
        { type: 'deadline', keywords: ['by friday', 'deadline', 'due', 'tomorrow', 'next week'], template: 'Deadline' },
        { type: 'entity', keywords: ['project', 'client', 'team', 'meeting'], template: 'Entity' },
        { type: 'open_loop', keywords: ['maybe', 'not sure', 'question', 'wondering', '?'], template: 'Open loop' },
        { type: 'fact', keywords: ['is', 'are', 'was', 'were'], template: 'Fact' },
      ];

      for (const p of patterns) {
        if (p.keywords.some((k) => text.includes(k))) {
          insights.push({
            id: `ins_${now}_${Math.random().toString(36).slice(2, 7)}`,
            type: p.type,
            content: `${p.template}: "${ctx.recentTranscript.slice(0, 90)}${ctx.recentTranscript.length > 90 ? '...' : ''}"`,
            sourceTimestamp: now,
            confidence: 0.65 + Math.random() * 0.2,
            linkedInsightIds: [],
            createdAt: now,
          });
        }
      }

      if (insights.length === 0 && ctx.recentTranscript.length > 15) {
        insights.push({
          id: `ins_${now}_gen`,
          type: 'fact',
          content: `Heard: "${ctx.recentTranscript.slice(0, 100)}"`,
          sourceTimestamp: now,
          confidence: 0.55,
          linkedInsightIds: [],
          createdAt: now,
        });
      }
    }

    const events: KnowledgeEvent[] = insights.map((ins) => ({
      type: 'new_insight',
      payload: ins,
      timestamp: now,
    }));

    return {
      agentId: 'extractor',
      success: true,
      data: { insights, count: insights.length, source },
      events,
    };
  },
};
