import * as SQLite from 'expo-sqlite';
import { GearXError } from '../../domain/errors';

interface Migration {
  version: number;
  name: string;
  sql: string;
}

const migrations: Migration[] = [
  {
    version: 1,
    name: 'normalized_core',
    sql: `
      PRAGMA foreign_keys = ON;
      PRAGMA journal_mode = WAL;

      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY NOT NULL,
        started_at INTEGER NOT NULL,
        ended_at INTEGER,
        duration_ms INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL,
        audio_uri TEXT,
        transcription_provider TEXT NOT NULL,
        inference_provider TEXT NOT NULL,
        processing_mode TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS transcript_segments (
        id TEXT PRIMARY KEY NOT NULL,
        session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
        text TEXT NOT NULL,
        start_ms INTEGER NOT NULL,
        end_ms INTEGER NOT NULL,
        speaker_label TEXT,
        confidence REAL,
        created_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS insights (
        id TEXT PRIMARY KEY NOT NULL,
        session_id TEXT REFERENCES sessions(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        content TEXT NOT NULL,
        source_timestamp INTEGER NOT NULL,
        confidence REAL NOT NULL,
        source_segment_ids TEXT NOT NULL DEFAULT '[]',
        linked_insight_ids TEXT NOT NULL DEFAULT '[]',
        pinned INTEGER NOT NULL DEFAULT 0,
        archived INTEGER NOT NULL DEFAULT 0,
        unresolved INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS summaries (
        id TEXT PRIMARY KEY NOT NULL,
        session_id TEXT REFERENCES sessions(id) ON DELETE CASCADE,
        thread_id TEXT,
        scope TEXT NOT NULL DEFAULT 'session',
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        source_insight_ids TEXT NOT NULL DEFAULT '[]',
        insight_ids TEXT NOT NULL DEFAULT '[]',
        insight_count INTEGER NOT NULL DEFAULT 0,
        provider TEXT NOT NULL DEFAULT 'rules',
        source TEXT NOT NULL DEFAULT 'rules',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS questions (
        id TEXT PRIMARY KEY NOT NULL,
        session_id TEXT REFERENCES sessions(id) ON DELETE CASCADE,
        insight_id TEXT REFERENCES insights(id) ON DELETE SET NULL,
        category TEXT NOT NULL,
        question TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'open',
        priority TEXT NOT NULL DEFAULT 'medium',
        due_at INTEGER,
        resolution TEXT,
        reminder_ready INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL,
        resolved_at INTEGER
      );

      CREATE TABLE IF NOT EXISTS threads (
        id TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        confidence REAL NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS thread_insights (
        thread_id TEXT NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
        insight_id TEXT NOT NULL REFERENCES insights(id) ON DELETE CASCADE,
        relationship TEXT NOT NULL,
        rationale TEXT NOT NULL,
        confidence REAL NOT NULL,
        PRIMARY KEY (thread_id, insight_id)
      );

      CREATE TABLE IF NOT EXISTS agent_runs (
        id TEXT PRIMARY KEY NOT NULL,
        session_id TEXT REFERENCES sessions(id) ON DELETE CASCADE,
        agent_id TEXT NOT NULL,
        idempotency_key TEXT,
        status TEXT NOT NULL,
        started_at INTEGER NOT NULL,
        completed_at INTEGER,
        duration_ms INTEGER,
        input_reference TEXT,
        output_reference TEXT,
        error_code TEXT,
        error_message TEXT
      );

      CREATE TABLE IF NOT EXISTS provider_runs (
        id TEXT PRIMARY KEY NOT NULL,
        session_id TEXT REFERENCES sessions(id) ON DELETE CASCADE,
        provider_id TEXT NOT NULL,
        operation TEXT NOT NULL,
        remote INTEGER NOT NULL,
        status TEXT NOT NULL,
        started_at INTEGER NOT NULL,
        completed_at INTEGER,
        duration_ms INTEGER,
        error_code TEXT
      );

      CREATE TABLE IF NOT EXISTS knowledge_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        payload TEXT NOT NULL,
        timestamp INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_sessions_started ON sessions(started_at DESC);
      CREATE INDEX IF NOT EXISTS idx_segments_session_start ON transcript_segments(session_id, start_ms);
      CREATE INDEX IF NOT EXISTS idx_insights_created ON insights(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_insights_session ON insights(session_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_insights_type ON insights(type);
      CREATE INDEX IF NOT EXISTS idx_questions_status_due ON questions(status, due_at);
      CREATE INDEX IF NOT EXISTS idx_agent_runs_session ON agent_runs(session_id, started_at DESC);
      CREATE UNIQUE INDEX IF NOT EXISTS idx_agent_run_idempotency
        ON agent_runs(idempotency_key) WHERE idempotency_key IS NOT NULL;
    `,
  },
];

async function ensureColumn(
  db: SQLite.SQLiteDatabase,
  table: string,
  name: string,
  definition: string,
) {
  const columns = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${table})`);
  if (!columns.some((column) => column.name === name)) {
    await db.execAsync(`ALTER TABLE ${table} ADD COLUMN ${name} ${definition}`);
  }
}

async function upgradeLegacyColumns(db: SQLite.SQLiteDatabase) {
  const additions: Array<[string, string]> = [
    ['session_id', 'TEXT REFERENCES sessions(id) ON DELETE CASCADE'],
    ['source_segment_ids', "TEXT NOT NULL DEFAULT '[]'"],
    ['pinned', 'INTEGER NOT NULL DEFAULT 0'],
    ['archived', 'INTEGER NOT NULL DEFAULT 0'],
    ['unresolved', 'INTEGER NOT NULL DEFAULT 0'],
    ['updated_at', 'INTEGER NOT NULL DEFAULT 0'],
  ];
  for (const [name, definition] of additions) {
    await ensureColumn(db, 'insights', name, definition);
  }

  const summaryAdditions: Array<[string, string]> = [
    ['session_id', 'TEXT REFERENCES sessions(id) ON DELETE CASCADE'],
    ['thread_id', 'TEXT'],
    ['scope', "TEXT NOT NULL DEFAULT 'session'"],
    ['source_insight_ids', "TEXT NOT NULL DEFAULT '[]'"],
    ['provider', "TEXT NOT NULL DEFAULT 'rules'"],
    ['updated_at', 'INTEGER NOT NULL DEFAULT 0'],
  ];
  for (const [name, definition] of summaryAdditions) {
    await ensureColumn(db, 'summaries', name, definition);
  }
}

export async function migrateDatabase(db: SQLite.SQLiteDatabase): Promise<number> {
  try {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        applied_at INTEGER NOT NULL
      );
    `);
    const current =
      (await db.getFirstAsync<{ version: number }>(
        'SELECT MAX(version) AS version FROM schema_migrations',
      ))?.version ?? 0;

    for (const migration of migrations.filter((item) => item.version > current)) {
      await db.withTransactionAsync(async () => {
        await db.execAsync(migration.sql);
        await upgradeLegacyColumns(db);
        await db.runAsync(
          'INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?)',
          [migration.version, migration.name, Date.now()],
        );
      });
    }
    return migrations.at(-1)?.version ?? 0;
  } catch (cause) {
    throw new GearXError(
      'DATABASE_MIGRATION_FAILED',
      'Failed to migrate the Gear X vault.',
      cause,
    );
  }
}

export const latestSchemaVersion = migrations.at(-1)?.version ?? 0;
