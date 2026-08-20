import { cloudCapabilityForInference } from './billing.mjs';

export const ERROR_CODES = Object.freeze({
  UNAUTHORIZED: 'UNAUTHORIZED',
  CONSENT_REQUIRED: 'CONSENT_REQUIRED',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  INVALID_REQUEST: 'INVALID_REQUEST',
  PAYLOAD_TOO_LARGE: 'PAYLOAD_TOO_LARGE',
  PROVIDER_UNAVAILABLE: 'PROVIDER_UNAVAILABLE',
  PROVIDER_TIMEOUT: 'PROVIDER_TIMEOUT',
  MALFORMED_PROVIDER_OUTPUT: 'MALFORMED_PROVIDER_OUTPUT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  ENTITLEMENT_REQUIRED: 'ENTITLEMENT_REQUIRED',
  CLOUD_DISABLED: 'CLOUD_DISABLED',
});

const CAPABILITIES = new Set([
  'structured-extraction',
  'relationship-refinement',
  'summarization',
  'question-refinement',
  'answer-synthesis',
]);

const AUDIO_TYPES = new Set([
  'audio/m4a',
  'audio/mp4',
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/webm',
  'audio/ogg',
]);

export class BackendError extends Error {
  constructor(code, message, status, retryAfterSeconds) {
    super(message);
    this.name = 'BackendError';
    this.code = code;
    this.status = status;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export function errorResponse(error, requestId) {
  const safe = error instanceof BackendError
    ? error
    : new BackendError(ERROR_CODES.INTERNAL_ERROR, 'The request could not be completed.', 500);
  const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };
  if (safe.retryAfterSeconds) headers['Retry-After'] = String(safe.retryAfterSeconds);
  return new Response(JSON.stringify({
    error: { code: safe.code, message: safe.message, requestId },
  }), { status: safe.status, headers });
}

function success(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

function requestBytes(req) {
  const raw = req.headers.get('content-length');
  const parsed = raw ? Number(raw) : 0;
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 0;
}

export function validateGeneratePayload(value, limits) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new BackendError(ERROR_CODES.INVALID_REQUEST, 'A JSON object is required.', 400);
  }
  const { system, prompt, capability } = value;
  if (typeof system !== 'string' || !system.trim() || system.length > limits.maxSystemChars) {
    throw new BackendError(ERROR_CODES.INVALID_REQUEST, 'System context is invalid.', 400);
  }
  if (typeof prompt !== 'string' || !prompt.trim() || prompt.length > limits.maxPromptChars) {
    throw new BackendError(ERROR_CODES.INVALID_REQUEST, 'Task context is invalid.', 400);
  }
  if (!CAPABILITIES.has(capability)) {
    throw new BackendError(ERROR_CODES.INVALID_REQUEST, 'Capability is unsupported.', 400);
  }
  const temperature = value.temperature == null ? 0.2 : Number(value.temperature);
  const maxTokens = value.maxTokens == null ? 500 : Number(value.maxTokens);
  if (!Number.isFinite(temperature) || temperature < 0 || temperature > 1) {
    throw new BackendError(ERROR_CODES.INVALID_REQUEST, 'Temperature is invalid.', 400);
  }
  if (!Number.isInteger(maxTokens) || maxTokens < 1 || maxTokens > limits.maxOutputTokens) {
    throw new BackendError(ERROR_CODES.INVALID_REQUEST, 'Output limit is invalid.', 400);
  }
  return { system: system.trim(), prompt: prompt.trim(), capability, temperature, maxTokens };
}

export function validateCapabilityOutput(capability, raw) {
  if (typeof raw !== 'string' || !raw.trim()) {
    throw new BackendError(ERROR_CODES.MALFORMED_PROVIDER_OUTPUT, 'Provider returned no usable result.', 502);
  }
  const text = raw.replace(/```json|```/g, '').trim();
  if (capability === 'answer-synthesis') return text;
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new BackendError(ERROR_CODES.MALFORMED_PROVIDER_OUTPUT, 'Provider returned invalid structured data.', 502);
  }
  if (capability === 'structured-extraction') {
    const types = new Set(['fact', 'decision', 'action', 'entity', 'deadline', 'open_loop']);
    if (!Array.isArray(parsed) || parsed.length > 5 || parsed.some((item) => (
      !item || typeof item !== 'object' || !types.has(item.type)
      || typeof item.content !== 'string' || !item.content.trim()
      || typeof item.confidence !== 'number' || item.confidence < 0.5 || item.confidence > 1
    ))) throw new BackendError(ERROR_CODES.MALFORMED_PROVIDER_OUTPUT, 'Provider returned invalid insights.', 502);
  } else if (capability === 'summarization') {
    if (!parsed || typeof parsed !== 'object' || typeof parsed.title !== 'string'
      || !parsed.title.trim() || typeof parsed.body !== 'string' || !parsed.body.trim()) {
      throw new BackendError(ERROR_CODES.MALFORMED_PROVIDER_OUTPUT, 'Provider returned an invalid summary.', 502);
    }
  } else if (capability === 'question-refinement') {
    if (!Array.isArray(parsed) || parsed.length > 5
      || parsed.some((item) => typeof item !== 'string' || item.trim().length < 6 || item.length > 200)) {
      throw new BackendError(ERROR_CODES.MALFORMED_PROVIDER_OUTPUT, 'Provider returned invalid questions.', 502);
    }
  } else if (capability === 'relationship-refinement') {
    if ((!Array.isArray(parsed) && (!parsed || typeof parsed !== 'object'))) {
      throw new BackendError(ERROR_CODES.MALFORMED_PROVIDER_OUTPUT, 'Provider returned invalid relationships.', 502);
    }
  }
  return text;
}

