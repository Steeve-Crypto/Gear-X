/**
 * Gear X tool definitions for Grok Voice session.
 * These are declared to the Voice API so the model can call local agents.
 *
 * Execution happens in the app / backend bridge — never inside Grok alone.
 */

import { extractorAgent } from '../agents/extractor';
import { archivistAgent } from '../agents/archivist';
import { weaverAgent } from '../agents/weaver';
import { retrieverAgent } from '../agents/retriever';
import { summarizerAgent } from '../agents/summarizer';
import { questionerAgent } from '../agents/questioner';
import { Insight } from '../agents/types';

/** OpenAI-style / xAI tool schemas for session.update */
export const GEAR_X_VOICE_TOOLS = [
  {
    type: 'function',
    name: 'save_insights_from_transcript',
    description:
      'Extract structured insights from a transcript snippet and persist them in the local Gear X vault.',
    parameters: {
      type: 'object',
      properties: {
        transcript: { type: 'string', description: 'The speech transcript to process' },
      },
      required: ['transcript'],
    },
  },
  {
    type: 'function',
    name: 'search_vault',
    description: 'Answer a natural-language question against everything Gear X has heard and stored.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string' },
      },
      required: ['query'],
    },
  },
  {
    type: 'function',
    name: 'summarize_vault',
    description: 'Compress current insights into a durable high-signal summary note.',
    parameters: { type: 'object', properties: {} },
  },
  {
    type: 'function',
    name: 'surface_questions',
    description: 'Surface clarifying questions and open loops from the current knowledge.',
    parameters: { type: 'object', properties: {} },
  },
] as const;

export type ToolName =
  | 'save_insights_from_transcript'
  | 'search_vault'
  | 'summarize_vault'
  | 'surface_questions';

export interface ToolContext {
  insightsRef: { current: Insight[] };
  onInsightsUpdated?: (insights: Insight[]) => void;
  onStatus?: (msg: string) => void;
}

/** Execute a tool call against the local solar-system agents */
export async function executeGearXTool(
  name: ToolName,
  args: Record<string, unknown>,
  ctx: ToolContext
): Promise<{ ok: boolean; result: unknown }> {
  const baseCtx = {
    recentTranscript: String(args.transcript || ''),
    currentInsights: ctx.insightsRef.current,
    isListening: false,
  };

  try {
    switch (name) {
      case 'save_insights_from_transcript': {
        const extract = await extractorAgent.run({
          ...baseCtx,
          recentTranscript: String(args.transcript || ''),
          isListening: true,
        });
        const newInsights: Insight[] = extract.data?.insights || [];
        if (newInsights.length) {
          ctx.insightsRef.current = [...ctx.insightsRef.current, ...newInsights];
          await weaverAgent.run({
            ...baseCtx,
            currentInsights: ctx.insightsRef.current,
          });
          await archivistAgent.run({
            ...baseCtx,
            currentInsights: newInsights,
          });
          ctx.onInsightsUpdated?.(ctx.insightsRef.current);
        }
        return {
          ok: true,
          result: {
            saved: newInsights.length,
            samples: newInsights.map((i) => ({ type: i.type, content: i.content })),
          },
        };
      }

      case 'search_vault': {
        const result = await retrieverAgent.run({
          ...baseCtx,
          userQuery: String(args.query || ''),
        });
        return {
          ok: result.success,
          result: {
            answer: result.data?.answer,
            matchCount: result.data?.matchCount,
            source: result.data?.source,
          },
        };
      }

      case 'summarize_vault': {
        const result = await summarizerAgent.run(baseCtx);
        return {
          ok: result.success,
          result: result.data?.summary
            ? {
                title: result.data.summary.title,
                body: result.data.summary.body,
                source: result.data.source,
              }
            : { message: result.data?.message },
        };
      }

      case 'surface_questions': {
        const result = await questionerAgent.run(baseCtx);
        return {
          ok: result.success,
          result: {
            questions: result.data?.questions || [],
            source: result.data?.source,
          },
        };
      }

      default:
        return { ok: false, result: { error: `Unknown tool: ${name}` } };
    }
  } catch (error: unknown) {
    return {
      ok: false,
      result: { error: error instanceof Error ? error.message : 'Tool failed' },
    };
  }
}
