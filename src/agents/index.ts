/**
 * Gear X — All 8 Agents
 *
 * 1. Router      → Orchestrator. Decides which agents to wake.
 * 2. Listener    → Real-time STT + speaker diarization.
 * 3. Extractor   → Pulls facts, decisions, action items, entities, deadlines.
 * 4. Connector   → Links new insights to existing knowledge (builds the graph).
 * 5. Summarizer  → Compresses long conversations into durable notes.
 * 6. Questioner  → Surfaces clarifying questions / open loops.
 * 7. Visualizer  → Translates knowledge events into gear animations.
 * 8. Retriever   → Answers natural language questions against the knowledge store.
 */

export { routerAgent } from './router';
export { listenerAgent } from './listener';
export * from './types';

// Placeholder stubs for the remaining agents (implemented next)
export const extractorAgent = { id: 'extractor' as const, name: 'Extractor', continuous: false };
export const connectorAgent = { id: 'connector' as const, name: 'Connector', continuous: false };
export const summarizerAgent = { id: 'summarizer' as const, name: 'Summarizer', continuous: false };
export const questionerAgent = { id: 'questioner' as const, name: 'Questioner', continuous: false };
export const visualizerAgent = { id: 'visualizer' as const, name: 'Visualizer', continuous: true };
export const retrieverAgent = { id: 'retriever' as const, name: 'Retriever', continuous: false };
