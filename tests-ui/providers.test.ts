import {
  BackendTranscriptionProvider,
  DeviceTranscriptionAdapter,
  MockTranscriptionProvider,
} from '../src/infrastructure/transcription/providers';
import { extractorAgent } from '../src/agents/extractor';
import { MockInferenceProvider } from '../src/infrastructure/inference/mock';
import { createInferenceProvider } from '../src/services/providerFactory';
import { defaultSettings } from '../src/state/settingsStore';
import { CapabilityInferenceRouter } from '../src/infrastructure/inference/capabilityRouter';
import { TranscriptionRouter } from '../src/infrastructure/transcription/router';
import { InferenceProvider } from '../src/infrastructure/inference/types';
import { SpeechModule } from '../src/infrastructure/transcription/providers';
import { normalizeProcessingMode } from '../src/repositories/settingsRepository';

const fixture = {
  text: 'A deterministic transcript.',
  confidence: 0.9,
  segments: [{
    text: 'A deterministic transcript.',
    startMs: 0,
    endMs: 1000,
    confidence: 0.9,
    speakerLabel: null,
  }],
};

describe('transcription provider boundaries', () => {
  test('device boundary is honest and the test provider is deterministic', async () => {
    const device = new DeviceTranscriptionAdapter(true, null);
    expect(await device.isAvailable()).toBe(false);
    await expect(device.transcribe({ sessionId: 's', audioUri: 'file://a' }))
      .rejects.toMatchObject({ code: 'PROVIDER_UNAVAILABLE' });

    const mock = new MockTranscriptionProvider(fixture);
    await expect(mock.transcribe({ sessionId: 's', audioUri: 'file://a' }))
      .resolves.toEqual(fixture);
  });

  test('native speech converts a final recorded-file event', async () => {
    const listeners = new Map<string, (event: unknown) => void>();
    const speech = {
      abort: jest.fn(),
      addListener: jest.fn((event: string, listener: (value: unknown) => void) => {
        listeners.set(event, listener);
        return { remove: jest.fn() };
      }),
      isRecognitionAvailable: () => true,
      requestPermissionsAsync: async () => ({ granted: true }),
      start: jest.fn(() => listeners.get('result')?.({
        isFinal: true,
        results: [{
          transcript: 'A real device transcript.',
          confidence: 0.91,
          segments: [{ segment: 'A real device transcript.', startTimeMillis: 0, endTimeMillis: 900, confidence: 0.91 }],
        }],
      })),
      supportsOnDeviceRecognition: () => true,
      supportsRecording: () => true,
    } as unknown as SpeechModule;
    const device = new DeviceTranscriptionAdapter(true, speech, 1_000);
    await expect(device.transcribe({ sessionId: 's', audioUri: 'file://recording.m4a' }))
      .resolves.toMatchObject({ text: 'A real device transcript.', confidence: 0.91 });
    expect(speech.start).toHaveBeenCalledWith(expect.objectContaining({
      requiresOnDeviceRecognition: true,
      audioSource: { uri: 'file://recording.m4a' },
    }));
  });

  test('transcription router falls back after an unavailable provider', async () => {
    const unavailable = { id: 'no', name: 'no', remote: false, isAvailable: async () => false, transcribe: jest.fn() };
    const fallback = new MockTranscriptionProvider(fixture);
    const router = new TranscriptionRouter([unavailable, fallback]);
    await expect(router.transcribe({ sessionId: 's', audioUri: 'file://a' })).resolves.toEqual(fixture);
    expect(unavailable.transcribe).not.toHaveBeenCalled();
  });

  test('transcription router times out and uses the next provider', async () => {
    const slow = {
      id: 'slow', name: 'slow', remote: false,
      isAvailable: async () => true,
      transcribe: ({ signal }: { signal?: AbortSignal }) => new Promise<never>((_resolve, reject) => {
        signal?.addEventListener('abort', () => reject(new Error('aborted')), { once: true });
      }),
    };
    const router = new TranscriptionRouter([slow, new MockTranscriptionProvider(fixture)], undefined, 5);
    await expect(router.transcribe({ sessionId: 's', audioUri: 'file://a' })).resolves.toEqual(fixture);
  });

  test('mock provider honors cancellation', async () => {
    const controller = new AbortController();
    controller.abort();
    const provider = new MockTranscriptionProvider(fixture);
    await expect(provider.transcribe({
      sessionId: 's',
      audioUri: 'file://a',
      signal: controller.signal,
    })).rejects.toMatchObject({ code: 'TRANSCRIPTION_FAILED' });
  });

  test('remote backend blocks missing consent and rejects invalid output', async () => {
    const denied = new BackendTranscriptionProvider({
      baseUrl: 'https://example.invalid',
      getAccessToken: async () => 'short-lived',
      hasRemoteConsent: () => false,
    });
    await expect(denied.transcribe({ sessionId: 's', audioUri: 'file://a' }))
      .rejects.toMatchObject({ code: 'REMOTE_CONSENT_MISSING' });

    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ unexpected: true }),
    } as Response);
    const invalid = new BackendTranscriptionProvider({
      baseUrl: 'https://example.invalid',
      getAccessToken: async () => 'short-lived',
      hasRemoteConsent: () => true,
    });
    await expect(invalid.transcribe({ sessionId: 's', audioUri: 'file://a' }))
      .rejects.toMatchObject({ code: 'TRANSCRIPTION_FAILED' });
  });

  test('remote backend uploads the actual audio as multipart data', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => fixture,
    } as Response);
    const provider = new BackendTranscriptionProvider({
      baseUrl: 'https://gearx.invalid',
      getAccessToken: async () => 'short-lived',
      hasRemoteConsent: () => true,
    });
    await provider.transcribe({ sessionId: 's', audioUri: 'file://recording.m4a', durationMs: 2_500 });
    const request = fetchSpy.mock.calls[0][1] as RequestInit;
    expect(request.body).toBeInstanceOf(FormData);
    expect((request.body as FormData).get('duration_ms')).toBe('2500');
    expect(request.headers).toMatchObject({ 'X-Gear-X-Remote-Consent': 'granted' });
    expect(request.headers).not.toMatchObject({ 'Content-Type': 'application/json' });
  });
});

