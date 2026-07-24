/**
 * Gear X — SQLite Database Service
 * Archivist + Retriever + Summarizer backend
 */

import { Insight } from '../agents/types';
import { openAppDatabase } from '../infrastructure/database';

export const getDb = openAppDatabase;

export async function saveInsight(insight: Insight): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    `INSERT OR REPLACE INTO insights
     (id, session_id, type, content, source_timestamp, confidence, source_segment_ids,
      linked_insight_ids, pinned, archived, unresolved, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      insight.id,
      insight.sessionId ?? null,
      insight.type,
      insight.content,
      insight.sourceTimestamp,
      insight.confidence,
      JSON.stringify(insight.sourceSegmentIds || []),
      JSON.stringify(insight.linkedInsightIds || []),
      insight.pinned ? 1 : 0,
      insight.archived ? 1 : 0,
      insight.unresolved ?? insight.type === 'open_loop' ? 1 : 0,
      insight.createdAt,
      insight.updatedAt ?? insight.createdAt,
    ]
  );
}

export async function saveInsights(insights: Insight[]): Promise<number> {
  if (!insights.length) return 0;
  const database = await getDb();
  let saved = 0;
  for (const insight of insights) {
    await database.runAsync(
      `INSERT OR REPLACE INTO insights
       (id, session_id, type, content, source_timestamp, confidence, source_segment_ids,
        linked_insight_ids, pinned, archived, unresolved, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        insight.id,
        insight.sessionId ?? null,
        insight.type,
        insight.content,
        insight.sourceTimestamp,
        insight.confidence,
        JSON.stringify(insight.sourceSegmentIds || []),
        JSON.stringify(insight.linkedInsightIds || []),
        insight.pinned ? 1 : 0,
        insight.archived ? 1 : 0,
        insight.unresolved ?? insight.type === 'open_loop' ? 1 : 0,
        insight.createdAt,
        insight.updatedAt ?? insight.createdAt,
      ]
    );
    saved++;
  }
  return saved;
}

export async function loadAllInsights(): Promise<Insight[]> {
  const database = await getDb();
  const rows = await database.getAllAsync<{
    id: string;
    type: string;
    content: string;
    source_timestamp: number;
    confidence: number;
    linked_insight_ids: string;
    created_at: number;
  }>('SELECT * FROM insights ORDER BY created_at ASC');

  return rows.map((r) => ({
    id: r.id,
    sessionId: (r as typeof r & { session_id?: string }).session_id ?? null,
    type: r.type as Insight['type'],
    content: r.content,
    sourceTimestamp: r.source_timestamp,
    confidence: r.confidence,
    linkedInsightIds: JSON.parse(r.linked_insight_ids || '[]'),
    createdAt: r.created_at,
    updatedAt: (r as typeof r & { updated_at?: number }).updated_at || r.created_at,
  }));
}

export async function searchInsights(query: string, limit = 12): Promise<Insight[]> {
  const database = await getDb();
  const tokens = [...new Set(query.toLowerCase().match(/[a-z0-9]{2,}/g) ?? [])].slice(0, 8);
  if (!tokens.length) return [];
  const clauses = tokens.map(() => 'LOWER(content) LIKE ?').join(' OR ');
  const rows = await database.getAllAsync<{
    id: string;
    type: string;
    content: string;
    source_timestamp: number;
    confidence: number;
    linked_insight_ids: string;
    created_at: number;
  }>(
    `SELECT * FROM insights
     WHERE archived = 0 AND (${clauses})
     ORDER BY pinned DESC, confidence DESC, created_at DESC
     LIMIT ?`,
    [...tokens.map((token) => `%${token}%`), limit]
  );

  return rows.map((r) => ({
    id: r.id,
    type: r.type as Insight['type'],
    content: r.content,
    sourceTimestamp: r.source_timestamp,
    confidence: r.confidence,
    linkedInsightIds: JSON.parse(r.linked_insight_ids || '[]'),
    createdAt: r.created_at,
  }));
}

export async function getInsightCount(): Promise<number> {
  const database = await getDb();
  const result = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM insights'
  );
  return result?.count ?? 0;
}

export interface SummaryRecord {
  id: string;
  sessionId?: string | null;
  threadId?: string | null;
  title: string;
  body: string;
  insightIds: string[];
  insightCount: number;
  source: 'llm' | 'rules';
  createdAt: number;
  updatedAt?: number;
}

export async function saveSummary(summary: SummaryRecord): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    `INSERT OR REPLACE INTO summaries
     (id, session_id, thread_id, scope, title, body, source_insight_ids, insight_ids,
      insight_count, provider, source, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      summary.id,
      summary.sessionId ?? null,
      summary.threadId ?? null,
      summary.threadId ? 'thread' : 'session',
      summary.title,
      summary.body,
      JSON.stringify(summary.insightIds),
      JSON.stringify(summary.insightIds),
      summary.insightCount,
      summary.source,
      summary.source,
      summary.createdAt,
      summary.updatedAt ?? summary.createdAt,
    ]
  );
}

export async function loadLatestSummary(): Promise<SummaryRecord | null> {
  const database = await getDb();
  const row = await database.getFirstAsync<{
    id: string;
    title: string;
    body: string;
    insight_ids: string;
    insight_count: number;
    source: string;
    created_at: number;
  }>('SELECT * FROM summaries ORDER BY created_at DESC LIMIT 1');

  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    insightIds: JSON.parse(row.insight_ids || '[]'),
    insightCount: row.insight_count,
    source: (row.source as 'llm' | 'rules') || 'rules',
    createdAt: row.created_at,
  };
}

export async function loadAllSummaries(): Promise<SummaryRecord[]> {
  const database = await getDb();
  const rows = await database.getAllAsync<{
    id: string;
    title: string;
    body: string;
    insight_ids: string;
    insight_count: number;
    source: string;
    created_at: number;
  }>('SELECT * FROM summaries ORDER BY created_at DESC');

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    body: r.body,
    insightIds: JSON.parse(r.insight_ids || '[]'),
    insightCount: r.insight_count,
    source: (r.source as 'llm' | 'rules') || 'rules',
    createdAt: r.created_at,
  }));
}

export async function logEvent(type: string, payload: unknown): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    'INSERT INTO knowledge_events (type, payload, timestamp) VALUES (?, ?, ?)',
    [type, JSON.stringify(payload), Date.now()]
  );
}

export async function clearAllData(): Promise<void> {
  const database = await getDb();
  await database.withTransactionAsync(async () => {
    await database.execAsync(`
      DELETE FROM provider_runs;
      DELETE FROM agent_runs;
      DELETE FROM thread_insights;
      DELETE FROM questions;
      DELETE FROM summaries;
      DELETE FROM insights;
      DELETE FROM transcript_segments;
      DELETE FROM sessions;
      DELETE FROM threads;
      DELETE FROM knowledge_events;
    `);
  });
}

export async function updateSummary(id: string, title: string, body: string): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    'UPDATE summaries SET title = ?, body = ?, updated_at = ? WHERE id = ?',
    [title.trim(), body.trim(), Date.now(), id],
  );
}

export async function deleteSummary(id: string): Promise<void> {
  const database = await getDb();
  await database.runAsync('DELETE FROM summaries WHERE id = ?', [id]);
}
