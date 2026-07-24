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
  ['router', routerAgent],
  ['listener', listenerAgent],
  ['extractor', { ...extractorAgent, dependencies: ['listener'], timeoutMs: 15_000 }],
  ['weaver', { ...weaverAgent, dependencies: ['extractor'], timeoutMs: 12_000 }],
  ['summarizer', { ...summarizerAgent, dependencies: ['extractor'], timeoutMs: 15_000 }],
  ['questioner', { ...questionerAgent, dependencies: ['extractor'], timeoutMs: 15_000 }],
  ['visualizer', { ...visualizerAgent, timeoutMs: 2_000 }],
  ['retriever', { ...retrieverAgent, timeoutMs: 15_000 }],
  ['archivist', { ...archivistAgent, dependencies: ['extractor'], timeoutMs: 8_000 }],
]);
