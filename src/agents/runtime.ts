import { GearXError } from '../domain/errors';
import { Agent, AgentContext, AgentId, AgentResult } from './types';

export interface RuntimeEvent {
  agentId: AgentId;
  status: 'started' | 'completed' | 'failed' | 'cancelled';
  at: number;
  durationMs?: number;
  error?: string;
}

export interface RuntimeOptions {
  signal?: AbortSignal;
  idempotencyKey?: string;
  onEvent?: (event: RuntimeEvent) => void;
}

export class AgentRuntime {
  private readonly completedKeys = new Set<string>();

  constructor(private readonly agents: Map<AgentId, Agent>) {}

  async execute(ids: AgentId[], context: AgentContext, options: RuntimeOptions = {}) {
    const ordered = this.order([...new Set(ids)]);
    const results: AgentResult[] = [];
    for (const id of ordered) {
      if (id === 'router') continue;
      if (options.signal?.aborted) break;
      const agent = this.agents.get(id);
      if (!agent || (agent.canRun && !agent.canRun(context))) continue;
      const key = options.idempotencyKey ? `${options.idempotencyKey}:${id}` : '';
      if (key && this.completedKeys.has(key)) continue;
      const result = await this.runOne(agent, context, options);
      results.push(result);
      if (result.success && key) this.completedKeys.add(key);
      if (!result.success) break;
    }
    return results;
  }

  private async runOne(agent: Agent, context: AgentContext, options: RuntimeOptions) {
    const started = Date.now();
    options.onEvent?.({ agentId: agent.id, status: 'started', at: started });
    const timeoutMs = agent.timeoutMs ?? 15_000;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeout = setTimeout(
          () => reject(new GearXError('TIMEOUT', `${agent.name} timed out.`)),
          timeoutMs,
        );
      });
      const result = await Promise.race([
        agent.run({ ...context, signal: options.signal }),
        timeoutPromise,
      ]);
      const durationMs = Date.now() - started;
      options.onEvent?.({
        agentId: agent.id,
        status: options.signal?.aborted ? 'cancelled' : 'completed',
        at: Date.now(),
        durationMs,
      });
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Agent failed';
      options.onEvent?.({
        agentId: agent.id,
        status: options.signal?.aborted ? 'cancelled' : 'failed',
        at: Date.now(),
        durationMs: Date.now() - started,
        error: message,
      });
      return { agentId: agent.id, success: false, error: message };
    } finally {
      if (timeout) clearTimeout(timeout);
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
