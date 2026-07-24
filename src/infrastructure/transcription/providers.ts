import { GearXError } from '../../domain/errors';
import { TranscriptionInput, TranscriptionProvider, TranscriptionResult } from './types';

export class DeviceTranscriptionAdapter implements TranscriptionProvider {
  id = 'device-adapter';
  name = 'On-device transcription';
  remote = false;

  async isAvailable(): Promise<boolean> {
    return false;
  }

  async transcribe(_input: TranscriptionInput): Promise<TranscriptionResult> {
    throw new GearXError(
      'PROVIDER_UNAVAILABLE',
      'Offline transcription requires a configured native Whisper-compatible module.',
    );
  }
}

export class MockTranscriptionProvider implements TranscriptionProvider {
  id = 'mock-test';
  name = 'Deterministic test transcription';
  remote = false;

  constructor(private readonly result: TranscriptionResult) {}
  async isAvailable() {
    return true;
  }
  async transcribe(input: TranscriptionInput) {
    if (input.signal?.aborted) throw new GearXError('TRANSCRIPTION_FAILED', 'Cancelled');
    return this.result;
  }
}

export interface BackendTranscriptionConfig {
  baseUrl: string;
  getAccessToken: () => Promise<string>;
  hasRemoteConsent: () => boolean;
}

export class BackendTranscriptionProvider implements TranscriptionProvider {
  id = 'secure-backend';
  name = 'Configured remote transcription';
  remote = true;

  constructor(private readonly config: BackendTranscriptionConfig) {}

  async isAvailable(): Promise<boolean> {
    if (!this.config.hasRemoteConsent()) return false;
    try {
      const response = await fetch(`${this.config.baseUrl}/health`, { method: 'GET' });
      return response.ok;
    } catch {
      return false;
    }
  }

  async transcribe(input: TranscriptionInput): Promise<TranscriptionResult> {
    if (!this.config.hasRemoteConsent()) {
      throw new GearXError('REMOTE_CONSENT_MISSING', 'Remote transcription consent is required.');
    }
    const token = await this.config.getAccessToken();
    const response = await fetch(`${this.config.baseUrl}/v1/transcriptions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sessionId: input.sessionId, audioUri: input.audioUri }),
      signal: input.signal,
    });
    if (!response.ok) {
      throw new GearXError('TRANSCRIPTION_FAILED', `Transcription failed (${response.status}).`);
    }
    const result = (await response.json()) as Partial<TranscriptionResult>;
    if (typeof result.text !== 'string' || !Array.isArray(result.segments)) {
      throw new GearXError('TRANSCRIPTION_FAILED', 'Invalid transcription response.');
    }
    return {
      text: result.text,
      confidence: typeof result.confidence === 'number' ? result.confidence : null,
      segments: result.segments,
    };
  }
}