describe('inference provider selection', () => {
  test('injects configured provider output into an agent', async () => {
    const result = await extractorAgent.run({
      recentTranscript: 'We decided to ship the release on Friday.',
      currentInsights: [],
      isListening: false,
      inferenceProvider: new MockInferenceProvider(JSON.stringify([{
        type: 'decision',
        content: 'Ship the release on Friday.',
        confidence: 0.94,
      }])),
    });

    expect(result.data?.source).toBe('llm');
    expect(result.data?.insights?.[0]).toMatchObject({
      type: 'decision',
      content: 'Ship the release on Friday.',
    });
  });

  test('normal defaults do not probe Ollama and developer mode retains it', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch');
    const normal = createInferenceProvider(defaultSettings);
    expect(normal).toMatchObject({ id: 'capability-router', remote: false });
    await expect(normal.isAvailable()).resolves.toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();

    fetchSpy.mockResolvedValueOnce({ ok: true, json: async () => ({ models: [{ name: 'gear-model' }] }) } as Response);
    const developer = createInferenceProvider({
      ...defaultSettings,
      processingMode: 'developer',
      ollamaEndpoint: 'http://192.0.2.1:11434',
      ollamaModel: 'gear-model',
    });
    await expect(developer.isAvailable()).resolves.toBe(true);
    expect(fetchSpy).toHaveBeenCalledWith('http://192.0.2.1:11434/api/tags', expect.anything());
  });

  test('capability router skips unsupported providers and falls back', async () => {
    const unsupported: InferenceProvider = {
      id: 'unsupported', name: 'unsupported', remote: false,
      metadata: { capabilities: ['summarization'], costClass: 'free', configured: true },
      isAvailable: async () => true,
      generate: jest.fn(async () => 'wrong'),
    };
    const fallback: InferenceProvider = {
      id: 'fallback', name: 'fallback', remote: false,
      metadata: { capabilities: ['answer-synthesis'], costClass: 'free', configured: true },
      isAvailable: async () => true,
      generate: jest.fn(async () => 'evidence-backed answer'),
    };
    const router = new CapabilityInferenceRouter([unsupported, fallback]);
    await expect(router.generate({
      system: 's', prompt: 'p', capability: 'answer-synthesis',
    })).resolves.toBe('evidence-backed answer');
    expect(unsupported.generate).not.toHaveBeenCalled();
  });

  test('daily budget blocks remote calls and preserves local fallback', async () => {
    const remote: InferenceProvider = {
      id: 'remote', name: 'remote', remote: true,
      isAvailable: async () => true,
      generate: jest.fn(async () => 'remote answer'),
    };
    const local: InferenceProvider = {
      id: 'rules-refiner', name: 'local', remote: false,
      isAvailable: async () => true,
      generate: jest.fn(async () => 'local answer'),
    };
    const router = new CapabilityInferenceRouter([remote, local], 1_000, {
      reserve: async () => false,
    });
    await expect(router.generate({ system: 's', prompt: 'p' })).resolves.toBe('local answer');
    expect(remote.generate).not.toHaveBeenCalled();
  });

  test('migrates legacy modes to safe named modes', () => {
    expect(normalizeProcessingMode('local')).toBe('private');
    expect(normalizeProcessingMode('remote')).toBe('quality');
    expect(normalizeProcessingMode('balanced')).toBe('balanced');
    expect(normalizeProcessingMode('unknown')).toBeUndefined();
  });
});
