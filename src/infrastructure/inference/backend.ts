import { GearXError } from '../../domain/errors';
import { canUseProvider } from '../../domain/privacy';
import { InferenceProvider, InferenceRequest } from './types';

export interface BackendInferenceConfig {
  baseUrl: string;
  getAccessToken: () => Promise<string>;
  hasRemoteConsent: () => boolean;
}

export class BackendInferenceProvider implements InferenceProvider {
  id = 'secure-backend';
  name = 'Secure backend inference';
  remote = true;

  constructor(private readonly config: BackendInferenceConfig) {}

  async isAvailable(signal?: AbortSignal): Promise<boolean> {
    if (!canUseProvider(this.remote, this.config.hasRemoteConsent())) return false;
    try {
      const response = await fetch(`${this.config.baseUrl}/health`, { signal });
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
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      signal: request.signal,
      body: JSON.stringify({
        system: request.system,
        prompt: request.prompt,
        temperature: request.temperature,
        maxTokens: request.maxTokens,
      }),
    });
    if (!response.ok) throw new GearXError('PROVIDER_UNAVAILABLE', `Backend returned ${response.status}.`);
    const payload = (await response.json()) as { text?: string };
    if (!payload.text?.trim()) throw new GearXError('INVALID_MODEL_OUTPUT', 'Backend returned no text.');
    return payload.text.trim();
  }
}
