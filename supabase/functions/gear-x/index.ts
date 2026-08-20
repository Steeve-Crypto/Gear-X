import { createClient } from 'npm:@supabase/supabase-js@2';
import { BackendError, createGearXHandler, ERROR_CODES } from './core.mjs';

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
const xaiApiKey = required('XAI_API_KEY');
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
  reserveUsage: async ({ userId, operation, capability, bytes }: {
    userId: string; operation: string; capability: string; bytes: number;
  }) => {
    const dailyLimit = operation === 'transcription'
      ? limits.transcriptionDailyLimit : limits.intelligenceDailyLimit;
    const { data, error } = await admin.rpc('reserve_gear_x_backend_usage', {
      p_user_id: userId,
      p_operation: operation,
      p_capability: capability,
      p_request_bytes: bytes,
      p_daily_limit: dailyLimit,
      p_rate_limit: limits.requestsPerMinute,
    });
    if (error || !data?.[0]) {
      throw new BackendError(ERROR_CODES.INTERNAL_ERROR, 'Usage accounting is unavailable.', 500);
    }
    return data[0];
  },
  generate: async (payload: Record<string, unknown>, signal: AbortSignal) => {
    const response = await providerFetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${xaiApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: Deno.env.get('XAI_CHAT_MODEL') ?? 'grok-4.5',
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
    let body: { choices?: { message?: { content?: string } }[] };
    try { body = await response.json(); } catch {
      throw new BackendError(ERROR_CODES.MALFORMED_PROVIDER_OUTPUT, 'Provider returned invalid data.', 502);
    }
    return body.choices?.[0]?.message?.content ?? '';
  },
  transcribe: async ({ file, durationMs }: { file: File; durationMs: number }, signal: AbortSignal) => {
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
