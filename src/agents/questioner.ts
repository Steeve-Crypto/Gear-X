import { Agent, AgentContext, AgentResult } from './types';
import { callLocalLLM } from '../services/llm';
import { logEvent } from '../services/database';
import { knowledgeRepository } from '../repositories/knowledgeRepository';
import { classifyQuestion } from '../domain/validation';

/**
 * Questioner Agent (Planet 5)
 * Surfaces clarifying questions and unresolved open loops
 * from the current insight set / transcript.
 */
export const questionerAgent: Agent = {
  id: 'questioner',
  name: 'Questioner',
  description: 'Surfaces clarifying questions and open loops the user may want to close.',
  continuous: false,

  async run(ctx: AgentContext): Promise<AgentResult> {
    const insights = ctx.currentInsights || [];
    const transcript = ctx.recentTranscript || '';

    if (insights.length === 0 && transcript.length < 15) {
      return {
        agentId: 'questioner',
        success: true,
        data: { questions: [], message: 'Nothing to question yet' },
      };
    }

    const now = Date.now();
    const insightBlock = insights
      .map((i, idx) => `${idx + 1}. [${i.type}] ${i.content}`)
      .join('\n');

    // --- Try local LLM ---
    const system = `You are the Questioner agent inside Gear X, a living knowledge clock.
Your job is to surface the most useful clarifying questions and unresolved open loops.

Return ONLY a valid JSON array of strings (max 5 questions).
Each string should be a clear, actionable question.
Focus on: missing decisions, unclear owners, vague deadlines, unresolved doubts, next steps.
No markdown. No extra text.`;

    const user = `Insights:\n${insightBlock || '(none)'}\n\nRecent transcript:\n${transcript || '(none)'}`;

    let questions: string[] = [];
    let source: 'llm' | 'rules' = 'rules';

    const llmRaw = await callLocalLLM(system, user, { temperature: 0.3, maxTokens: 300 });

    if (llmRaw) {
      try {
        const cleaned = llmRaw.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        if (Array.isArray(parsed)) {
          questions = parsed
            .map((q) => String(q).trim())
            .filter((q) => q.length > 5 && q.length < 200)
            .slice(0, 5);
          if (questions.length > 0) source = 'llm';
        }
      } catch (e) {
        console.warn('[Questioner] LLM JSON parse failed, using rules', e);
      }
    }

    // --- Rule-based fallback ---
    if (questions.length === 0) {
      source = 'rules';
      const openLoops = insights.filter((i) => i.type === 'open_loop');
      const actions = insights.filter((i) => i.type === 'action');
      const deadlines = insights.filter((i) => i.type === 'deadline');
      const decisions = insights.filter((i) => i.type === 'decision');

      for (const ol of openLoops.slice(0, 2)) {
        questions.push(`Can we resolve this open loop: "${ol.content.slice(0, 80)}"?`);
      }
      if (actions.length && !decisions.length) {
        questions.push('Who owns the listed action items, and by when?');
      }
      if (deadlines.length) {
        questions.push('Are the mentioned deadlines still realistic?');
      }
      if (transcript.toLowerCase().includes('maybe') || transcript.toLowerCase().includes('not sure')) {
        questions.push('What decision is still uncertain and needs a clear yes/no?');
      }
      if (questions.length === 0 && insights.length > 0) {
        questions.push('What is the single most important next step from this conversation?');
      }
    }

    await logEvent('question_surfaced', { questions, source, count: questions.length });
    await knowledgeRepository.saveLoops(
      questions.map((question) => ({
        sessionId: ctx.sessionId ?? null,
        insightId: insights.find((insight) => insight.type === 'open_loop')?.id ?? null,
        category: classifyQuestion(question),
        question,
        priority: question.toLowerCase().includes('deadline') ? 'high' : 'medium',
      })),
    );

    return {
      agentId: 'questioner',
      success: true,
      data: {
        questions,
        count: questions.length,
        source,
        message:
          questions.length > 0
            ? `Surfaced ${questions.length} question(s) · ${source}`
            : 'No open questions found',
      },
      events: questions.map((q) => ({
        type: 'question_surfaced' as const,
        payload: q,
        timestamp: now,
      })),
    };
  },
};
