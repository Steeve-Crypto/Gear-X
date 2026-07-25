import {
  BackendTranscriptionProvider,
  DeviceTranscriptionAdapter,
  MockTranscriptionProvider,
} from '../src/infrastructure/transcription/providers';
import { extractorAgent } from '../src/agents/extractor';
import { MockInferenceProvider } from '../src/infrastructure/inference/mock';
import { createInferenceProvider } from '../src/services/providerFactory';
import { defaultSettings } from '../src/state/settingsStore';

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
    const device = new DeviceTranscriptionAdapter();
    expect(await device.isAvailable()).toBe(false);
    await expect(device.transcribe({ sessionId: 's', audioUri: 'file://a' }))
      .rejects.toMatchObject({ code: 'PROVIDER_UNAVAILABLE' });

    const mock = new MockTranscriptionProvider(fixture);
    await expect(mock.transcribe({ sessionId: 's', audioUri: 'file://a' }))
      .resolves.toEqual(fixture);
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

  test('uses configured Ollama settings and keeps remote unconfigured', async () => {
    const local = createInferenceProvider({
      ...defaultSettings,
      ollamaEndpoint: 'http://192.0.2.1:11434',
      ollamaModel: 'gear-model',
    });
    expect(local).toMatchObject({ id: 'ollama', remote: false });

    const remote = createInferenceProvider({
      ...defaultSettings,
      processingMode: 'remote',
      remoteProcessingConsent: true,
    });
    expect(remote).toMatchObject({ id: 'remote-unconfigured', remote: true });
    await expect(remote.generate({ system: 's', prompt: 'p' }))
      .rejects.toMatchObject({ code: 'PROVIDER_UNAVAILABLE' });
  });
});
