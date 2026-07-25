import { performance } from 'node:perf_hooks';
import initSqlJs from 'sql.js';

const SQL = await initSqlJs();
const db = new SQL.Database();
db.run(`CREATE TABLE insights (
  id TEXT PRIMARY KEY, content TEXT, type TEXT, confidence REAL,
  pinned INTEGER, archived INTEGER, created_at INTEGER
);
CREATE INDEX idx_benchmark_created ON insights(created_at DESC);
CREATE INDEX idx_benchmark_type ON insights(type);`);
db.run('BEGIN');
const insert = db.prepare('INSERT INTO insights VALUES (?, ?, ?, ?, ?, ?, ?)');
for (let index = 0; index < 10_000; index += 1) {
  insert.run([
    `i_${index}`,
    index % 23 === 0 ? `brass launch decision ${index}` : `ordinary private note ${index}`,
    index % 3 === 0 ? 'decision' : 'fact',
    0.5 + (index % 50) / 100,
    index % 101 === 0 ? 1 : 0,
    0,
    index,
  ]);
}
insert.free();
db.run('COMMIT');

const started = performance.now();
for (let iteration = 0; iteration < 100; iteration += 1) {
  db.exec(`SELECT * FROM insights
    WHERE archived = 0 AND content LIKE '%brass%' AND confidence >= 0.7
    ORDER BY pinned DESC, created_at DESC LIMIT 30`);
}
const elapsed = performance.now() - started;
const averageMs = elapsed / 100;
console.log(JSON.stringify({ records: 10_000, queries: 100, totalMs: elapsed, averageMs }, null, 2));
if (averageMs > 50) process.exitCode = 1;
db.close();
