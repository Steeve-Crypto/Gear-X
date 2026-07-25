export type ProcessingMode = 'local' | 'remote';
export type SessionStatus = 'recording' | 'paused' | 'processing' | 'complete' | 'failed';
export type InsightType = 'fact' | 'decision' | 'action' | 'entity' | 'deadline' | 'open_loop';
export type LoopCategory =
  | 'decision'
  | 'commitment'
  | 'missing_information'
  | 'follow_up'
  | 'risk'
  | 'contradiction'
  | 'question'
  | 'deadline'
  | 'uncertainty';

export interface CaptureSession {
  id: string;
  startedAt: number;
  endedAt: number | null;
  durationMs: number;
  status: SessionStatus;
  audioUri: string | null;
  transcriptionProvider: string;
  inferenceProvider: string;
  processingMode: ProcessingMode;
  createdAt: number;
  updatedAt: number;
}

export interface TranscriptSegment {
  id: string;
  sessionId: string;
  text: string;
  startMs: number;
  endMs: number;
  speakerLabel: string | null;
  confidence: number | null;
  createdAt: number;
}

export interface VaultInsight {
  id: string;
  sessionId: string | null;
  content: string;
  type: InsightType;
  confidence: number;
  sourceSegmentIds: string[];
  pinned: boolean;
  archived: boolean;
  unresolved: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface KnowledgeThread {
  id: string;
  title: string;
  description: string;
  confidence: number;
  createdAt: number;
  updatedAt: number;
}

export interface OpenLoop {
  id: string;
  sessionId: string | null;
  insightId: string | null;
  category: LoopCategory;
  question: string;
  status: 'open' | 'resolved' | 'dismissed';
  priority: 'low' | 'medium' | 'high';
  dueAt: number | null;
  resolution: string | null;
  reminderReady: boolean;
  createdAt: number;
  resolvedAt: number | null;
}

export interface AppSettings {
  reducedMotion: boolean;
  lowPerformanceMode: boolean;
  onboardingComplete: boolean;
  remoteProcessingConsent: boolean;
  retainRecordings: boolean;
  autoSummarize: boolean;
  autoQuestion: boolean;
  processingMode: ProcessingMode;
  ollamaEndpoint: string;
  ollamaModel: string;
  transcriptionProvider: string;
  transcriptionEndpoint: string;
  voiceProvider: string;
  dataRetentionDays: number;
}
