import { GearXError } from '../domain/errors';
import { getAttemptLimit } from '../domain/runtimePolicy';
import { Agent, AgentContext, AgentId, AgentResult } from './types';

export interface RuntimeEvent {
  agentId: AgentId;
  status: 'started' | 'completed' | 'failed' | 'cancelled';
  at: number;
  durationMs?: number;
  error?: string;
  attempt: number;
}

export interface RuntimeOptions {
  signal?: AbortSignal;
  idempotencyKey?: string;
  onEvent?: (event: RuntimeEvent) => void | Promise<void>;
}

export class AgentRuntime {
  private readonly completedKeys = new Set<string>();

  constructor(private readonly agents: Map<AgentId, Agent>) {}

  async execute(ids: AgentId[], context: AgentContext, options: RuntimeOptions = {}) {
    const ordered = this.order([...new Set(ids)]);
    const pipelineContext: AgentContext = { ...context, currentInsights: [...context.currentInsights] };
    const results: AgentResult[] = [];
    for (const id of ordered) {
      if (id === 'router') continue;
      if (options.signal?.aborted) break;
      const agent = this.agents.get(id);
      if (!agent || (agent.canRun && !agent.canRun(pipelineContext))) continue;
      const key = options.idempotencyKey ? `${options.idempotencyKey}:${id}` : '';
      if (key && this.completedKeys.has(key)) continue;
      const result = await this.runWithRetries(agent, pipelineContext, options);
      results.push(result);
      if (result.success && id === 'extractor') {
        const extracted = (result.data?.insights ?? []) as AgentContext['currentInsights'];
        pipelineContext.currentInsights = [...pipelineContext.currentInsights, ...extracted];
      }
      if (result.success && key) this.completedKeys.add(key);
      if (!result.success) break;
    }
    return results;
  }

  private async runWithRetries(
    agent: Agent,
    context: AgentContext,
    options: RuntimeOptions,
  ): Promise<AgentResult> {
    const attemptLimit = getAttemptLimit(agent.retryLimit);
    let result: AgentResult = {
      agentId: agent.id,
      success: false,
      error: `${agent.name} did not run.`,
    };
    for (let attempt = 1; attempt <= attemptLimit; attempt += 1) {
      result = await this.runOne(agent, context, options, attempt);
      if (result.success || options.signal?.aborted) return result;
    }
    return result;
  }

  private async runOne(
    agent: Agent,
    context: AgentContext,
    options: RuntimeOptions,
    attempt: number,
  ): Promise<AgentResult> {
    const started = Date.now();
    await options.onEvent?.({ agentId: agent.id, status: 'started', at: started, attempt });
    const timeoutMs = agent.timeoutMs ?? 15_000;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const controller = new AbortController();
    const abort = () => controller.abort();
    options.signal?.addEventListener('abort', abort, { once: true });
    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeout = setTimeout(
          () => {
            controller.abort();
            reject(new GearXError('TIMEOUT', `${agent.name} timed out.`));
          },
          timeoutMs,
        );
      });
      const result = await Promise.race([
        agent.run({ ...context, signal: controller.signal }),
        timeoutPromise,
      ]);
      const durationMs = Date.now() - started;
      const status = options.signal?.aborted
        ? 'cancelled'
        : result.success
          ? 'completed'
          : 'failed';
      await options.onEvent?.({
        agentId: agent.id,
        status,
        at: Date.now(),
        durationMs,
        error: result.error,
        attempt,
      });
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Agent failed';
      await options.onEvent?.({
        agentId: agent.id,
        status: options.signal?.aborted ? 'cancelled' : 'failed',
        at: Date.now(),
        durationMs: Date.now() - started,
        error: message,
        attempt,
      });
      return { agentId: agent.id, success: false, error: message };
    } finally {
      if (timeout) clearTimeout(timeout);
      options.signal?.removeEventListener('abort', abort);
    }
  }

  private order(ids: AgentId[]): AgentId[] {
    const output: AgentId[] = [];
    const visiting = new Set<AgentId>();
    const visited = new Set<AgentId>();
    const visit = (id: AgentId) => {
      if (visited.has(id)) return;
      if (visiting.has(id)) throw new Error(`Agent dependency cycle at ${id}`);
      visiting.add(id);
      for (const dependency of this.agents.get(id)?.dependencies ?? []) {
        if (ids.includes(dependency)) visit(dependency);
      }
      visiting.delete(id);
      visited.add(id);
      output.push(id);
    };
    ids.forEach(visit);
    return output;
  }
}
