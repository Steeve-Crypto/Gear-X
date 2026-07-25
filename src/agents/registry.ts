import { Agent, AgentId } from './types';
import { archivistAgent } from './archivist';
import { extractorAgent } from './extractor';
import { listenerAgent } from './listener';
import { questionerAgent } from './questioner';
import { retrieverAgent } from './retriever';
import { routerAgent } from './router';
import { summarizerAgent } from './summarizer';
import { visualizerAgent } from './visualizer';
import { weaverAgent } from './weaver';

export const agentRegistry = new Map<AgentId, Agent>([
  ['router', { ...routerAgent, retryLimit: 0, privacy: 'local_only', idempotent: true }],
  ['listener', { ...listenerAgent, retryLimit: 0, privacy: 'local_only', idempotent: true }],
  ['extractor', { ...extractorAgent, dependencies: ['listener'], timeoutMs: 15_000, retryLimit: 1, privacy: 'remote_optional', idempotent: true }],
  ['weaver', { ...weaverAgent, dependencies: ['extractor'], timeoutMs: 12_000, retryLimit: 1, privacy: 'local_only', idempotent: true }],
  ['summarizer', { ...summarizerAgent, dependencies: ['extractor'], timeoutMs: 15_000, retryLimit: 1, privacy: 'remote_optional', idempotent: true }],
  ['questioner', { ...questionerAgent, dependencies: ['extractor'], timeoutMs: 15_000, retryLimit: 1, privacy: 'remote_optional', idempotent: true }],
  ['visualizer', { ...visualizerAgent, timeoutMs: 2_000, retryLimit: 0, privacy: 'local_only', idempotent: true }],
  ['retriever', { ...retrieverAgent, timeoutMs: 15_000, retryLimit: 1, privacy: 'remote_optional', idempotent: true }],
  ['archivist', { ...archivistAgent, dependencies: ['extractor'], timeoutMs: 8_000, retryLimit: 1, privacy: 'local_only', idempotent: true }],
]);
