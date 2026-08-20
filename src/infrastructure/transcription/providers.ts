import { GearXError } from '../../domain/errors';
import { TranscriptionInput, TranscriptionProvider, TranscriptionResult } from './types';
import { canUseProvider } from '../../domain/privacy';
import type {
  ExpoSpeechRecognitionErrorEvent,
  ExpoSpeechRecognitionResultEvent,
} from 'expo-speech-recognition';

type BackendErrorCode =
  | 'UNAUTHORIZED' | 'CONSENT_REQUIRED' | 'QUOTA_EXCEEDED' | 'INVALID_REQUEST'
  | 'PAYLOAD_TOO_LARGE' | 'PROVIDER_UNAVAILABLE' | 'PROVIDER_TIMEOUT'
  | 'MALFORMED_PROVIDER_OUTPUT' | 'INTERNAL_ERROR';

async function backendFailure(response: Response): Promise<GearXError> {
  try {
    const payload = await response.json() as { error?: { code?: BackendErrorCode; message?: string } };
    if (payload.error?.code) {
      return new GearXError(payload.error.code, payload.error.message || 'Cloud transcription failed.');
    }
  } catch { /* Return a redacted fallback below. */ }
  return new GearXError('TRANSCRIPTION_FAILED', `Transcription failed (${response.status}).`);
}

export interface SpeechModule {
  abort(): void;
  addListener(
    event: 'result' | 'error' | 'end',
    listener: (event: ExpoSpeechRecognitionResultEvent | ExpoSpeechRecognitionErrorEvent | null) => void,
  ): { remove(): void };
  isRecognitionAvailable(): boolean;
  requestPermissionsAsync(): Promise<{ granted: boolean }>;
  start(options: Record<string, unknown>): void;
  supportsOnDeviceRecognition(): boolean;
  supportsRecording(): boolean;
}

function loadSpeechModule(): SpeechModule | null {
  try {
    // Lazy loading keeps Expo Go/web usable when the custom native module is absent.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-speech-recognition').ExpoSpeechRecognitionModule as SpeechModule;
  } catch {
    return null;
  }
}

export class DeviceTranscriptionAdapter implements TranscriptionProvider {
  id = 'native-speech';
  name = 'Device speech recognition';
  remote = false;

  constructor(
    private readonly requireOnDevice = true,
    private readonly module: SpeechModule | null = loadSpeechModule(),
    private readonly timeoutMs = 120_000,
  ) {}

  async isAvailable(): Promise<boolean> {
    if (!this.module) return false;
    try {
      return this.module.isRecognitionAvailable()
        && this.module.supportsRecording()
        && (!this.requireOnDevice || this.module.supportsOnDeviceRecognition());
    } catch {
      return false;
    }
  }

  async transcribe(input: TranscriptionInput): Promise<TranscriptionResult> {
    if (!this.module || !(await this.isAvailable())) {
      throw new GearXError('PROVIDER_UNAVAILABLE', 'Device speech recognition is unavailable.');
    }
    if (input.signal?.aborted) throw new GearXError('TRANSCRIPTION_FAILED', 'Cancelled');
    const permission = await this.module.requestPermissionsAsync();
    if (!permission.granted) {
      throw new GearXError('MIC_PERMISSION_DENIED', 'Speech recognition permission was denied.');
    }

    const speech = this.module;
    return new Promise<TranscriptionResult>((resolve, reject) => {
      let settled = false;
      let latest: ExpoSpeechRecognitionResultEvent | null = null;
      const finish = (result?: TranscriptionResult, error?: GearXError) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        input.signal?.removeEventListener('abort', cancel);
        resultSubscription.remove();
        errorSubscription.remove();
        endSubscription.remove();
        if (error) reject(error);
        else if (result) resolve(result);
        else reject(new GearXError('TRANSCRIPTION_FAILED', 'Device speech returned no text.'));
      };
      const toResult = (event: ExpoSpeechRecognitionResultEvent): TranscriptionResult | undefined => {
        const best = event.results[0];
        if (!best?.transcript.trim()) return undefined;
        return {
          text: best.transcript.trim(),
          confidence: best.confidence >= 0 ? best.confidence : null,
          segments: best.segments?.length ? best.segments.map((segment) => ({
            text: segment.segment,
            startMs: segment.startTimeMillis,
            endMs: segment.endTimeMillis,
            confidence: segment.confidence >= 0 ? segment.confidence : null,
            speakerLabel: null,
          })) : [{
            text: best.transcript.trim(),
            startMs: 0,
            endMs: 0,
            confidence: best.confidence >= 0 ? best.confidence : null,
            speakerLabel: null,
          }],
        };
      };
      const resultSubscription = speech.addListener('result', (rawEvent) => {
        const event = rawEvent as ExpoSpeechRecognitionResultEvent;
        latest = event;
        if (event.isFinal) finish(toResult(event));
      });
      const errorSubscription = speech.addListener('error', (rawEvent) => {
        const event = rawEvent as ExpoSpeechRecognitionErrorEvent;
        finish(undefined, new GearXError(
          event.error === 'not-allowed' ? 'MIC_PERMISSION_DENIED' : 'TRANSCRIPTION_FAILED',
          `Device speech failed: ${event.error}.`,
        ));
      });
      const endSubscription = speech.addListener('end', () => finish(latest ? toResult(latest) : undefined));
      const cancel = () => {
        speech.abort();
        finish(undefined, new GearXError('TRANSCRIPTION_FAILED', 'Cancelled'));
      };
      const timeout = setTimeout(() => {
        speech.abort();
        finish(undefined, new GearXError('TIMEOUT', 'Device transcription timed out.'));
      }, this.timeoutMs);
      input.signal?.addEventListener('abort', cancel, { once: true });
      speech.start({
        lang: input.locale ?? 'en-US',
        continuous: true,
        interimResults: false,
        maxAlternatives: 1,
        addsPunctuation: true,
        requiresOnDeviceRecognition: this.requireOnDevice,
        audioSource: { uri: input.audioUri },
      });
    });
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
  onCloudUnavailable?: (code: string) => void;
}

export class BackendTranscriptionProvider implements TranscriptionProvider {
  id = 'secure-backend';
  name = 'Configured remote transcription';
  remote = true;

  constructor(private readonly config: BackendTranscriptionConfig) {}

  async isAvailable(): Promise<boolean> {
    if (!canUseProvider(this.remote, this.config.hasRemoteConsent())) return false;
    try {
      const token = await this.config.getAccessToken();
      const response = await fetch(`${this.config.baseUrl}/health`, {
        method: 'GET', headers: { Authorization: `Bearer ${token}` },
      });
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
    const body = new FormData();
    body.append('session_id', input.sessionId);
    body.append('duration_ms', String(input.durationMs ?? 1));
    body.append('file', {
      uri: input.audioUri,
      name: `${input.sessionId}.m4a`,
      type: 'audio/m4a',
    } as unknown as Blob);
    const response = await fetch(`${this.config.baseUrl}/v1/transcriptions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Gear-X-Remote-Consent': 'granted',
      },
      body,
      signal: input.signal,
    });
    if (!response.ok) {
      const error = await backendFailure(response);
      this.config.onCloudUnavailable?.(error.code);
      throw error;
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
