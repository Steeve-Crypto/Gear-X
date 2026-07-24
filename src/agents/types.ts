/**
 * Gear X Multi-Agent System Types
 *
 * Solar system model:
 *   Router = the Sun (central orchestrator)
 *   8 planetary agents do the actual work
 */

export type AgentId =
  | 'router'      // the Sun
  | 'listener'
  | 'extractor'
  | 'weaver'      // replaced old Connector
  | 'summarizer'
  | 'questioner'
  | 'visualizer'
  | 'retriever'
  | 'archivist';

export interface Insight {
  id: string;
  type: 'fact' | 'decision' | 'action' | 'entity' | 'deadline' | 'open_loop';
  content: string;
  sourceTimestamp: number;
  confidence: number;
  linkedInsightIds: string[];
  createdAt: number;
}

export interface KnowledgeEvent {
  type: 'new_insight' | 'link_created' | 'summary_ready' | 'question_surfaced';
  payload: Insight | { fromId: string; toId: string } | string;
  timestamp: number;
}

export interface VisualizerCommand {
  action: 'add_tooth' | 'change_speed' | 'add_linkage' | 'pulse' | 'glow';
  gearIndex?: number;
  intensity?: number;
}

export interface AgentContext {
  recentTranscript: string;
  currentInsights: Insight[];
  isListening: boolean;
  userQuery?: string;
}

export interface AgentResult {
  agentId: AgentId;
  success: boolean;
  data?: any;
  events?: KnowledgeEvent[];
  visualCommands?: VisualizerCommand[];
  error?: string;
}

export interface Agent {
  id: AgentId;
  name: string;
  description: string;
  continuous: boolean;
  run: (ctx: AgentContext) => Promise<AgentResult>;
}
