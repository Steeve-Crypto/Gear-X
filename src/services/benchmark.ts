/**
 * Gear X — Local pipeline latency benchmark
 *
 * Measures the hybrid "brain" side (everything that stays local).
 * Grok Voice network legs must be timed separately in the paid client.
 */

import { routerAgent } from '../agents/router';
import { extractorAgent } from '../agents/extractor';
import { weaverAgent } from '../agents/weaver';
import { archivistAgent } from '../agents/archivist';
import { visualizerAgent } from '../agents/visualizer';
import { summarizerAgent } from '../agents/summarizer';
import { questionerAgent } from '../agents/questioner';
import { retrieverAgent } from '../agents/retriever';
import { Insight } from '../agents/types';

export interface StageTiming {
  stage: string;
  ms: number;
}

export interface BenchmarkReport {
  iterations: number;
  transcriptLength: number;
  stages: Record<string, { min: number; mean: number; p95: number; samples: number[] }>;
  totalMeanMs: number;
  notes: string[];
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[Math.max(0, idx)];
}

function summarize(samples: number[]) {
  const sorted = [...samples].sort((a, b) => a - b);
  const mean = samples.reduce((a, b) => a + b, 0) / (samples.length || 1);
  return {
    min: sorted[0] ?? 0,
    mean: Math.round(mean),
    p95: Math.round(percentile(sorted, 95)),
    samples,
  };
}

async function timeStage(name: string, fn: () => Promise<void>): Promise<StageTiming> {
  const t0 = Date.now();
  await fn();
  return { stage: name, ms: Date.now() - t0 };
}

export interface BenchmarkOptions {
  transcript?: string;
  iterations?: number;
  runSummarizer?: boolean;
  runQuestioner?: boolean;
  runRetriever?: boolean;
  retrieverQuery?: string;
}

/**
 * Run the local multi-agent pipeline several times and report latency stats.
 * Does not include mic capture or Grok Voice network time.
 */
export async function runLocalPipelineBenchmark(
  options: BenchmarkOptions = {}
): Promise<BenchmarkReport> {
  const transcript =
    options.transcript ||
    'We need to finish the proposal by Friday and decide on the client meeting. I am not sure about the budget yet.';
  const iterations = options.iterations ?? 3;

  const buckets: Record<string, number[]> = {
    router: [],
    extractor: [],
    weaver: [],
    archivist: [],
    visualizer: [],
  };

  if (options.runSummarizer) buckets.summarizer = [];
  if (options.runQuestioner) buckets.questioner = [];
  if (options.runRetriever) buckets.retriever = [];

  let insights: Insight[] = [];

  for (let i = 0; i < iterations; i++) {
    const ctxBase = {
      recentTranscript: transcript,
      currentInsights: insights,
      isListening: true,
    };

    const r = await timeStage('router', async () => {
      await routerAgent.run(ctxBase);
    });
    buckets.router.push(r.ms);

    let newInsights: Insight[] = [];
    const e = await timeStage('extractor', async () => {
      const result = await extractorAgent.run(ctxBase);
      newInsights = result.data?.insights || [];
    });
    buckets.extractor.push(e.ms);

    insights = [...insights, ...newInsights];

    const w = await timeStage('weaver', async () => {
      await weaverAgent.run({ ...ctxBase, currentInsights: insights });
    });
    buckets.weaver.push(w.ms);

    const a = await timeStage('archivist', async () => {
      await archivistAgent.run({ ...ctxBase, currentInsights: newInsights });
    });
    buckets.archivist.push(a.ms);

    const v = await timeStage('visualizer', async () => {
      await visualizerAgent.run({ ...ctxBase, currentInsights: insights });
    });
    buckets.visualizer.push(v.ms);

    if (options.runSummarizer) {
      const s = await timeStage('summarizer', async () => {
        await summarizerAgent.run({ ...ctxBase, currentInsights: insights });
      });
      buckets.summarizer.push(s.ms);
    }

    if (options.runQuestioner) {
      const q = await timeStage('questioner', async () => {
        await questionerAgent.run({ ...ctxBase, currentInsights: insights });
      });
      buckets.questioner.push(q.ms);
    }

    if (options.runRetriever) {
      const rt = await timeStage('retriever', async () => {
        await retrieverAgent.run({
          recentTranscript: '',
          currentInsights: insights,
          isListening: false,
          userQuery: options.retrieverQuery || 'What is the deadline?',
        });
      });
      buckets.retriever.push(rt.ms);
    }
  }

  const stages: BenchmarkReport['stages'] = {};
  let totalMean = 0;
  for (const [name, samples] of Object.entries(buckets)) {
    stages[name] = summarize(samples);
    // critical-path approximation for one listening turn
    if (['router', 'extractor', 'weaver', 'archivist', 'visualizer'].includes(name)) {
      totalMean += stages[name].mean;
    }
  }

  return {
    iterations,
    transcriptLength: transcript.length,
    stages,
    totalMeanMs: Math.round(totalMean),
    notes: [
      'Times are local brain only (no mic, no Grok Voice network).',
      'Extractor/Summarizer/Questioner/Retriever vary heavily with Ollama model + hardware.',
      'Rules fallback path should stay under ~50ms when LLM is unavailable.',
      'See docs/LATENCY.md for hybrid targets including Grok Voice legs.',
    ],
  };
}
