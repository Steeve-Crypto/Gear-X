import assert from 'node:assert/strict';
import { access, readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

const root = process.cwd();

test('SQLite migration defines every required durable table', async () => {
  const source = await readFile(resolve(root, 'src/infrastructure/database/migrations.ts'), 'utf8');
  const required = [
    'schema_migrations',
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
  ];
  for (const table of required) {
    assert.match(source, new RegExp(`CREATE TABLE IF NOT EXISTS ${table}`), table);
  }
});

test('all primary Expo Router routes exist', async () => {
  const routes = [
    'app/_layout.tsx',
    'app/(tabs)/orbit.tsx',
    'app/(tabs)/vault.tsx',
    'app/(tabs)/threads.tsx',
    'app/(tabs)/loops.tsx',
    'app/(tabs)/ask.tsx',
    'app/session/[id].tsx',
    'app/insight/[id].tsx',
    'app/thread/[id].tsx',
    'app/loop/[id].tsx',
    'app/settings/index.tsx',
    'app/settings/privacy.tsx',
    'app/settings/inference.tsx',
    'app/settings/diagnostics.tsx',
    'app/onboarding/index.tsx',
  ];
  await Promise.all(routes.map((route) => access(resolve(root, route))));
});

test('production source contains no simulated transcript injection or committed secrets', async () => {
  const files = [];
  async function walk(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = resolve(directory, entry.name);
      if (entry.isDirectory()) await walk(path);
      else if (/\.(ts|tsx|js|json)$/.test(entry.name) && entry.name !== 'benchmark.ts') files.push(path);
    }
  }
  await walk(resolve(root, 'src'));
  await walk(resolve(root, 'app'));
  const source = (await Promise.all(files.map((file) => readFile(file, 'utf8')))).join('\n');
  assert.doesNotMatch(source, /const\s+simulated|simulatedTranscript|We need to finish the proposal by Friday/);
  assert.doesNotMatch(source, /(xai|openai|anthropic)[_-]?api[_-]?key\s*[:=]\s*['"][^'"]+/i);
});
