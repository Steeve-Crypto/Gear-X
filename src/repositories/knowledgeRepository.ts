import { KnowledgeThread, OpenLoop, VaultInsight } from '../domain/models';
import { openAppDatabase } from '../infrastructure/database';

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
  includeArchived?: boolean;
  limit?: number;
  offset?: number;
}

export const knowledgeRepository = {
  async insights(query: InsightQuery = {}): Promise<VaultInsight[]> {
    const db = await openAppDatabase();
    const clauses: string[] = [];
    const params: Array<string | number> = [];
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

  async loops(status: OpenLoop['status'] | 'all' = 'open', limit = 50): Promise<OpenLoop[]> {
    const db = await openAppDatabase();
    const rows = await db.getAllAsync<Record<string, unknown>>(
      `SELECT * FROM questions ${status === 'all' ? '' : 'WHERE status = ?'}
       ORDER BY CASE priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END, created_at DESC
       LIMIT ?`,
      status === 'all' ? [Math.min(limit, 100)] : [status, Math.min(limit, 100)],
    );
    return rows.map((row) => ({
      id: String(row.id),
      sessionId: row.session_id == null ? null : String(row.session_id),
      insightId: row.insight_id == null ? null : String(row.insight_id),
      category: row.category as OpenLoop['category'],
      question: String(row.question),
      status: row.status as OpenLoop['status'],
      priority: row.priority as OpenLoop['priority'],
      dueAt: row.due_at == null ? null : Number(row.due_at),
      resolution: row.resolution == null ? null : String(row.resolution),
      createdAt: Number(row.created_at),
      resolvedAt: row.resolved_at == null ? null : Number(row.resolved_at),
    }));
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
