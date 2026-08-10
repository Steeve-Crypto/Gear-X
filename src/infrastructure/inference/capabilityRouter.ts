import { AICapability } from '../../domain/aiCapabilities';
import { GearXError } from '../../domain/errors';
import { InferenceProvider, InferenceRequest } from './types';

export class CapabilityInferenceRouter implements InferenceProvider {
  id = 'capability-router';
  name = 'Capability router';
  remote = false;

  constructor(
    private readonly providers: readonly InferenceProvider[],
    private readonly timeoutMs = 12_000,
  ) {}

  private candidates(capability?: AICapability) {
    return this.providers.filter((provider) => (
      !capability || !provider.metadata || provider.metadata.capabilities.includes(capability)
    ));
  }

  async isAvailable(signal?: AbortSignal): Promise<boolean> {
    for (const provider of this.providers) {
      if (signal?.aborted) return false;
      if (provider.metadata?.configured === false) continue;
      if (await provider.isAvailable(signal)) return true;
    }
    return false;
  }

  async generate(request: InferenceRequest): Promise<string> {
    let lastError: unknown;
    for (const provider of this.candidates(request.capability)) {
      if (request.signal?.aborted) {
        throw new GearXError('TIMEOUT', 'Inference was cancelled.');
      }
      if (provider.metadata?.configured === false || !(await provider.isAvailable(request.signal))) {
        continue;
      }
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
      const cancel = () => controller.abort();
      request.signal?.addEventListener('abort', cancel, { once: true });
      try {
        const output = await provider.generate({ ...request, signal: controller.signal });
        if (output.trim()) return output;
      } catch (error) {
        lastError = error;
      } finally {
        clearTimeout(timeout);
        request.signal?.removeEventListener('abort', cancel);
      }
    }
    throw new GearXError(
      'PROVIDER_UNAVAILABLE',
      'No configured provider can perform this intelligence task.',
      lastError,
    );
  }
}
