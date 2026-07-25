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
  sessionId?: string | null;
  type: 'fact' | 'decision' | 'action' | 'entity' | 'deadline' | 'open_loop';
  content: string;
  sourceTimestamp: number;
  sourceSegmentIds?: string[];
  confidence: number;
  linkedInsightIds: string[];
  pinned?: boolean;
  archived?: boolean;
  unresolved?: boolean;
  createdAt: number;
  updatedAt?: number;
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
  sessionId?: string;
  threadId?: string;
  summaryScope?: 'session' | 'daily' | 'thread';
  signal?: AbortSignal;
  remoteConsent?: boolean;
}

export interface AgentResult {
  agentId: AgentId;
  success: boolean;
  data?: {
    activeAgents?: AgentId[];
    reason?: string;
    status?: string;
    transcript?: string;
    confidence?: number;
    speakers?: string[];
    insights?: Insight[];
    source?: string;
    threads?: unknown[];
    threadCount?: number;
    message?: string;
    summary?: {
      id: string;
      title: string;
      body: string;
      insightIds: string[];
      insightCount: number;
      source: 'llm' | 'rules';
      createdAt: number;
      sessionId?: string | null;
      threadId?: string | null;
      updatedAt?: number;
    } | null;
    questions?: string[];
    count?: number;
    answer?: string | null;
    matches?: Insight[];
    matchCount?: number;
    retrievalQuality?: number;
    query?: string;
    saved?: number;
    totalStored?: number;
    commands?: VisualizerCommand[];
    stage?: number;
  };
  events?: KnowledgeEvent[];
  visualCommands?: VisualizerCommand[];
  error?: string;
}

export interface Agent {
  id: AgentId;
  name: string;
  description: string;
  continuous: boolean;
  dependencies?: AgentId[];
  timeoutMs?: number;
  retryLimit?: number;
  privacy?: 'local_only' | 'remote_optional';
  idempotent?: boolean;
  canRun?: (ctx: AgentContext) => boolean;
  run: (ctx: AgentContext) => Promise<AgentResult>;
}
