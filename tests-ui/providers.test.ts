import {
  BackendTranscriptionProvider,
  DeviceTranscriptionAdapter,
  MockTranscriptionProvider,
} from '../src/infrastructure/transcription/providers';

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