function validateAudio(file, durationMs, limits) {
  if (!file || typeof file.arrayBuffer !== 'function' || typeof file.size !== 'number') {
    throw new BackendError(ERROR_CODES.INVALID_REQUEST, 'An audio file is required.', 400);
  }
  const type = String(file.type || '').toLowerCase();
  if (!AUDIO_TYPES.has(type)) {
    throw new BackendError(ERROR_CODES.INVALID_REQUEST, 'Audio type is unsupported.', 415);
  }
  if (file.size < 1) throw new BackendError(ERROR_CODES.INVALID_REQUEST, 'Audio file is empty.', 400);
  if (file.size > limits.maxAudioBytes) {
    throw new BackendError(ERROR_CODES.PAYLOAD_TOO_LARGE, 'Audio exceeds the upload limit.', 413);
  }
  if (!Number.isFinite(durationMs) || durationMs < 1 || durationMs > limits.maxAudioDurationMs) {
    throw new BackendError(ERROR_CODES.INVALID_REQUEST, 'Audio duration is invalid.', 400);
  }
  return { file, durationMs };
}

function bearerToken(req) {
  const header = req.headers.get('authorization') || '';
  return header.startsWith('Bearer ') ? header.slice(7).trim() : '';
}

function reservationError(reservation) {
  if (reservation.reason === 'entitlement') {
    return new BackendError(ERROR_CODES.ENTITLEMENT_REQUIRED, 'This cloud enhancement is not included.', 403);
  }
  if (reservation.reason === 'disabled' || reservation.reason === 'budget') {
    return new BackendError(ERROR_CODES.CLOUD_DISABLED, 'Cloud enhancements are temporarily unavailable.', 503);
  }
  if (reservation.reason === 'plan_limit') {
    return new BackendError(ERROR_CODES.PAYLOAD_TOO_LARGE, 'This request exceeds the plan limit.', 413);
  }
  if (reservation.reason === 'invalid') {
    return new BackendError(ERROR_CODES.INVALID_REQUEST, 'Usage reservation is invalid.', 400);
  }
  return new BackendError(ERROR_CODES.QUOTA_EXCEEDED,
    reservation.reason === 'rate' ? 'Request rate limit reached.' : 'Cloud allowance has been reached.',
    429, reservation.reason === 'rate' ? 60 : undefined);
}

