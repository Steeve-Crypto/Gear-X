import { createClient } from 'npm:@supabase/supabase-js@2';
import { BackendError, createGearXHandler, ERROR_CODES } from './core.mjs';
import { isSubscriptionEffective, normalizeRevenueCatEvent } from './billing.mjs';

const required = (name: string): string => {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing server configuration: ${name}`);
  return value;
};

const integerSetting = (name: string, fallback: number): number => {
  const value = Number(Deno.env.get(name) ?? fallback);
  return Number.isInteger(value) && value > 0 ? value : fallback;
};

const supabaseUrl = required('SUPABASE_URL');
const supabaseAnonKey = required('SUPABASE_ANON_KEY');
const supabaseServiceKey = required('SUPABASE_SERVICE_ROLE_KEY');
const xaiApiKey = Deno.env.get('XAI_API_KEY') ?? '';
const revenueCatWebhookAuthorization = required('REVENUECAT_WEBHOOK_AUTHORIZATION');
const admin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const limits = {
  maxSystemChars: integerSetting('GEAR_X_MAX_SYSTEM_CHARS', 4_000),
  maxPromptChars: integerSetting('GEAR_X_MAX_PROMPT_CHARS', 16_000),
  maxOutputTokens: integerSetting('GEAR_X_MAX_OUTPUT_TOKENS', 1_200),
  maxGenerateBytes: integerSetting('GEAR_X_MAX_GENERATE_BYTES', 24_000),
  maxAudioBytes: integerSetting('GEAR_X_MAX_AUDIO_BYTES', 10 * 1024 * 1024),
  maxAudioDurationMs: integerSetting('GEAR_X_MAX_AUDIO_DURATION_MS', 15 * 60 * 1_000),
  multipartOverheadBytes: 64 * 1024,
  intelligenceDailyLimit: integerSetting('GEAR_X_INTELLIGENCE_DAILY_LIMIT', 50),
  transcriptionDailyLimit: integerSetting('GEAR_X_TRANSCRIPTION_DAILY_LIMIT', 20),
  requestsPerMinute: integerSetting('GEAR_X_REQUESTS_PER_MINUTE', 10),
  providerTimeoutMs: integerSetting('GEAR_X_PROVIDER_TIMEOUT_MS', 25_000),
  sttMicrosPerHour: integerSetting('GEAR_X_STT_MICROS_PER_HOUR', 100_000),
  intelligenceMicrosPerMillionReserved: integerSetting('GEAR_X_INTELLIGENCE_MICROS_PER_MILLION_RESERVED', 10_000_000),
};

async function providerFetch(url: string, init: RequestInit, signal: AbortSignal): Promise<Response> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal.addEventListener('abort', abort, { once: true });
  const timeout = setTimeout(() => controller.abort(), limits.providerTimeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (error) {
    if (controller.signal.aborted) {
      throw new BackendError(ERROR_CODES.PROVIDER_TIMEOUT, 'The provider timed out.', 504);
    }
    throw new BackendError(ERROR_CODES.PROVIDER_UNAVAILABLE, 'The provider is unavailable.', 503);
  } finally {
    clearTimeout(timeout);
    signal.removeEventListener('abort', abort);
  }
}

const corsHeaders = (req: Request): Record<string, string> => {
  const configured = (Deno.env.get('GEAR_X_ALLOWED_ORIGINS') ?? '').split(',').map((v) => v.trim());
  const origin = req.headers.get('origin') ?? '';
  return {
    'Access-Control-Allow-Origin': configured.includes(origin) ? origin : 'null',
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-gear-x-remote-consent',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Max-Age': '600',
    Vary: 'Origin',
  };
};

const handler = createGearXHandler({
  limits,
  randomId: () => crypto.randomUUID(),
  tokenExpiry: (token: string) => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      return typeof payload.exp === 'number' ? payload.exp : null;
    } catch { return null; }
  },
  corsHeaders,
  authenticate: async (token: string) => {
    const { data, error } = await admin.auth.getUser(token);
    return error ? null : data.user;
  },
  reserveUsage: async ({ userId, capability, provider, bytes, durationMs, reservedTokens }: {
    userId: string; capability: string; provider: string; bytes: number; durationMs: number; reservedTokens: number;
  }) => {
    const estimatedCostMicros = capability === 'cloud_transcription'
      ? Math.ceil((durationMs / 3_600_000) * limits.sttMicrosPerHour)
      : Math.ceil((reservedTokens / 1_000_000) * limits.intelligenceMicrosPerMillionReserved);
    const { data, error } = await admin.rpc('reserve_gear_x_entitled_usage', {
      p_user_id: userId,
      p_capability: capability,
      p_provider: provider,
      p_request_bytes: bytes,
      p_duration_ms: durationMs,
      p_reserved_tokens: reservedTokens,
      p_estimated_cost_micros: estimatedCostMicros,
    });
    if (error || !data?.[0]) {
      throw new BackendError(ERROR_CODES.INTERNAL_ERROR, 'Usage accounting is unavailable.', 500);
    }
    return data[0];
  },
  completeUsage: async (usageId: number, result: { status: string; inputTokens?: number; outputTokens?: number }) => {
    if (!usageId) return;
    const { error } = await admin.rpc('complete_gear_x_cloud_usage', {
      p_usage_id: usageId,
      p_status: result.status,
      p_input_tokens: result.inputTokens ?? null,
      p_output_tokens: result.outputTokens ?? null,
    });
    if (error) throw new BackendError(ERROR_CODES.INTERNAL_ERROR, 'Usage accounting is unavailable.', 500);
  },
  getEntitlementSummary: async (userId: string) => {
    const { data: subscription } = await admin.from('gear_x_subscriptions').select('*').eq('user_id', userId).maybeSingle();
    const effective = isSubscriptionEffective(subscription ? {
      status: subscription.status,
      expiresAt: subscription.expires_at ? Date.parse(subscription.expires_at) : null,
      graceExpiresAt: subscription.grace_expires_at ? Date.parse(subscription.grace_expires_at) : null,
    } : null);
    const planId = effective ? subscription.plan_id : 'baseline';
    const { data: plan, error } = await admin.from('gear_x_plan_definitions').select('*').eq('id', planId).single();
    if (error || !plan) throw new BackendError(ERROR_CODES.INTERNAL_ERROR, 'Entitlement state is unavailable.', 500);
    const dayStart = new Date(); dayStart.setUTCHours(0, 0, 0, 0);
    const monthStart = new Date(Date.UTC(dayStart.getUTCFullYear(), dayStart.getUTCMonth(), 1));
    const { data: usage } = await admin.from('gear_x_cloud_usage')
      .select('capability,duration_ms,reserved_tokens,input_tokens,output_tokens,created_at')
      .eq('user_id', userId).gte('created_at', monthStart.toISOString());
    const rows = usage ?? [];
    const daily = rows.filter((row) => Date.parse(row.created_at) >= dayStart.getTime());
    const usedDailyDuration = daily.reduce((sum, row) => sum + Number(row.duration_ms || 0), 0);
    const usedMonthlyTokens = rows.reduce((sum, row) => sum + Number(
      row.input_tokens == null || row.output_tokens == null
        ? row.reserved_tokens : row.input_tokens + row.output_tokens,
    ), 0);
    return {
      planId: plan.id,
      displayName: plan.display_name,
      status: effective ? subscription.status : 'none',
      capabilities: plan.cloud_capabilities,
      expiresAt: effective ? subscription.expires_at : null,
      cancelAtPeriodEnd: effective ? subscription.cancel_at_period_end : false,
      allowances: {
        transcriptionDailyMsRemaining: Math.max(Number(plan.transcription_daily_ms) - usedDailyDuration, 0),
        intelligenceMonthlyTokensRemaining: Math.max(Number(plan.intelligence_monthly_tokens) - usedMonthlyTokens, 0),
      },
    };
  },
  handleBillingWebhook: async (request: Request) => {
    if (request.headers.get('authorization') !== revenueCatWebhookAuthorization) {
      throw new BackendError(ERROR_CODES.UNAUTHORIZED, 'Webhook authentication failed.', 401);
    }
    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > 64 * 1024) {
      throw new BackendError(ERROR_CODES.PAYLOAD_TOO_LARGE, 'Webhook payload is too large.', 413);
    }
    let payload: { event?: Record<string, unknown> };
    try { payload = JSON.parse(raw); } catch {
      throw new BackendError(ERROR_CODES.INVALID_REQUEST, 'Webhook JSON is malformed.', 400);
    }
    const event = payload.event;
    const productId = typeof event?.product_id === 'string' ? event.product_id : '';
    const { data: mapping } = productId
      ? await admin.from('gear_x_billing_product_mappings').select('plan_id').eq('product_id', productId).eq('active', true).maybeSingle()
      : { data: null };
    const normalized = normalizeRevenueCatEvent(event, mapping?.plan_id ?? null);
    if (!normalized || !/^[0-9a-f-]{36}$/i.test(normalized.userId)) {
      throw new BackendError(ERROR_CODES.INVALID_REQUEST, 'Webhook event is invalid.', 400);
    }
    const { error } = await admin.rpc('apply_gear_x_billing_event', {
      p_event_id: normalized.eventId,
      p_event_type: normalized.eventType,
      p_event_at: new Date(normalized.eventAt).toISOString(),
      p_user_id: normalized.userId,
      p_product_id: normalized.productId,
      p_plan_id: normalized.planId,
      p_status: normalized.status,
      p_expires_at: normalized.expiresAt ? new Date(normalized.expiresAt).toISOString() : null,
      p_grace_expires_at: normalized.graceExpiresAt ? new Date(normalized.graceExpiresAt).toISOString() : null,
      p_cancel_at_period_end: normalized.cancelAtPeriodEnd,
      p_environment: normalized.environment,
    });
    if (error) throw new BackendError(ERROR_CODES.INTERNAL_ERROR, 'Billing synchronization failed.', 500);
  },
  generate: async (payload: Record<string, unknown>, signal: AbortSignal, modelClass?: string) => {
    if (!xaiApiKey) throw new BackendError(ERROR_CODES.CLOUD_DISABLED, 'Cloud intelligence is unavailable.', 503);
    const response = await providerFetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${xaiApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: modelClass === 'premium'
          ? (Deno.env.get('XAI_CHAT_MODEL_PREMIUM') ?? Deno.env.get('XAI_CHAT_MODEL') ?? 'grok-4.5')
          : (Deno.env.get('XAI_CHAT_MODEL') ?? 'grok-4.5'),
        messages: [
          { role: 'system', content: payload.system },
          { role: 'user', content: payload.prompt },
        ],
        temperature: payload.temperature,
        max_tokens: payload.maxTokens,
      }),
    }, signal);
    if (!response.ok) {
      throw new BackendError(ERROR_CODES.PROVIDER_UNAVAILABLE, 'The provider rejected the request.', 503);
    }
    let body: { choices?: { message?: { content?: string } }[]; usage?: { prompt_tokens?: number; completion_tokens?: number } };
    try { body = await response.json(); } catch {
      throw new BackendError(ERROR_CODES.MALFORMED_PROVIDER_OUTPUT, 'Provider returned invalid data.', 502);
    }
    return {
      text: body.choices?.[0]?.message?.content ?? '',
      inputTokens: body.usage?.prompt_tokens,
      outputTokens: body.usage?.completion_tokens,
    };
  },
  transcribe: async ({ file, durationMs }: { file: File; durationMs: number }, signal: AbortSignal) => {
    if (!xaiApiKey) throw new BackendError(ERROR_CODES.CLOUD_DISABLED, 'Enhanced transcription is unavailable.', 503);
    const body = new FormData();
    body.append('file', file, file.name || 'recording.m4a');
    const response = await providerFetch('https://api.x.ai/v1/stt', {
      method: 'POST',
      headers: { Authorization: `Bearer ${xaiApiKey}` },
      body,
    }, signal);
    if (!response.ok) {
      throw new BackendError(ERROR_CODES.PROVIDER_UNAVAILABLE, 'The transcription provider rejected the request.', 503);
    }
    let result: { text?: string };
    try { result = await response.json(); } catch {
      throw new BackendError(ERROR_CODES.MALFORMED_PROVIDER_OUTPUT, 'Provider returned invalid transcription data.', 502);
    }
    return { text: result.text ?? '', confidence: null, segments: result.text ? [{
      text: result.text, startMs: 0, endMs: durationMs, confidence: null, speakerLabel: null,
    }] : [] };
  },
  logMetadata: (event: Record<string, unknown>) => console.log(JSON.stringify(event)),
});

Deno.serve(async (request) => {
  const response = await handler(request);
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(corsHeaders(request))) headers.set(name, value);
  return new Response(response.body, { status: response.status, headers });
});
