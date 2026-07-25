import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import initSqlJs from 'sql.js';

const source = await readFile(new URL('../src/infrastructure/database/migrations.ts', import.meta.url), 'utf8');
const sql = source.match(/name:\s*'normalized_core',[\s\S]*?sql:\s*`([\s\S]*?)`,\s*},/)?.[1];
assert.ok(sql, 'normalized schema SQL must be discoverable');

test('fresh migration enforces tables, uniqueness, and cascades', async () => {
  const SQL = await initSqlJs();
  const db = new SQL.Database();
  db.run(sql);
  const tables = db.exec("SELECT name FROM sqlite_master WHERE type = 'table'")[0].values.flat();
  for (const table of ['sessions', 'transcript_segments', 'insights', 'summaries', 'questions',
    'threads', 'thread_insights', 'agent_runs', 'provider_runs', 'settings']) {
    assert.ok(tables.includes(table), `${table} should exist`);
  }

  db.run(`INSERT INTO sessions VALUES
    ('s', 1, NULL, 0, 'processing', 'file://a', 'mock', 'ollama', 'local', 1, 1)`);
  db.run(`INSERT INTO transcript_segments VALUES
    ('seg', 's', 'hello', 0, 100, NULL, 1, 1)`);
  db.run(`INSERT INTO agent_runs
    (id, session_id, agent_id, idempotency_key, status, started_at)
    VALUES ('r1', 's', 'extractor', 'once', 'started', 1)`);
  assert.throws(() => db.run(`INSERT INTO agent_runs
    (id, session_id, agent_id, idempotency_key, status, started_at)
    VALUES ('r2', 's', 'extractor', 'once', 'started', 2)`));
  db.run("DELETE FROM sessions WHERE id = 's'");
  assert.equal(db.exec('SELECT COUNT(*) FROM transcript_segments')[0].values[0][0], 0);
  db.close();
});

test('legacy upgrade declarations preserve required insight columns', () => {
  for (const column of ['session_id', 'source_segment_ids', 'pinned', 'archived', 'unresolved', 'updated_at']) {
    assert.match(source, new RegExp(`\\['${column}'`));
  }
  assert.doesNotMatch(source, /DROP TABLE|DELETE FROM insights/);
});
