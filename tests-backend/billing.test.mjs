import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
  cloudCapabilityForInference,
  isSubscriptionEffective,
  normalizeRevenueCatEvent,
} from '../supabase/functions/gear-x/billing.mjs';

const now = Date.UTC(2026, 7, 20);
const event = (type, patch = {}) => ({
  id: `event-${type}-${patch.event_timestamp_ms ?? now}`,
  type,
  app_user_id: '11111111-1111-4111-8111-111111111111',
  product_id: 'gearx.cloud.monthly',
  event_timestamp_ms: now,
  expiration_at_ms: now + 86_400_000,
  environment: 'PRODUCTION',
  ...patch,
});

test('maps every inference operation to an independent cloud capability', () => {
  assert.equal(cloudCapabilityForInference('structured-extraction'), 'cloud_extraction');
  assert.equal(cloudCapabilityForInference('relationship-refinement'), 'cloud_weaving');
  assert.equal(cloudCapabilityForInference('summarization'), 'cloud_summarization');
  assert.equal(cloudCapabilityForInference('question-refinement'), 'cloud_questioning');
  assert.equal(cloudCapabilityForInference('answer-synthesis'), 'cloud_answer_synthesis');
});

test('active, cancellation period, and grace retain access only until effective dates', () => {
  assert.equal(isSubscriptionEffective({ status: 'active', expiresAt: now + 1 }, now), true);
  assert.equal(isSubscriptionEffective({ status: 'cancelled', expiresAt: now + 1 }, now), true);
  assert.equal(isSubscriptionEffective({ status: 'cancelled', expiresAt: now - 1 }, now), false);
  assert.equal(isSubscriptionEffective({ status: 'grace', graceExpiresAt: now + 1 }, now), true);
  assert.equal(isSubscriptionEffective({ status: 'billing_retry', graceExpiresAt: now - 1 }, now), false);
});

test('expiration and refund revoke entitlement', () => {
  assert.equal(normalizeRevenueCatEvent(event('EXPIRATION'), 'cloud_standard').status, 'expired');
  assert.equal(normalizeRevenueCatEvent(event('CANCELLATION', { cancel_reason: 'CUSTOMER_SUPPORT' }), 'cloud_standard').status, 'revoked');
  assert.equal(isSubscriptionEffective({ status: 'revoked', expiresAt: now + 1000 }, now), false);
});

test('renewal restore and product changes activate mapped plans', () => {
  for (const type of ['INITIAL_PURCHASE', 'RENEWAL', 'UNCANCELLATION', 'PRODUCT_CHANGE']) {
    const normalized = normalizeRevenueCatEvent(event(type), type === 'PRODUCT_CHANGE' ? 'cloud_premium' : 'cloud_standard');
    assert.equal(normalized.status, 'active');
    assert.equal(normalized.planId, type === 'PRODUCT_CHANGE' ? 'cloud_premium' : 'cloud_standard');
  }
});

test('store transfer associates restore with replacement anonymous identity', () => {
  const replacement = '22222222-2222-4222-8222-222222222222';
  const normalized = normalizeRevenueCatEvent(event('TRANSFER', { transferred_to: [replacement] }), 'cloud_standard');
  assert.equal(normalized.userId, replacement);
  assert.equal(normalized.sourceUserId, '11111111-1111-4111-8111-111111111111');
});

test('database reservation serializes duration token rate and budget checks', async () => {
  const sql = await readFile('supabase/migrations/20260820002000_entitlements_billing.sql', 'utf8');
  assert.match(sql, /pg_advisory_xact_lock\(hashtextextended\(p_user_id::text/);
  assert.match(sql, /sum\(duration_ms\)/);
  assert.match(sql, /sum\(coalesce\(input_tokens \+ output_tokens, reserved_tokens\)\)/);
  assert.match(sql, /daily_budget_micros/);
  assert.match(sql, /disabled_capabilities/);
});
