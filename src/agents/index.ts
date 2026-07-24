/**
 * Gear X Multi-Agent System
 *
 * SOLAR SYSTEM MODEL
 * -----------------
 * The Sun (central core):
 *   • Router  — the only orchestrator. Looks at context and decides which planets wake.
 *
 * The 8 Planetary Agents:
 *   1. Listener     — real-time STT + speaker awareness
 *   2. Extractor    — pulls structured insights (facts, actions, deadlines…)
 *   3. Connector    — links new insights into the living knowledge graph
 *   4. Summarizer   — compresses long conversations into durable notes
 *   5. Questioner   — surfaces open loops and clarifying questions
 *   6. Visualizer   — turns knowledge events into gear animations (teeth, speed, glow)
 *   7. Retriever    — answers natural-language questions against everything heard
 *   8. Archivist    — long-term storage, indexing, and persistence (SQLite)
 *
 * Router is the Sun. The other eight are the planets that actually do the work.
 */

export { routerAgent } from './router';
export { listenerAgent } from './listener';
export { extractorAgent } from './extractor';
export { visualizerAgent } from './visualizer';
export { archivistAgent, restoreKnowledge } from './archivist';
export * from './types';

// Remaining planetary agents (stubs for now)
export const connectorAgent = {
  id: 'connector' as const,
  name: 'Connector',
  description: 'Links new insights to existing knowledge and builds the graph.',
  continuous: false,
};

export const summarizerAgent = {
  id: 'summarizer' as const,
  name: 'Summarizer',
  description: 'Compresses long conversations into durable, high-signal notes.',
  continuous: false,
};

export const questionerAgent = {
  id: 'questioner' as const,
  name: 'Questioner',
  description: 'Surfaces clarifying questions and open loops.',
  continuous: false,
};

export const retrieverAgent = {
  id: 'retriever' as const,
  name: 'Retriever',
  description: 'Answers natural language questions against the knowledge store.',
  continuous: false,
};
