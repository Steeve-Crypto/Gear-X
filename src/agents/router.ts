import { Agent, AgentContext, AgentResult, AgentId } from './types';

/**
 * Router Agent
 * Decides which agents to activate based on the current context.
 * This is the brain of the multi-agent system.
 */
export const routerAgent: Agent = {
  id: 'router',
  name: 'Router',
  description: 'Orchestrator. Decides which agents activate for every audio chunk or query.',
  continuous: true,

  async run(ctx: AgentContext): Promise<AgentResult> {
    const activeAgents: AgentId[] = [];

    // Always keep Listener active while recording
    if (ctx.isListening) {
      activeAgents.push('listener');
    }

    // If we have new transcript, wake the Extractor + Connector
    if (ctx.recentTranscript && ctx.recentTranscript.length > 20) {
      activeAgents.push('extractor');
      activeAgents.push('connector');
      activeAgents.push('visualizer');
    }

    // If user asked a question, wake Retriever
    if (ctx.userQuery) {
      activeAgents.push('retriever');
    }

    // Periodically wake Summarizer and Questioner
    // (in real system this would be based on time or insight volume)
    if (ctx.currentInsights.length > 0 && ctx.currentInsights.length % 5 === 0) {
      activeAgents.push('summarizer');
      activeAgents.push('questioner');
    }

    return {
      agentId: 'router',
      success: true,
      data: {
        activeAgents: [...new Set(activeAgents)], // unique
        reason: 'Context-based routing',
      },
    };
  },
};
