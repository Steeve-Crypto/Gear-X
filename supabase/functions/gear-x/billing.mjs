export const CLOUD_CAPABILITIES = Object.freeze([
  'cloud_transcription',
  'cloud_extraction',
  'cloud_weaving',
  'cloud_summarization',
  'cloud_questioning',
  'cloud_answer_synthesis',
]);

const INFERENCE_CAPABILITY_MAP = Object.freeze({
  'structured-extraction': 'cloud_extraction',
  'relationship-refinement': 'cloud_weaving',
  summarization: 'cloud_summarization',
  'question-refinement': 'cloud_questioning',
  'answer-synthesis': 'cloud_answer_synthesis',
});

export function cloudCapabilityForInference(capability) {
  return INFERENCE_CAPABILITY_MAP[capability] ?? null;
}

export function isSubscriptionEffective(subscription, nowMs = Date.now()) {
  if (!subscription) return false;
  const now = Number(nowMs);
  const end = Number(subscription.expiresAt ?? 0);
  const grace = Number(subscription.graceExpiresAt ?? 0);
  if (subscription.status === 'active') return !end || end > now;
  if (subscription.status === 'cancelled') return end > now;
  if (subscription.status === 'grace' || subscription.status === 'billing_retry') {
    return grace > now;
  }
  return false;
}

export function normalizeRevenueCatEvent(event, planId) {
  if (!event || typeof event !== 'object' || typeof event.id !== 'string'
    || typeof event.type !== 'string' || typeof event.app_user_id !== 'string') return null;
  const occurredAt = Number(event.event_timestamp_ms ?? Date.now());
  const expiresAt = Number(event.expiration_at_ms ?? 0) || null;
  const graceExpiresAt = Number(event.grace_period_expiration_at_ms ?? 0) || null;
  const reason = String(event.cancel_reason ?? event.expiration_reason ?? '');
  let status = 'none';
  let cancelAtPeriodEnd = false;
  switch (event.type) {
    case 'INITIAL_PURCHASE':
    case 'RENEWAL':
    case 'UNCANCELLATION':
    case 'SUBSCRIPTION_EXTENDED':
    case 'PRODUCT_CHANGE':
      status = 'active';
      break;
    case 'CANCELLATION':
      status = reason === 'CUSTOMER_SUPPORT' ? 'revoked' : 'cancelled';
      cancelAtPeriodEnd = status === 'cancelled';
      break;
    case 'BILLING_ISSUE':
      status = graceExpiresAt ? 'grace' : 'billing_retry';
      break;
    case 'EXPIRATION':
      status = reason === 'CUSTOMER_SUPPORT' ? 'revoked' : 'expired';
      break;
    case 'TRANSFER':
      status = 'active';
      break;
    default:
      return null;
  }
  const transferredTo = Array.isArray(event.transferred_to) ? event.transferred_to[0] : null;
  return {
    eventId: event.id,
    eventType: event.type,
    eventAt: occurredAt,
    userId: typeof transferredTo === 'string' && transferredTo ? transferredTo : event.app_user_id,
    sourceUserId: event.app_user_id,
    productId: typeof event.product_id === 'string' ? event.product_id : null,
    planId,
    status,
    expiresAt,
    graceExpiresAt,
    cancelAtPeriodEnd,
    environment: event.environment === 'PRODUCTION' ? 'production' : 'sandbox',
  };
}

