import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import {
  BackendError,
  createGearXHandler,
  ERROR_CODES,
} from '../supabase/functions/gear-x/core.mjs';

const limits = {
  maxSystemChars: 100,
  maxPromptChars: 200,
  maxOutputTokens: 500,
  maxGenerateBytes: 1_000,
  maxAudioBytes: 16,
  maxAudioDurationMs: 60_000,
  multipartOverheadBytes: 1_000,
};

function fixture(overrides = {}) {
  const calls = { reservations: [], completions: [], transcriptions: 0, generations: 0, logs: [], webhooks: 0 };
  const handler = createGearXHandler({
    limits,
    randomId: () => 'request-id',
    tokenExpiry: () => 12345,
    corsHeaders: () => ({}),
    authenticate: async (token) => token === 'valid-token' ? { id: 'server-user' } : null,
    reserveUsage: async (request) => {
      calls.reservations.push(request);
      return { allowed: true, remaining: 4, usageId: 7, modelClass: 'standard' };
    },
    completeUsage: async (usageId, result) => calls.completions.push({ usageId, ...result }),
    getEntitlementSummary: async () => ({ planId: 'baseline', displayName: 'Local access', status: 'none', capabilities: [], allowances: {} }),
    handleBillingWebhook: async () => { calls.webhooks += 1; },
    transcribe: async ({ durationMs }) => {
      calls.transcriptions += 1;
      return { text: 'A real transcript.', confidence: null, segments: [{
        text: 'A real transcript.', startMs: 0, endMs: durationMs, confidence: null, speakerLabel: null,
      }] };
    },
    generate: async () => {
      calls.generations += 1;
      return JSON.stringify({ title: 'Release plan', body: 'Ship after device verification.' });
    },
    logMetadata: (entry) => calls.logs.push(entry),
    ...overrides,
  });
  return { handler, calls };
}

const authHeaders = {
  Authorization: 'Bearer valid-token',
  'X-Gear-X-Remote-Consent': 'granted',
};

function generateRequest(body = {}) {
  return new Request('https://example.test/functions/v1/gear-x/v1/generate', {
    method: 'POST',
    headers: { ...authHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system: 'Return summary JSON.',
      prompt: 'Summarize only this selected context.',
      capability: 'summarization',
      ...body,
    }),
  });
}

function transcriptionRequest({ type = 'audio/m4a', bytes = [1, 2], durationMs = 1_000 } = {}) {
  const form = new FormData();
  form.append('session_id', 'session-1');
  form.append('duration_ms', String(durationMs));
  form.append('file', new File([new Uint8Array(bytes)], 'recording.m4a', { type }));
  return new Request('https://example.test/functions/v1/gear-x/v1/transcriptions', {
    method: 'POST', headers: authHeaders, body: form,
  });
}

test('rejects missing and invalid authentication', async () => {
  const { handler } = fixture();
  const missing = await handler(new Request('https://example.test/functions/v1/gear-x/health'));
  assert.equal(missing.status, 401);
  assert.equal((await missing.json()).error.code, ERROR_CODES.UNAUTHORIZED);
  const invalid = await handler(new Request('https://example.test/functions/v1/gear-x/health', {
    headers: { Authorization: 'Bearer forged' },
  }));
  assert.equal(invalid.status, 401);
});

test('validates an authenticated mobile session', async () => {
  const { handler } = fixture();
  const response = await handler(new Request('https://example.test/functions/v1/gear-x/v1/mobile/session', {
    method: 'POST', headers: authHeaders,
  }));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { token: 'valid-token', expiresAt: 12345, userId: 'server-user' });
});

test('requires explicit remote consent before usage', async () => {
  const { handler, calls } = fixture();
  const request = generateRequest();
  request.headers.delete('X-Gear-X-Remote-Consent');
  const response = await handler(request);
  assert.equal((await response.json()).error.code, ERROR_CODES.CONSENT_REQUIRED);
  assert.equal(calls.reservations.length, 0);
});

test('accepts valid transcription and accounts server user', async () => {
  const { handler, calls } = fixture();
  const response = await handler(transcriptionRequest());
  assert.equal(response.status, 200);
  assert.equal((await response.json()).text, 'A real transcript.');
  assert.equal(calls.reservations[0].userId, 'server-user');
  assert.equal(calls.transcriptions, 1);
  assert.deepEqual(calls.completions, [{ usageId: 7, status: 'completed' }]);
});

test('rejects invalid and oversized audio', async () => {
  const { handler, calls } = fixture();
  const invalid = await handler(transcriptionRequest({ type: 'text/plain' }));
  assert.equal((await invalid.json()).error.code, ERROR_CODES.INVALID_REQUEST);
  const oversized = await handler(transcriptionRequest({ bytes: new Array(17).fill(1) }));
  assert.equal((await oversized.json()).error.code, ERROR_CODES.PAYLOAD_TOO_LARGE);
  assert.equal(calls.transcriptions, 0);
});

test('rejects audio beyond duration limit', async () => {
  const { handler } = fixture();
  const response = await handler(transcriptionRequest({ durationMs: 60_001 }));
  assert.equal((await response.json()).error.code, ERROR_CODES.INVALID_REQUEST);
});

test('validates structured intelligence output', async () => {
  const { handler, calls } = fixture();
  const response = await handler(generateRequest());
  assert.equal(response.status, 200);
  assert.match((await response.json()).text, /Release plan/);
  assert.equal(calls.generations, 1);
  assert.equal(calls.reservations[0].capability, 'cloud_summarization');
  assert.equal(calls.completions[0].status, 'completed');
});

