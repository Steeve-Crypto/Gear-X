import { create } from 'zustand';
import { AgentId } from '../agents/types';
import { CaptureSession, TranscriptSegment } from '../domain/models';

interface SessionState {
  current: CaptureSession | null;
  segments: TranscriptSegment[];
  activeAgents: AgentId[];
  lastError: string | null;
  setCurrent: (current: CaptureSession | null) => void;
  addSegment: (segment: TranscriptSegment) => void;
  setActiveAgents: (activeAgents: AgentId[]) => void;
  setLastError: (lastError: string | null) => void;
  reset: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  current: null,
  segments: [],
  activeAgents: [],
  lastError: null,
  setCurrent: (current) => set({ current }),
  addSegment: (segment) => set((state) => ({ segments: [...state.segments, segment] })),
  setActiveAgents: (activeAgents) => set({ activeAgents }),
  setLastError: (lastError) => set({ lastError }),
  reset: () => set({ current: null, segments: [], activeAgents: [], lastError: null }),
}));
