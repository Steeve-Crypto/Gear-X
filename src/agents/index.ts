/**
 * Gear X Multi-Agent System
 *
 * SOLAR SYSTEM MODEL
 * -----------------
 * The Sun (central core):
 *   • Router  — the only orchestrator.
 *
 * The 8 Planetary Agents:
 *   1. Listener     — real-time STT + speaker awareness
 *   2. Extractor    — pulls structured insights
 *   3. Weaver       — weaves insights into narrative threads (replaces old Connector)
 *   4. Summarizer   — compresses long conversations into durable notes
 *   5. Questioner   — surfaces open loops and clarifying questions
 *   6. Visualizer   — clock-planet animations (orbits, teeth, rings)
 *   7. Retriever    — answers natural-language questions against the vault
 *   8. Archivist    — SQLite long-term storage & restore
 *
 * Router is the Sun. The eight planets do the actual work.
 */

export { routerAgent } from './router';
export { listenerAgent } from './listener';
export { extractorAgent } from './extractor';
export { visualizerAgent } from './visualizer';
export { archivistAgent, restoreKnowledge } from './archivist';
export { retrieverAgent } from './retriever';
export { weaverAgent } from './weaver';
export * from './types';

// Remaining stubs
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
