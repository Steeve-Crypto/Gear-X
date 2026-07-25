import assert from 'node:assert/strict';
import test from 'node:test';
import { loadTypeScriptModule } from './helpers/load-typescript.mjs';

const { getAttemptLimit, shouldRetryAgent } = await loadTypeScriptModule(
  'src/domain/runtimePolicy.ts',
);

test('runtime converts retries into bounded attempts', () => {
  assert.equal(getAttemptLimit(), 1);
  assert.equal(getAttemptLimit(1), 2);
  assert.equal(getAttemptLimit(-4), 1);
});

test('runtime never retries cancellation', () => {
  assert.equal(shouldRetryAgent({ attempt: 1, retryLimit: 1, aborted: false }), true);
  assert.equal(shouldRetryAgent({ attempt: 2, retryLimit: 1, aborted: false }), false);
  assert.equal(shouldRetryAgent({ attempt: 1, retryLimit: 1, aborted: true }), false);
});