export function createGearXHandler(deps) {
  const limits = deps.limits;
  return async function handle(req) {
    const requestId = deps.randomId();
    const started = Date.now();
    let route = 'unknown';
    let status = 500;
    let code = ERROR_CODES.INTERNAL_ERROR;
    try {
      if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: deps.corsHeaders(req) });
      const pathname = new URL(req.url).pathname.replace(/\/+$/, '');
      route = pathname.split('/gear-x').pop() || '/';
      if (req.method === 'POST' && route === '/v1/billing/revenuecat/webhook') {
        await deps.handleBillingWebhook(req);
        status = 200; code = 'OK';
        return success({ received: true });
      }
      const token = bearerToken(req);
      if (!token) throw new BackendError(ERROR_CODES.UNAUTHORIZED, 'Authentication is required.', 401);
      const user = await deps.authenticate(token);
      if (!user?.id) throw new BackendError(ERROR_CODES.UNAUTHORIZED, 'Authentication is invalid or expired.', 401);

      if (req.method === 'GET' && route === '/health') {
        status = 200; code = 'OK';
        return success({ status: 'ok' });
      }
      if (req.method === 'POST' && route === '/v1/mobile/session') {
        const expiresAt = deps.tokenExpiry(token);
        status = 200; code = 'OK';
        return success({ token, expiresAt, userId: user.id });
      }
      if (req.method === 'GET' && route === '/v1/entitlements') {
        const entitlement = await deps.getEntitlementSummary(user.id);
        status = 200; code = 'OK';
        return success(entitlement);
      }
      if (req.headers.get('x-gear-x-remote-consent') !== 'granted') {
        throw new BackendError(ERROR_CODES.CONSENT_REQUIRED, 'Remote-processing consent is required.', 403);
      }

      if (req.method === 'POST' && route === '/v1/generate') {
        if (!(req.headers.get('content-type') || '').toLowerCase().includes('application/json')) {
          throw new BackendError(ERROR_CODES.INVALID_REQUEST, 'JSON content type is required.', 415);
        }
        if (requestBytes(req) > limits.maxGenerateBytes) {
          throw new BackendError(ERROR_CODES.PAYLOAD_TOO_LARGE, 'Request context exceeds the limit.', 413);
        }
        let body;
        try { body = JSON.parse(await req.text()); } catch {
          throw new BackendError(ERROR_CODES.INVALID_REQUEST, 'Request JSON is malformed.', 400);
        }
        const payload = validateGeneratePayload(body, limits);
        const actualBytes = new TextEncoder().encode(JSON.stringify(body)).byteLength;
        if (actualBytes > limits.maxGenerateBytes) {
          throw new BackendError(ERROR_CODES.PAYLOAD_TOO_LARGE, 'Request context exceeds the limit.', 413);
        }
        const cloudCapability = cloudCapabilityForInference(payload.capability);
        if (!cloudCapability) throw new BackendError(ERROR_CODES.INVALID_REQUEST, 'Capability is unsupported.', 400);
        const reservation = await deps.reserveUsage({
          userId: user.id, capability: cloudCapability, provider: 'xai', bytes: actualBytes,
          durationMs: 0,
          reservedInputTokens: Math.ceil((payload.system.length + payload.prompt.length) / 4),
          reservedOutputTokens: payload.maxTokens,
        });
        if (!reservation.allowed) throw reservationError(reservation);
        let generated;
        try {
          generated = await deps.generate(payload, req.signal, reservation.modelClass);
        } catch (error) {
          await deps.completeUsage(reservation.usageId, { status: 'provider_failed' });
          throw error;
        }
        const raw = typeof generated === 'string' ? generated : generated.text;
        let text;
        try { text = validateCapabilityOutput(payload.capability, raw); } catch (error) {
          await deps.completeUsage(reservation.usageId, {
            status: 'malformed_output', inputTokens: generated.inputTokens, outputTokens: generated.outputTokens,
            actualCostMicros: generated.actualCostMicros,
          });
          throw error;
        }
        await deps.completeUsage(reservation.usageId, {
          status: 'completed', inputTokens: generated.inputTokens, outputTokens: generated.outputTokens,
          actualCostMicros: generated.actualCostMicros,
        });
        status = 200; code = 'OK';
        return success({ text, usage: { remaining: reservation.remaining } });
      }

      if (req.method === 'POST' && route === '/v1/transcriptions') {
        const contentType = (req.headers.get('content-type') || '').toLowerCase();
        if (!contentType.includes('multipart/form-data')) {
          throw new BackendError(ERROR_CODES.INVALID_REQUEST, 'Multipart audio is required.', 415);
        }
        if (requestBytes(req) > limits.maxAudioBytes + limits.multipartOverheadBytes) {
          throw new BackendError(ERROR_CODES.PAYLOAD_TOO_LARGE, 'Audio exceeds the upload limit.', 413);
        }
        let form;
        try { form = await req.formData(); } catch {
          throw new BackendError(ERROR_CODES.INVALID_REQUEST, 'Multipart request is malformed.', 400);
        }
        const file = form.get('file');
        const durationMs = Number(form.get('duration_ms'));
        const sessionId = String(form.get('session_id') || '');
        if (!sessionId || sessionId.length > 128) {
          throw new BackendError(ERROR_CODES.INVALID_REQUEST, 'Session identifier is invalid.', 400);
        }
        const audio = validateAudio(file, durationMs, limits);
        const reservation = await deps.reserveUsage({
          userId: user.id, capability: 'cloud_transcription', provider: 'xai', bytes: file.size,
          durationMs: audio.durationMs, reservedInputTokens: 0, reservedOutputTokens: 0,
        });
        if (!reservation.allowed) throw reservationError(reservation);
        let result;
        try { result = await deps.transcribe(audio, req.signal, reservation.modelClass); } catch (error) {
          await deps.completeUsage(reservation.usageId, { status: 'provider_failed' });
          throw error;
        }
        if (!result || typeof result.text !== 'string' || !result.text.trim()) {
          await deps.completeUsage(reservation.usageId, { status: 'malformed_output' });
          throw new BackendError(ERROR_CODES.MALFORMED_PROVIDER_OUTPUT, 'Provider returned no transcription.', 502);
        }
        await deps.completeUsage(reservation.usageId, { status: 'completed' });
        status = 200; code = 'OK';
        return success({
          text: result.text.trim(),
          confidence: typeof result.confidence === 'number' ? result.confidence : null,
          segments: Array.isArray(result.segments) && result.segments.length ? result.segments : [{
            text: result.text.trim(), startMs: 0, endMs: audio.durationMs,
            confidence: typeof result.confidence === 'number' ? result.confidence : null, speakerLabel: null,
          }],
          usage: { remaining: reservation.remaining },
        });
      }

      throw new BackendError(ERROR_CODES.INVALID_REQUEST, 'Route or method is unsupported.', 404);
    } catch (error) {
      const safe = error instanceof BackendError ? error
        : new BackendError(ERROR_CODES.INTERNAL_ERROR, 'The request could not be completed.', 500);
      status = safe.status; code = safe.code;
      return errorResponse(safe, requestId);
    } finally {
      deps.logMetadata({ requestId, route, status, code, durationMs: Date.now() - started });
    }
  };
}
