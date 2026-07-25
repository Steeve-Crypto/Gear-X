import { AgentRuntime } from '../src/agents/runtime';
import { Agent, AgentContext } from '../src/agents/types';

const context: AgentContext = {
  recentTranscript: 'test',
  currentInsights: [],
  isListening: false,
};

function makeAgent(run: Agent['run'], patch: Partial<Agent> = {}): Agent {
  return {
    id: 'extractor',
    name: 'Extractor',
    description: 'test',
    continuous: false,
    retryLimit: 1,
    timeoutMs: 100,
    idempotent: true,
    run,
    ...patch,
  };
}

describe('AgentRuntime', () => {
  test('retries once, records attempts, and deduplicates completed keys', async () => {
    const run = jest.fn()
      .mockResolvedValueOnce({ agentId: 'extractor', success: false, error: 'transient' })
      .mockResolvedValueOnce({ agentId: 'extractor', success: true });
    const events: { attempt: number; status: string }[] = [];
    const runtime = new AgentRuntime(new Map([['extractor', makeAgent(run)]]));

    const first = await runtime.execute(['extractor'], context, {
      idempotencyKey: 'session:final',
      onEvent: async (event) => { events.push(event); },
    });
    const second = await runtime.execute(['extractor'], context, {
      idempotencyKey: 'session:final',
    });

    expect(first.at(-1)?.success).toBe(true);
    expect(second).toEqual([]);
    expect(run).toHaveBeenCalledTimes(2);
    expect(events).toEqual(expect.arrayContaining([
      expect.objectContaining({ attempt: 1, status: 'failed' }),
      expect.objectContaining({ attempt: 2, status: 'completed' }),
    ]));
  });

  test('times out and aborts the running attempt', async () => {
    let observedAbort = false;
    const agent = makeAgent(async (input) => new Promise((resolve) => {
      input.signal?.addEventListener('abort', () => {
        observedAbort = true;
        resolve({ agentId: 'extractor', success: false, error: 'aborted' });
      });
    }), { retryLimit: 0, timeoutMs: 5 });
    const runtime = new AgentRuntime(new Map([['extractor', agent]]));
    const [result] = await runtime.execute(['extractor'], context);

    expect(result.success).toBe(false);
    expect(result.error).toContain('timed out');
    expect(observedAbort).toBe(true);
  });
});
