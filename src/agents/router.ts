import { decideAgents } from '../domain/routing';
import { Agent, AgentResult } from './types';

/**
 * Router is the central orchestrator. It only selects eligible agents;
 * specialist work remains inside the eight planetary agents.
 */
export const routerAgent: Agent = {
  id: 'router',
  name: 'Router',
  description: 'Selects eligible agents from current application context.',
  continuous: true,
  idempotent: true,

  async run(ctx): Promise<AgentResult> {
    const activeAgents = decideAgents({
      isListening: ctx.isListening,
      transcriptLength: ctx.recentTranscript?.length ?? 0,
      insightCount: ctx.currentInsights.length,
      hasUserQuery: Boolean(ctx.userQuery?.trim()),
    });
    return {
      agentId: 'router',
      success: true,
      data: { activeAgents, reason: 'Deterministic context routing' },
    };
  },
};
