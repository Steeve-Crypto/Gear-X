import { Agent, AgentContext, AgentResult, Insight } from './types';
import { searchInsights, loadAllInsights } from '../services/database';
import { callLocalLLM } from '../services/llm';

/**
 * Retriever Agent (Planet 7)
 * Answers natural-language questions against the SQLite vault.
 * Uses keyword search + optional local LLM synthesis.
 */
export const retrieverAgent: Agent = {
  id: 'retriever',
  name: 'Retriever',
  description: 'Answers natural-language questions against everything the system has heard.',
  continuous: false,

  async run(ctx: AgentContext): Promise<AgentResult> {
    const query = (ctx.userQuery || '').trim();

    if (!query) {
      return {
        agentId: 'retriever',
        success: true,
        data: { answer: null, matches: [], message: 'No question provided' },
      };
    }

    try {
      // 1. Pull relevant insights from the vault
      let matches = await searchInsights(query, 10);

      // If keyword search is weak, fall back to recent insights
      if (matches.length === 0) {
        const all = await loadAllInsights();
        matches = all.slice(-8);
      }

      if (matches.length === 0) {
        return {
          agentId: 'retriever',
          success: true,
          data: {
            answer: 'The vault is still empty. Listen to a conversation first.',
            matches: [],
            source: 'empty',
          },
        };
      }

      // 2. Try local LLM to synthesize a clean answer
      const contextBlock = matches
        .map((m, i) => `${i + 1}. [${m.type}] ${m.content}`)
        .join('\n');

      const system = `You are the Retriever agent inside Gear X, a living knowledge clock.
Answer the user question using ONLY the provided insights from the vault.
Be concise, direct, and truthful. If the insights are insufficient, say so.
Do not invent facts.`;

      const user = `Question: ${query}\n\nInsights from the vault:\n${contextBlock}`;

      let answer = await callLocalLLM(system, user, { temperature: 0.2, maxTokens: 300 });
      let source: 'llm' | 'fallback' = 'llm';

      // 3. Fallback: simple concatenation if LLM is offline
      if (!answer) {
        source = 'fallback';
        answer =
          `Based on ${matches.length} insight(s) in the vault:\n` +
          matches
            .slice(0, 4)
            .map((m) => `• (${m.type}) ${m.content}`)
            .join('\n');
      }

      return {
        agentId: 'retriever',
        success: true,
        data: {
          answer,
          matches,
          matchCount: matches.length,
          source,
          query,
        },
      };
    } catch (error: any) {
      console.error('[Retriever] Failed:', error);
      return {
        agentId: 'retriever',
        success: false,
        error: error?.message || 'Retrieval failed',
      };
    }
  },
};
