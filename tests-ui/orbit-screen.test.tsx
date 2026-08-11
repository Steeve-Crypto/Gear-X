import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import OrbitScreen from '../src/features/orbit/OrbitScreen';
import { startCaptureSession, stopAndProcessSession } from '../src/services/captureSession';

const mockSetCurrent = jest.fn();
const mockSetActiveAgents = jest.fn();
const mockSetLastError = jest.fn();
const mockSessionState = {
  current: null as null | Record<string, unknown>,
  setCurrent: mockSetCurrent,
  activeAgents: [] as string[],
  setActiveAgents: mockSetActiveAgents,
  lastError: null as string | null,
  setLastError: mockSetLastError,
};

jest.mock('expo-router', () => ({
  Link: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock('../src/components/GearClock', () => ({ GearClock: () => null }));
jest.mock('../src/state/settingsStore', () => ({
  useSettingsStore: () => ({
    transcriptionProvider: 'automatic',
    processingMode: 'balanced',
    retainRecordings: false,
    autoSummarize: true,
    autoQuestion: true,
    reducedMotion: false,
    lowPerformanceMode: false,
    remoteProcessingConsent: false,
    cloudTranscriptionEnabled: true,
    cloudIntelligenceEnabled: true,
    dailyCloudRequestLimit: 25,
    ollamaEndpoint: 'http://localhost:11434',
    ollamaModel: 'test',
    transcriptionEndpoint: 'http://localhost:8080',
    voiceProvider: 'none',
    dataRetentionDays: 0,
    onboardingComplete: true,
  }),
}));
jest.mock('../src/state/sessionStore', () => ({
  useSessionStore: (selector: (state: typeof mockSessionState) => unknown) => selector(mockSessionState),
}));
jest.mock('../src/services/database', () => ({ getInsightCount: jest.fn().mockResolvedValue(3) }));
jest.mock('../src/services/audio', () => ({
  pauseListening: jest.fn(),
  resumeListening: jest.fn(),
}));
jest.mock('../src/services/captureSession', () => ({
  setCaptureSessionStatus: jest.fn(),
  startCaptureSession: jest.fn(),
  stopAndProcessSession: jest.fn(),
}));
jest.mock('../src/services/providerFactory', () => ({
  createInferenceProvider: () => ({ id: 'capability-router' }),
  createTranscriptionProvider: () => ({ id: 'transcription-router' }),
}));
jest.mock('../src/repositories/sessionRepository', () => ({
  sessionRepository: { get: jest.fn() },
}));

const session = {
  id: 'session_1',
  startedAt: 1_700_000_000_000,
  endedAt: null,
  durationMs: 0,
  status: 'recording' as const,
  audioUri: null,
  transcriptionProvider: 'automatic',
  inferenceProvider: 'capability-router',
  processingMode: 'balanced' as const,
  createdAt: 1_700_000_000_000,
  updatedAt: 1_700_000_000_000,
};

describe('<OrbitScreen />', () => {
  beforeEach(() => {
    mockSessionState.current = null;
    mockSessionState.activeAgents = [];
    mockSessionState.lastError = null;
  });

  test('starts a real capture session and activates Listener', async () => {
    jest.mocked(startCaptureSession).mockResolvedValue(session);
    render(<OrbitScreen />);

    fireEvent.press(screen.getByRole('button', { name: 'Start listening' }));

    await waitFor(() => expect(startCaptureSession).toHaveBeenCalledWith({
      transcriptionProvider: 'automatic',
      inferenceProvider: 'capability-router',
      processingMode: 'balanced',
    }));
    expect(mockSetCurrent).toHaveBeenCalledWith(session);
    expect(mockSetActiveAgents).toHaveBeenCalledWith(['listener']);
  });

  test('stops through the processing pipeline and publishes completion', async () => {
    mockSessionState.current = session;
    const completed = { ...session, status: 'complete' as const, endedAt: 1_700_000_001_000 };
    jest.mocked(stopAndProcessSession).mockResolvedValue({
      session: completed,
      transcript: 'Synthetic transcript.',
      newInsights: [],
      recordingCleanupFailed: false,
    });
    render(<OrbitScreen />);

    fireEvent.press(screen.getByRole('button', { name: 'Stop session' }));

    await waitFor(() => expect(stopAndProcessSession).toHaveBeenCalled());
    expect(mockSetCurrent).toHaveBeenNthCalledWith(1, expect.objectContaining({ status: 'processing' }));
    expect(mockSetCurrent).toHaveBeenLastCalledWith(completed);
    expect(mockSetActiveAgents).toHaveBeenLastCalledWith([]);
  });
});
