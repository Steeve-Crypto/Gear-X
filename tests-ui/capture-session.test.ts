import { MockTranscriptionProvider } from '../src/infrastructure/transcription/providers';
import { sessionRepository } from '../src/repositories/sessionRepository';
import {
  setCaptureSessionStatus,
  startCaptureSession,
  stopAndProcessSession,
} from '../src/services/captureSession';

jest.mock('../src/services/audio', () => ({
  startListening: jest.fn().mockResolvedValue(true),
  stopListening: jest.fn().mockResolvedValue('file://recording.m4a'),
  deleteRecording: jest.fn().mockResolvedValue(true),
}));
jest.mock('../src/repositories/sessionRepository', () => ({
  sessionRepository: {
    create: jest.fn().mockResolvedValue(undefined),
    remove: jest.fn().mockResolvedValue(undefined),
    update: jest.fn().mockResolvedValue(undefined),
    replaceSegments: jest.fn().mockResolvedValue(undefined),
  },
}));
jest.mock('../src/repositories/runRepository', () => ({
  runRepository: {
    startProvider: jest.fn().mockResolvedValue(undefined),
    finishProvider: jest.fn().mockResolvedValue(undefined),
    recordAgentEvent: jest.fn().mockResolvedValue(undefined),
  },
}));
jest.mock('../src/agents/router', () => ({
  routerAgent: { run: jest.fn().mockResolvedValue({ data: { activeAgents: [] } }) },
}));
jest.mock('../src/agents/registry', () => ({ agentRegistry: new Map() }));

const transcription = {
  text: 'Synthetic test transcript.',
  confidence: 0.95,
  segments: [{
    text: 'Synthetic test transcript.',
    startMs: 0,
    endMs: 1200,
    confidence: 0.95,
    speakerLabel: null,
  }],
};

describe('capture session pipeline', () => {
  test('persists pause and resume state transitions', async () => {
    const session = await startCaptureSession({
      transcriptionProvider: 'mock-test',
      inferenceProvider: 'mock',
      processingMode: 'local',
    });
    const paused = await setCaptureSessionStatus(session, 'paused');
    const resumed = await setCaptureSessionStatus(paused, 'recording');

    expect(paused.status).toBe('paused');
    expect(resumed.status).toBe('recording');
    expect(sessionRepository.update).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ id: session.id, status: 'paused' }),
    );
    expect(sessionRepository.update).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ id: session.id, status: 'recording' }),
    );
  });

  test('persists recording metadata, transcript, completion, and cleanup', async () => {
    const session = await startCaptureSession({
      transcriptionProvider: 'mock-test',
      inferenceProvider: 'mock',
      processingMode: 'local',
    });
    const result = await stopAndProcessSession({
      session,
      provider: new MockTranscriptionProvider(transcription),
      retainRecording: false,
      currentInsights: [],
    });

    expect(sessionRepository.create).toHaveBeenCalled();
    expect(sessionRepository.replaceSegments).toHaveBeenCalledWith(
      session.id,
      [expect.objectContaining({ text: transcription.text, sessionId: session.id })],
    );
    expect(result.session.status).toBe('complete');
    expect(result.session.audioUri).toBeNull();
    expect(result.recordingCleanupFailed).toBe(false);
  });

  test('keeps a failed session recoverable when provider is unavailable', async () => {
    const session = await startCaptureSession({
      transcriptionProvider: 'device-adapter',
      inferenceProvider: 'mock',
      processingMode: 'local',
    });
    const provider = {
      id: 'unavailable',
      name: 'Unavailable',
      remote: false,
      isAvailable: async () => false,
      transcribe: jest.fn(),
    };
    await expect(stopAndProcessSession({
      session,
      provider,
      retainRecording: false,
      currentInsights: [],
    })).rejects.toMatchObject({ code: 'PROVIDER_UNAVAILABLE' });
    expect(sessionRepository.update).toHaveBeenLastCalledWith(expect.objectContaining({
      status: 'failed',
      audioUri: 'file://recording.m4a',
    }));
  });
});
