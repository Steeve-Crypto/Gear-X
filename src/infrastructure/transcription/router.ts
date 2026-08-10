import { GearXError } from '../../domain/errors';
import { TranscriptionInput, TranscriptionProvider, TranscriptionResult } from './types';
import { RemoteUsagePolicy } from '../providers/remoteUsagePolicy';

export class TranscriptionRouter implements TranscriptionProvider {
  id = 'transcription-router';
  name = 'Transcription router';
  remote = false;

  constructor(
    private readonly providers: readonly TranscriptionProvider[],
    private readonly remoteUsage?: RemoteUsagePolicy,
    private readonly timeoutMs = 120_000,
  ) {}

  async isAvailable(): Promise<boolean> {
    for (const provider of this.providers) {
      if (await provider.isAvailable()) return true;
    }
    return false;
  }

  async transcribe(input: TranscriptionInput): Promise<TranscriptionResult> {
    let lastError: unknown;
    for (const provider of this.providers) {
      if (input.signal?.aborted) throw new GearXError('TRANSCRIPTION_FAILED', 'Cancelled');
      if (!(await provider.isAvailable())) continue;
      if (provider.remote && this.remoteUsage && !(await this.remoteUsage.reserve(
        provider.id,
        'transcription',
      ))) {
        lastError = new GearXError('PROVIDER_UNAVAILABLE', 'The daily cloud request limit was reached.');
        continue;
      }
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
        const cancel = () => controller.abort();
        input.signal?.addEventListener('abort', cancel, { once: true });
        try {
          return await provider.transcribe({ ...input, signal: controller.signal });
        } finally {
          clearTimeout(timeout);
          input.signal?.removeEventListener('abort', cancel);
        }
      } catch (error) {
        lastError = error;
        if (error instanceof GearXError && (
          error.code === 'REMOTE_CONSENT_MISSING' || error.code === 'MIC_PERMISSION_DENIED'
        )) throw error;
      }
    }
    throw new GearXError(
      'PROVIDER_UNAVAILABLE',
      'No allowed transcription provider is available.',
      lastError,
    );
  }
}
