import { GearXError } from '../../domain/errors';
import { InferenceProvider, InferenceRequest } from './types';

export class OllamaProvider implements InferenceProvider {
  id = 'ollama';
  name = 'Ollama';
  remote = false;

  constructor(
    private readonly baseUrl: string,
    private readonly model: string,
    private readonly timeoutMs = 12_000,
  ) {}

  async isAvailable(signal?: AbortSignal): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, { signal });
      if (!response.ok) return false;
      const payload = (await response.json()) as { models?: { name?: string }[] };
      return Boolean(payload.models?.some((item) => item.name?.startsWith(this.model)));
    } catch {
      return false;
    }
  }

  async generate(request: InferenceRequest): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    const abort = () => controller.abort();
    request.signal?.addEventListener('abort', abort, { once: true });
    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          model: this.model,
          stream: false,
          options: {
            temperature: request.temperature ?? 0.2,
            num_predict: request.maxTokens ?? 512,
          },
          messages: [
            { role: 'system', content: request.system },
            { role: 'user', content: request.prompt },
          ],
        }),
      });
      if (!response.ok) {
        throw new GearXError('MODEL_UNAVAILABLE', `Ollama returned ${response.status}.`);
      }
      const payload = (await response.json()) as { message?: { content?: string } };
      if (!payload.message?.content?.trim()) {
        throw new GearXError('INVALID_MODEL_OUTPUT', 'Ollama returned no content.');
      }
      return payload.message.content.trim();
    } catch (cause) {
      if (controller.signal.aborted) throw new GearXError('TIMEOUT', 'Ollama request cancelled.', cause);
      if (cause instanceof GearXError) throw cause;
      throw new GearXError('PROVIDER_UNAVAILABLE', 'Ollama is unavailable.', cause);
    } finally {
      clearTimeout(timeout);
      request.signal?.removeEventListener('abort', abort);
    }
  }
}
