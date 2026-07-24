import { RuntimeEvent } from '../agents/runtime';
import { openAppDatabase } from '../infrastructure/database';

export const runRepository = {
  async recordAgentEvent(sessionId: string, group: string, event: RuntimeEvent): Promise<void> {
    const db = await openAppDatabase();
    const id = `${group}:${event.agentId}`;
    if (event.status === 'started') {
      await db.runAsync(
        `INSERT OR REPLACE INTO agent_runs
         (id, session_id, agent_id, idempotency_key, status, started_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [id, sessionId, event.agentId, id, event.status, event.at],
      );
      return;
    }
    await db.runAsync(
      `UPDATE agent_runs SET status = ?, completed_at = ?, duration_ms = ?,
       error_code = ?, error_message = ? WHERE id = ?`,
      [
        event.status,
        event.at,
        event.durationMs ?? null,
        event.status === 'failed' ? 'AGENT_FAILED' : null,
        event.error ?? null,
        id,
      ],
    );
  },

  async startProvider(input: {
    id: string;
    sessionId: string;
    providerId: string;
    operation: string;
    remote: boolean;
  }): Promise<void> {
    const db = await openAppDatabase();
    await db.runAsync(
      `INSERT INTO provider_runs
       (id, session_id, provider_id, operation, remote, status, started_at)
       VALUES (?, ?, ?, ?, ?, 'started', ?)`,
      [input.id, input.sessionId, input.providerId, input.operation, input.remote ? 1 : 0, Date.now()],
    );
  },

  async finishProvider(id: string, startedAt: number, errorCode?: string): Promise<void> {
    const db = await openAppDatabase();
    const now = Date.now();
    await db.runAsync(
      `UPDATE provider_runs SET status = ?, completed_at = ?, duration_ms = ?, error_code = ?
       WHERE id = ?`,
      [errorCode ? 'failed' : 'completed', now, now - startedAt, errorCode ?? null, id],
    );
  },

  async recentAgentRuns(limit = 10): Promise<Record<string, unknown>[]> {
    const db = await openAppDatabase();
    return db.getAllAsync(
      `SELECT agent_id, status, duration_ms, error_code, error_message, started_at
       FROM agent_runs ORDER BY started_at DESC LIMIT ?`,
      [limit],
    );
  },
};
