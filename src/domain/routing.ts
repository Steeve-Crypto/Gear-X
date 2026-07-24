import type { AgentId } from '../agents/types';

export interface RoutingInput {
  isListening: boolean;
  transcriptLength: number;
  insightCount: number;
  hasUserQuery: boolean;
}

export function decideAgents(input: RoutingInput): AgentId[] {
  const agents: AgentId[] = [];
  if (input.isListening) agents.push('listener');
  if (input.transcriptLength > 20) {
    agents.push('extractor', 'weaver', 'visualizer', 'archivist');
  }
  if (input.hasUserQuery) agents.push('retriever');
  if (input.insightCount >= 5 && input.insightCount % 5 === 0) {
    agents.push('summarizer', 'questioner');
  }
  if (input.insightCount > 0) agents.push('archivist');
  return [...new Set(agents)];
}
