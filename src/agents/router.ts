import { Agent, AgentContext, AgentResult, AgentId } from './types';

/**
 * Router Agent (the Sun)
 * Decides which planetary agents to activate based on the current context.
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

    // New speech → Extractor + Connector + Visualizer + Archivist
    if (ctx.recentTranscript && ctx.recentTranscript.length > 20) {
      activeAgents.push('extractor');
      activeAgents.push('connector');
      activeAgents.push('visualizer');
      activeAgents.push('archivist');
    }

    // If user asked a question, wake Retriever
    if (ctx.userQuery) {
      activeAgents.push('retriever');
    }

    // Periodically wake Summarizer and Questioner
    if (ctx.currentInsights.length > 0 && ctx.currentInsights.length % 5 === 0) {
      activeAgents.push('summarizer');
      activeAgents.push('questioner');
    }

    // Always archive when we have any insights
    if (ctx.currentInsights.length > 0) {
      activeAgents.push('archivist');
    }

    return {
      agentId: 'router',
      success: true,
      data: {
        activeAgents: [...new Set(activeAgents)],
        reason: 'Context-based routing',
      },
    };
  },
};
