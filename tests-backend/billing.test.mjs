import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
  cloudCapabilityForInference,
  isSubscriptionEffective,
  normalizeRevenueCatEvent,
  normalizeRevenueCatStore,
  normalizeStoreProductId,
  verifyRevenueCatWebhookSignature,
} from '../supabase/functions/gear-x/billing.mjs';

const now = Date.UTC(2026, 7, 20);
const event = (type, patch = {}) => ({
  id: `event-${type}-${patch.event_timestamp_ms ?? now}`,
  type,
  app_user_id: '11111111-1111-4111-8111-111111111111',
  product_id: 'gearx.cloud.monthly',
  store: 'APP_STORE',
  entitlement_ids: ['gearx_pro'],
  purchased_at_ms: now - 1_000,
  event_timestamp_ms: now,
  expiration_at_ms: now + 86_400_000,
  environment: 'PRODUCTION',
  ...patch,
});

const mapping = (planId = 'pro', entitlement = 'gearx_pro', store = 'app_store') => ({
  planId, revenuecatEntitlementId: entitlement, store,
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
  assert.equal(normalizeRevenueCatEvent(event('EXPIRATION'), mapping()).status, 'expired');
  assert.equal(normalizeRevenueCatEvent(event('CANCELLATION', { cancel_reason: 'CUSTOMER_SUPPORT' }), mapping()).status, 'revoked');
  assert.equal(isSubscriptionEffective({ status: 'revoked', expiresAt: now + 1000 }, now), false);
});

test('renewal restore and product changes activate mapped plans', () => {
  for (const type of ['INITIAL_PURCHASE', 'RENEWAL', 'UNCANCELLATION', 'PRODUCT_CHANGE']) {
    const target = type === 'PRODUCT_CHANGE' ? mapping('max', 'gearx_max') : mapping();
    const normalized = normalizeRevenueCatEvent(event(type, {
      entitlement_ids: [target.revenuecatEntitlementId],
    }), target);
    assert.equal(normalized.status, 'active');
    assert.equal(normalized.planId, type === 'PRODUCT_CHANGE' ? 'max' : 'pro');
    assert.equal(normalized.periodStartedAt, now - 1_000);
    assert.equal(normalized.pendingChange, type === 'PRODUCT_CHANGE');
  }
});

test('store and entitlement mapping reject cross-store ambiguity', () => {
  assert.equal(normalizeRevenueCatStore('APP_STORE'), 'app_store');
  assert.equal(normalizeRevenueCatStore('PLAY_STORE'), 'play_store');
  assert.equal(normalizeRevenueCatStore('UNKNOWN_STORE'), null);
  assert.equal(normalizeStoreProductId('gearx_pro_monthly:monthly', 'play_store'), 'gearx_pro_monthly');
  assert.equal(normalizeStoreProductId('gearx_pro_monthly', 'app_store'), 'gearx_pro_monthly');
  assert.equal(normalizeRevenueCatEvent(event('RENEWAL'), mapping('pro', 'gearx_max')), null);
});

test('store transfer associates restore with replacement anonymous identity', () => {
  const replacement = '22222222-2222-4222-8222-222222222222';
  const normalized = normalizeRevenueCatEvent(event('TRANSFER', { transferred_to: [replacement] }), mapping());
  assert.equal(normalized.userId, replacement);
  assert.equal(normalized.sourceUserId, '11111111-1111-4111-8111-111111111111');
});

test('verifies raw-body HMAC and rejects replayed signatures', async () => {
  const raw = '{"event":{"id":"event-1"}}';
  const timestamp = Math.floor(now / 1000);
  const secret = 'revenuecat-test-signing-secret';
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  const bytes = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${timestamp}.${raw}`));
  const hex = [...new Uint8Array(bytes)].map((value) => value.toString(16).padStart(2, '0')).join('');
  const header = `t=${timestamp},v1=${hex}`;
  assert.equal(await verifyRevenueCatWebhookSignature(raw, header, secret, now), true);
  assert.equal(await verifyRevenueCatWebhookSignature(`${raw} `, header, secret, now), false);
  assert.equal(await verifyRevenueCatWebhookSignature(raw, header, secret, now + 301_000), false);
});

test('database reservation serializes duration token rate and budget checks', async () => {
  const sql = await readFile('supabase/migrations/20260820003000_launch_plans.sql', 'utf8');
  assert.match(sql, /pg_advisory_xact_lock\(hashtextextended\(p_user_id::text/);
  assert.match(sql, /sum\(duration_ms\)/);
  assert.match(sql, /reserved_input_tokens/);
  assert.match(sql, /reserved_output_tokens/);
  assert.match(sql, /current_period_started_at/);
  assert.match(sql, /monthly_provider_budget_micros/);
  assert.match(sql, /daily_budget_micros/);
  assert.match(sql, /disabled_capabilities/);
});

test('launch plans lock approved allowances and spend ceilings', async () => {
  const sql = await readFile('supabase/migrations/20260820003000_launch_plans.sql', 'utf8');
  assert.match(sql, /'free', 'GearX Free'[\s\S]*?1800000, 1800000[\s\S]*?30000, 15000[\s\S]*?250000/);
  assert.match(sql, /'pro', 'GearX Pro'[\s\S]*?36000000, 36000000[\s\S]*?300000, 100000[\s\S]*?3000000/);
  assert.match(sql, /'max', 'GearX Max'[\s\S]*?108000000, 108000000[\s\S]*?900000, 300000[\s\S]*?7000000/);
  assert.match(sql, /\('app_store', 'gearx_pro_monthly', 'pro', 'gearx_pro'\)/);
  assert.match(sql, /\('play_store', 'gearx_pro_monthly', 'pro', 'gearx_pro'\)/);
  assert.match(sql, /\('app_store', 'gearx_max_monthly', 'max', 'gearx_max'\)/);
  assert.match(sql, /\('play_store', 'gearx_max_monthly', 'max', 'gearx_max'\)/);
  assert.match(sql, /primary key \(store, product_id\)/);
  assert.match(sql, /'cloud_weaving':?\s*"premium"|"cloud_weaving":"premium"/);
  assert.match(sql, /1250000, 2500000, 2000000, 6000000/);
});

test('paid resets use verified billing period and free resets server-side', async () => {
  const sql = await readFile('supabase/migrations/20260820003000_launch_plans.sql', 'utf8');
  assert.match(sql, /'free'[\s\S]*?'calendar_month'/);
  assert.match(sql, /'pro'[\s\S]*?'billing_period'/);
  assert.match(sql, /v_period_start := v_subscription\.current_period_started_at/);
  assert.match(sql, /if p_pending_change then[\s\S]*pending_plan_id = p_plan_id/);
  assert.doesNotMatch(sql, /device_id|client_timestamp/);
});
