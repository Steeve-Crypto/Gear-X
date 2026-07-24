/**
 * Gear X Multi-Agent System
 *
 * SOLAR SYSTEM MODEL
 * -----------------
 * The Sun (central core):
 *   • Router  — the only orchestrator.
 *
 * The 8 Planetary Agents (ALL ONLINE):
 *   1. Listener     — real-time STT + speaker awareness
 *   2. Extractor    — pulls structured insights
 *   3. Weaver       — weaves insights into narrative threads
 *   4. Summarizer   — compresses insight sets into durable notes
 *   5. Questioner   — surfaces open loops and clarifying questions
 *   6. Visualizer   — clock-planet animations
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
export { summarizerAgent } from './summarizer';
export { questionerAgent } from './questioner';
export * from './types';
