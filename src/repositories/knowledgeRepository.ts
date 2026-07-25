import { KnowledgeThread, OpenLoop, VaultInsight } from '../domain/models';
import { openAppDatabase } from '../infrastructure/database';
import { createId } from '../utils/id';

const parseIds = (value: unknown): string[] => {
  try {
    const parsed = JSON.parse(String(value || '[]'));
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
};

const toInsight = (row: Record<string, unknown>): VaultInsight => ({
  id: String(row.id),
  sessionId: row.session_id == null ? null : String(row.session_id),
  content: String(row.content),
  type: row.type as VaultInsight['type'],
  confidence: Number(row.confidence),
  sourceSegmentIds: parseIds(row.source_segment_ids),
  pinned: Boolean(row.pinned),
  archived: Boolean(row.archived),
  unresolved: Boolean(row.unresolved),
  createdAt: Number(row.created_at),
  updatedAt: Number(row.updated_at || row.created_at),
});

export interface InsightQuery {
  search?: string;
  type?: VaultInsight['type'];
  sessionId?: string;
  unresolved?: boolean;
  minConfidence?: number;
  createdAfter?: number;
  createdBefore?: number;
  includeArchived?: boolean;
  limit?: number;
  offset?: number;
}

export const knowledgeRepository = {
  async insights(query: InsightQuery = {}): Promise<VaultInsight[]> {
    const db = await openAppDatabase();
    const clauses: string[] = [];
    const params: (string | number)[] = [];
    if (!query.includeArchived) clauses.push('archived = 0');
    if (query.search?.trim()) {
      clauses.push('(content LIKE ? OR type LIKE ?)');
      const value = `%${query.search.trim()}%`;
      params.push(value, value);
    }
    if (query.type) {
      clauses.push('type = ?');
      params.push(query.type);
    }
    if (query.sessionId) {
      clauses.push('session_id = ?');
      params.push(query.sessionId);
    }
    if (query.unresolved !== undefined) {
      clauses.push('unresolved = ?');
      params.push(query.unresolved ? 1 : 0);
    }
    if (query.minConfidence !== undefined) {
      clauses.push('confidence >= ?');
      params.push(query.minConfidence);
    }
    if (query.createdAfter !== undefined) {
      clauses.push('created_at >= ?');
      params.push(query.createdAfter);
    }
    if (query.createdBefore !== undefined) {
      clauses.push('created_at <= ?');
      params.push(query.createdBefore);
    }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    params.push(Math.min(query.limit ?? 30, 100), Math.max(query.offset ?? 0, 0));
    const rows = await db.getAllAsync<Record<string, unknown>>(
      `SELECT * FROM insights ${where}
       ORDER BY pinned DESC, created_at DESC LIMIT ? OFFSET ?`,
      params,
    );
    return rows.map(toInsight);
  },

  async insight(id: string): Promise<VaultInsight | null> {
    const db = await openAppDatabase();
    const row = await db.getFirstAsync<Record<string, unknown>>(
      'SELECT * FROM insights WHERE id = ?',
      [id],
    );
    return row ? toInsight(row) : null;
  },

  async updateInsight(
    id: string,
    patch: Partial<Pick<VaultInsight, 'content' | 'pinned' | 'archived' | 'unresolved'>>,
  ): Promise<void> {
    const current = await this.insight(id);
    if (!current) return;
    const db = await openAppDatabase();
    await db.runAsync(
      `UPDATE insights SET content = ?, pinned = ?, archived = ?, unresolved = ?, updated_at = ?
       WHERE id = ?`,
      [
        patch.content ?? current.content,
        (patch.pinned ?? current.pinned) ? 1 : 0,
        (patch.archived ?? current.archived) ? 1 : 0,
        (patch.unresolved ?? current.unresolved) ? 1 : 0,
        Date.now(),
        id,
      ],
    );
  },

  async removeInsight(id: string): Promise<void> {
    const db = await openAppDatabase();
    await db.runAsync('DELETE FROM insights WHERE id = ?', [id]);
  },

  async bulkUpdateInsights(
    ids: string[],
    patch: Pick<Partial<VaultInsight>, 'archived' | 'pinned' | 'unresolved'>,
  ): Promise<void> {
    if (!ids.length) return;
    const db = await openAppDatabase();
    const assignments: string[] = [];
    const values: number[] = [];
    for (const key of ['archived', 'pinned', 'unresolved'] as const) {
      if (patch[key] !== undefined) {
        assignments.push(`${key} = ?`);
        values.push(patch[key] ? 1 : 0);
      }
    }
    if (!assignments.length) return;
    const placeholders = ids.map(() => '?').join(', ');
    await db.runAsync(
      `UPDATE insights SET ${assignments.join(', ')}, updated_at = ?
       WHERE id IN (${placeholders})`,
      [...values, Date.now(), ...ids],
    );
  },

  async bulkRemoveInsights(ids: string[]): Promise<void> {
    if (!ids.length) return;
    const db = await openAppDatabase();
    const placeholders = ids.map(() => '?').join(', ');
    await db.runAsync(`DELETE FROM insights WHERE id IN (${placeholders})`, ids);
  },

  async insightContext(id: string): Promise<{
    segments: { id: string; text: string; startMs: number; speakerLabel: string | null }[];
    threads: KnowledgeThread[];
    loops: OpenLoop[];
  }> {
    const db = await openAppDatabase();
    const insight = await this.insight(id);
    if (!insight) return { segments: [], threads: [], loops: [] };
    const segmentIds = insight.sourceSegmentIds;
    const segments = segmentIds.length
      ? await db.getAllAsync<Record<string, unknown>>(
        `SELECT id, text, start_ms, speaker_label FROM transcript_segments
         WHERE id IN (${segmentIds.map(() => '?').join(', ')}) ORDER BY start_ms`,
        segmentIds,
      )
      : [];
    const threadRows = await db.getAllAsync<Record<string, unknown>>(
      `SELECT t.* FROM threads t JOIN thread_insights ti ON ti.thread_id = t.id
       WHERE ti.insight_id = ? ORDER BY t.updated_at DESC`,
      [id],
    );
    const loops = await db.getAllAsync<Record<string, unknown>>(
      'SELECT * FROM questions WHERE insight_id = ? ORDER BY created_at DESC',
      [id],
    );
    return {
      segments: segments.map((row) => ({
        id: String(row.id),
        text: String(row.text),
        startMs: Number(row.start_ms),
        speakerLabel: row.speaker_label == null ? null : String(row.speaker_label),
      })),
      threads: threadRows.map((row) => ({
        id: String(row.id),
        title: String(row.title),
        description: String(row.description),
        confidence: Number(row.confidence),
        createdAt: Number(row.created_at),
        updatedAt: Number(row.updated_at),
      })),
      loops: loops.map(toLoop),
    };
  },

  async threads(limit = 30): Promise<KnowledgeThread[]> {
    const db = await openAppDatabase();
    const rows = await db.getAllAsync<Record<string, unknown>>(
      'SELECT * FROM threads ORDER BY updated_at DESC LIMIT ?',
      [Math.min(limit, 100)],
    );
    return rows.map((row) => ({
      id: String(row.id),
      title: String(row.title),
      description: String(row.description),
      confidence: Number(row.confidence),
      createdAt: Number(row.created_at),
      updatedAt: Number(row.updated_at),
    }));
  },

  async saveThread(input: {
    id?: string;
    title: string;
    description: string;
    confidence: number;
    links: {
      insightId: string;
      relationship: string;
      rationale: string;
      confidence: number;
    }[];
  }): Promise<string> {
    const db = await openAppDatabase();
    const id = input.id ?? createId('thread');
    const now = Date.now();
    await db.withTransactionAsync(async () => {
      await db.runAsync(
        `INSERT INTO threads (id, title, description, confidence, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET title = excluded.title, description = excluded.description,
           confidence = excluded.confidence, updated_at = excluded.updated_at`,
        [id, input.title, input.description, input.confidence, now, now],
      );
      for (const link of input.links) {
        await db.runAsync(
          `INSERT INTO thread_insights
           (thread_id, insight_id, relationship, rationale, confidence)
           VALUES (?, ?, ?, ?, ?)
           ON CONFLICT(thread_id, insight_id) DO UPDATE SET
             relationship = excluded.relationship, rationale = excluded.rationale,
             confidence = excluded.confidence`,
          [id, link.insightId, link.relationship, link.rationale, link.confidence],
        );
      }
    });
    return id;
  },

  async updateThread(id: string, title: string, description: string): Promise<void> {
    const db = await openAppDatabase();
    await db.runAsync(
      'UPDATE threads SET title = ?, description = ?, updated_at = ? WHERE id = ?',
      [title.trim(), description.trim(), Date.now(), id],
    );
  },

  async linkThreadInsight(
    threadId: string,
    insightId: string,
    relationship = 'manual',
    rationale = 'Linked by the user.',
  ): Promise<void> {
    const db = await openAppDatabase();
    await db.runAsync(
      `INSERT INTO thread_insights
       (thread_id, insight_id, relationship, rationale, confidence)
       VALUES (?, ?, ?, ?, 1)
       ON CONFLICT(thread_id, insight_id) DO UPDATE SET
         relationship = excluded.relationship, rationale = excluded.rationale, confidence = 1`,
      [threadId, insightId, relationship, rationale],
    );
    await db.runAsync('UPDATE threads SET updated_at = ? WHERE id = ?', [Date.now(), threadId]);
  },

  async unlinkThreadInsight(threadId: string, insightId: string): Promise<void> {
    const db = await openAppDatabase();
    await db.runAsync(
      'DELETE FROM thread_insights WHERE thread_id = ? AND insight_id = ?',
      [threadId, insightId],
    );
    await db.runAsync('UPDATE threads SET updated_at = ? WHERE id = ?', [Date.now(), threadId]);
  },

  async thread(id: string): Promise<{
    thread: KnowledgeThread;
    links: (VaultInsight & { relationship: string; rationale: string; linkConfidence: number })[];
  } | null> {
    const db = await openAppDatabase();
    const row = await db.getFirstAsync<Record<string, unknown>>(
      'SELECT * FROM threads WHERE id = ?',
      [id],
    );
    if (!row) return null;
    const links = await db.getAllAsync<Record<string, unknown>>(
      `SELECT i.*, ti.relationship, ti.rationale, ti.confidence AS link_confidence
       FROM thread_insights ti JOIN insights i ON i.id = ti.insight_id
       WHERE ti.thread_id = ? ORDER BY i.created_at ASC`,
      [id],
    );
    return {
      thread: {
        id: String(row.id),
        title: String(row.title),
        description: String(row.description),
        confidence: Number(row.confidence),
        createdAt: Number(row.created_at),
        updatedAt: Number(row.updated_at),
      },
      links: links.map((link) => ({
        ...toInsight(link),
        relationship: String(link.relationship),
        rationale: String(link.rationale),
        linkConfidence: Number(link.link_confidence),
      })),
    };
  },

  async saveLoops(input: {
    sessionId: string | null;
    insightId: string | null;
    category: OpenLoop['category'];
    question: string;
    priority: OpenLoop['priority'];
  }[]): Promise<number> {
    if (!input.length) return 0;
    const db = await openAppDatabase();
    let saved = 0;
    await db.withTransactionAsync(async () => {
      for (const loop of input) {
        const existing = await db.getFirstAsync<{ id: string }>(
          `SELECT id FROM questions WHERE question = ?
           AND ((session_id = ?) OR (session_id IS NULL AND ? IS NULL)) LIMIT 1`,
          [loop.question, loop.sessionId, loop.sessionId],
        );
        if (existing) continue;
        await db.runAsync(
          `INSERT INTO questions
           (id, session_id, insight_id, category, question, status, priority, created_at)
           VALUES (?, ?, ?, ?, ?, 'open', ?, ?)`,
          [
            createId('loop'),
            loop.sessionId,
            loop.insightId,
            loop.category,
            loop.question,
            loop.priority,
            Date.now(),
          ],
        );
        saved += 1;
      }
    });
    return saved;
  },

  async loops(
    query: OpenLoop['status'] | 'all' | {
      status?: OpenLoop['status'] | 'all';
      search?: string;
      category?: OpenLoop['category'];
      dueOnly?: boolean;
      limit?: number;
    } = 'open',
    legacyLimit = 50,
  ): Promise<OpenLoop[]> {
    const db = await openAppDatabase();
    const options = typeof query === 'string' ? { status: query, limit: legacyLimit } : query;
    const clauses: string[] = [];
    const params: (string | number)[] = [];
    if ((options.status ?? 'open') !== 'all') {
      clauses.push('status = ?');
      params.push(options.status ?? 'open');
    }
    if (options.search?.trim()) {
      clauses.push('(question LIKE ? OR resolution LIKE ?)');
      const value = `%${options.search.trim()}%`;
      params.push(value, value);
    }
    if (options.category) {
      clauses.push('category = ?');
      params.push(options.category);
    }
    if (options.dueOnly) clauses.push('due_at IS NOT NULL');
    params.push(Math.min(options.limit ?? 50, 100));
    const rows = await db.getAllAsync<Record<string, unknown>>(
      `SELECT * FROM questions ${clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''}
       ORDER BY CASE priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END,
       COALESCE(due_at, 9223372036854775807), created_at DESC
       LIMIT ?`,
      params,
    );
    return rows.map(toLoop);
  },

  async loop(id: string): Promise<OpenLoop | null> {
    const db = await openAppDatabase();
    const row = await db.getFirstAsync<Record<string, unknown>>(
      'SELECT * FROM questions WHERE id = ?',
      [id],
    );
    if (!row) return null;
    return toLoop(row);
  },

  async updateLoop(
    id: string,
    patch: Partial<Pick<OpenLoop, 'question' | 'priority' | 'dueAt' | 'reminderReady'>>,
  ): Promise<void> {
    const current = await this.loop(id);
    if (!current) return;
    const db = await openAppDatabase();
    await db.runAsync(
      `UPDATE questions SET question = ?, priority = ?, due_at = ?, reminder_ready = ?
       WHERE id = ?`,
      [
        patch.question ?? current.question,
        patch.priority ?? current.priority,
        patch.dueAt === undefined ? current.dueAt : patch.dueAt,
        (patch.reminderReady ?? current.reminderReady) ? 1 : 0,
        id,
      ],
    );
  },

  async resolveLoop(id: string, resolution: string, status: 'resolved' | 'dismissed'): Promise<void> {
    const db = await openAppDatabase();
    await db.runAsync(
      'UPDATE questions SET status = ?, resolution = ?, resolved_at = ? WHERE id = ?',
      [status, resolution, Date.now(), id],
    );
  },

  async counts(): Promise<Record<string, number>> {
    const db = await openAppDatabase();
    const tables = ['sessions', 'insights', 'threads', 'questions'] as const;
    const result: Record<string, number> = {};
    for (const table of tables) {
      const row = await db.getFirstAsync<{ count: number }>(`SELECT COUNT(*) AS count FROM ${table}`);
      result[table] = row?.count ?? 0;
    }
    return result;
  },

  async applyRetention(days: number): Promise<void> {
    if (!Number.isFinite(days) || days <= 0) return;
    const cutoff = Date.now() - Math.floor(days) * 86_400_000;
    const db = await openAppDatabase();
    await db.withTransactionAsync(async () => {
      await db.runAsync('DELETE FROM sessions WHERE started_at < ?', [cutoff]);
      await db.runAsync('DELETE FROM insights WHERE session_id IS NULL AND created_at < ?', [cutoff]);
      await db.runAsync('DELETE FROM summaries WHERE session_id IS NULL AND created_at < ?', [cutoff]);
      await db.runAsync('DELETE FROM questions WHERE session_id IS NULL AND created_at < ?', [cutoff]);
    });
  },

  async exportAll(): Promise<Record<string, unknown>> {
    const db = await openAppDatabase();
    const tables = [
      'settings',
      'sessions',
      'transcript_segments',
      'insights',
      'summaries',
      'questions',
      'threads',
      'thread_insights',
      'agent_runs',
      'provider_runs',
    ] as const;
    const data: Record<string, unknown> = {
      format: 'gear-x-export',
      version: 1,
      exportedAt: new Date().toISOString(),
    };
    for (const table of tables) data[table] = await db.getAllAsync(`SELECT * FROM ${table}`);
    return data;
  },
};

function toLoop(row: Record<string, unknown>): OpenLoop {
  return {
    id: String(row.id),
    sessionId: row.session_id == null ? null : String(row.session_id),
    insightId: row.insight_id == null ? null : String(row.insight_id),
    category: row.category as OpenLoop['category'],
    question: String(row.question),
    status: row.status as OpenLoop['status'],
    priority: row.priority as OpenLoop['priority'],
    dueAt: row.due_at == null ? null : Number(row.due_at),
    resolution: row.resolution == null ? null : String(row.resolution),
    reminderReady: Boolean(row.reminder_ready),
    createdAt: Number(row.created_at),
    resolvedAt: row.resolved_at == null ? null : Number(row.resolved_at),
  };
}
