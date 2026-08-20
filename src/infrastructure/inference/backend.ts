import { GearXError } from '../../domain/errors';
import { canUseProvider } from '../../domain/privacy';
import { InferenceProvider, InferenceRequest } from './types';
import { AICapability } from '../../domain/aiCapabilities';

const capabilities: AICapability[] = [
  'structured-extraction',
  'relationship-refinement',
  'summarization',
  'question-refinement',
  'answer-synthesis',
];

type BackendErrorCode =
  | 'UNAUTHORIZED' | 'CONSENT_REQUIRED' | 'QUOTA_EXCEEDED' | 'INVALID_REQUEST'
  | 'PAYLOAD_TOO_LARGE' | 'PROVIDER_UNAVAILABLE' | 'PROVIDER_TIMEOUT'
  | 'MALFORMED_PROVIDER_OUTPUT' | 'INTERNAL_ERROR';

async function backendFailure(response: Response): Promise<GearXError> {
  try {
    const payload = await response.json() as { error?: { code?: BackendErrorCode; message?: string } };
    if (payload.error?.code) {
      return new GearXError(payload.error.code, payload.error.message || 'Cloud processing failed.');
    }
  } catch { /* Return a redacted fallback below. */ }
  return new GearXError('PROVIDER_UNAVAILABLE', `Backend request failed (${response.status}).`);
}

export interface BackendInferenceConfig {
  baseUrl: string;
  getAccessToken: () => Promise<string>;
  hasRemoteConsent: () => boolean;
  onCloudUnavailable?: (code: string) => void;
}

export class BackendInferenceProvider implements InferenceProvider {
  id = 'secure-backend';
  name = 'Secure backend inference';
  remote = true;
  metadata = { capabilities, costClass: 'metered' as const, configured: true };

  constructor(private readonly config: BackendInferenceConfig) {}

  async isAvailable(signal?: AbortSignal): Promise<boolean> {
    if (!canUseProvider(this.remote, this.config.hasRemoteConsent())) return false;
    try {
      const token = await this.config.getAccessToken();
      const response = await fetch(`${this.config.baseUrl}/health`, {
        signal,
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async generate(request: InferenceRequest): Promise<string> {
    if (!canUseProvider(this.remote, this.config.hasRemoteConsent())) {
      throw new GearXError('REMOTE_CONSENT_MISSING', 'Remote inference consent is required.');
    }
    const token = await this.config.getAccessToken();
    const response = await fetch(`${this.config.baseUrl}/v1/generate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Gear-X-Remote-Consent': 'granted',
      },
      signal: request.signal,
      body: JSON.stringify({
        system: request.system,
        prompt: request.prompt,
        temperature: request.temperature,
        maxTokens: request.maxTokens,
        capability: request.capability,
      }),
    });
    if (!response.ok) {
      const error = await backendFailure(response);
      this.config.onCloudUnavailable?.(error.code);
      throw error;
    }
    const payload = (await response.json()) as { text?: string };
    if (!payload.text?.trim()) throw new GearXError('INVALID_MODEL_OUTPUT', 'Backend returned no text.');
    return payload.text.trim();
  }
}
