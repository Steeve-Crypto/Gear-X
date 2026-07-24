import { GearXError } from '../../domain/errors';
import { TranscriptionInput, TranscriptionProvider, TranscriptionResult } from './types';
import { canUseProvider } from '../../domain/privacy';

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

export class LocalWhisperServerProvider implements TranscriptionProvider {
  id = 'local-whisper-server';
  name = 'Local Whisper server';
  remote = true;

  constructor(
    private readonly baseUrl: string,
    private readonly hasRemoteConsent: () => boolean,
  ) {}

  async isAvailable(): Promise<boolean> {
    if (!canUseProvider(this.remote, this.hasRemoteConsent())) return false;
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }

  async transcribe(input: TranscriptionInput): Promise<TranscriptionResult> {
    if (!canUseProvider(this.remote, this.hasRemoteConsent())) {
      throw new GearXError('REMOTE_CONSENT_MISSING', 'Local-network transcription needs consent.');
    }
    const body = new FormData();
    body.append('session_id', input.sessionId);
    body.append('file', {
      uri: input.audioUri,
      name: `${input.sessionId}.m4a`,
      type: 'audio/m4a',
    } as unknown as Blob);
    const response = await fetch(`${this.baseUrl}/v1/transcriptions`, {
      method: 'POST',
      body,
      signal: input.signal,
    });
    if (!response.ok) {
      throw new GearXError('TRANSCRIPTION_FAILED', `Local Whisper returned ${response.status}.`);
    }
    const payload = (await response.json()) as {
      text?: string;
      confidence?: number;
      segments?: TranscriptionResult['segments'];
    };
    if (!payload.text) throw new GearXError('TRANSCRIPTION_FAILED', 'Local Whisper returned no text.');
    return {
      text: payload.text,
      confidence: payload.confidence ?? null,
      segments: payload.segments?.length ? payload.segments : [{
        text: payload.text,
        startMs: 0,
        endMs: 0,
        confidence: payload.confidence ?? null,
        speakerLabel: null,
      }],
    };
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
    if (!canUseProvider(this.remote, this.config.hasRemoteConsent())) return false;
    try {
      const response = await fetch(`${this.config.baseUrl}/health`, { method: 'GET' });
      return response.ok;
    } catch {
      return false;
    }
  }

  async transcribe(input: TranscriptionInput): Promise<TranscriptionResult> {
    if (!canUseProvider(this.remote, this.config.hasRemoteConsent())) {
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