test('normalizes malformed provider output', async () => {
  const { handler } = fixture({ generate: async () => 'not-json' });
  const response = await handler(generateRequest());
  assert.equal(response.status, 502);
  assert.equal((await response.json()).error.code, ERROR_CODES.MALFORMED_PROVIDER_OUTPUT);
});

test('normalizes provider timeout and failure', async () => {
  for (const [code, status] of [[ERROR_CODES.PROVIDER_TIMEOUT, 504], [ERROR_CODES.PROVIDER_UNAVAILABLE, 503]]) {
    const { handler } = fixture({
      generate: async () => { throw new BackendError(code, 'Safe provider error.', status); },
    });
    const response = await handler(generateRequest());
    assert.equal(response.status, status);
    assert.equal((await response.json()).error.code, code);
  }
});

test('enforces quota and rate-limit reservations', async () => {
  for (const reason of ['quota', 'rate']) {
    const { handler, calls } = fixture({ reserveUsage: async (request) => {
      calls.reservations.push(request);
      return { allowed: false, reason, remaining: 0 };
    } });
    const response = await handler(generateRequest());
    assert.equal(response.status, 429);
    assert.equal((await response.json()).error.code, ERROR_CODES.QUOTA_EXCEEDED);
    assert.equal(calls.generations, 0);
    if (reason === 'rate') assert.equal(response.headers.get('retry-after'), '60');
  }
});

test('baseline entitlement and global kill switch fail before provider access', async () => {
  for (const [reason, code] of [['entitlement', ERROR_CODES.ENTITLEMENT_REQUIRED], ['disabled', ERROR_CODES.CLOUD_DISABLED]]) {
    const { handler, calls } = fixture({ reserveUsage: async (request) => {
      calls.reservations.push(request);
      return { allowed: false, reason, remaining: 0 };
    } });
    const response = await handler(generateRequest({ plan: 'paid', remaining: 999999 }));
    assert.equal((await response.json()).error.code, code);
    assert.equal(calls.generations, 0);
    assert.equal(calls.reservations[0].userId, 'server-user');
    assert.equal('plan' in calls.reservations[0], false);
  }
});

test('meters transcription duration and intelligence token reservation', async () => {
  const { handler, calls } = fixture();
  await handler(transcriptionRequest({ durationMs: 12_345 }));
  await handler(generateRequest({ maxTokens: 200 }));
  assert.equal(calls.reservations[0].durationMs, 12_345);
  assert.equal(calls.reservations[0].reservedTokens, 0);
  assert.ok(calls.reservations[1].reservedTokens >= 200);
});

test('serves server-authoritative entitlement state', async () => {
  const { handler } = fixture({ getEntitlementSummary: async (userId) => ({
    planId: 'cloud_standard', displayName: 'Cloud access', status: 'active', userId,
    capabilities: ['cloud_transcription'], allowances: { transcriptionDailyMsRemaining: 10_000 },
  }) });
  const response = await handler(new Request('https://example.test/functions/v1/gear-x/v1/entitlements', {
    headers: { Authorization: 'Bearer valid-token' },
  }));
  const body = await response.json();
  assert.equal(body.userId, 'server-user');
  assert.deepEqual(body.capabilities, ['cloud_transcription']);
});

test('billing webhook is handled outside mobile authentication', async () => {
  const { handler, calls } = fixture();
  const response = await handler(new Request('https://example.test/functions/v1/gear-x/v1/billing/revenuecat/webhook', {
    method: 'POST', body: '{}', headers: { Authorization: 'RevenueCat test-secret' },
  }));
  assert.equal(response.status, 200);
  assert.equal(calls.webhooks, 1);
});

test('rejects oversized and malformed intelligence requests', async () => {
  const { handler, calls } = fixture();
  const oversized = await handler(generateRequest({ prompt: 'x'.repeat(201) }));
  assert.equal((await oversized.json()).error.code, ERROR_CODES.INVALID_REQUEST);
  const malformed = await handler(new Request('https://example.test/functions/v1/gear-x/v1/generate', {
    method: 'POST', headers: { ...authHeaders, 'Content-Type': 'application/json' }, body: '{',
  }));
  assert.equal((await malformed.json()).error.code, ERROR_CODES.INVALID_REQUEST);
  assert.equal(calls.generations, 0);
});

async function sourceFiles(directory) {
  const output = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) output.push(...await sourceFiles(file));
    else if (/\.(?:ts|tsx|js|mjs|json|env|example)$/.test(entry.name)) output.push(file);
  }
  return output;
}

test('client and committed source contain no secret values', async () => {
  const files = [
    ...await sourceFiles(path.resolve('src')),
    ...await sourceFiles(path.resolve('app')),
    path.resolve('app.config.js'),
    path.resolve('.env.example'),
  ];
  for (const file of files) {
    const value = await readFile(file, 'utf8');
    assert.doesNotMatch(value, /xai-[A-Za-z0-9_-]{20,}/, file);
    assert.doesNotMatch(value, /(?:service_role|sb_secret)_[A-Za-z0-9_-]{20,}/, file);
    assert.doesNotMatch(value, /XAI_API_KEY\s*=\s*[^\s#]+/, file);
    assert.doesNotMatch(value, /REVENUECAT_(?:SECRET|WEBHOOK_(?:AUTHORIZATION|SIGNING_SECRET))\s*=\s*[^\s#]+/, file);
  }
});
