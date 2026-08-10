import { render, screen } from '@testing-library/react-native';
import SessionDetailScreen from '../src/features/sessions/SessionDetailScreen';
import { sessionRepository } from '../src/repositories/sessionRepository';

jest.setTimeout(15_000);

jest.mock('expo-router', () => ({
  Link: ({ children }: { children: React.ReactNode }) => children,
  router: { back: jest.fn() },
  useLocalSearchParams: () => ({ id: 'session_1' }),
}));
jest.mock('../src/repositories/sessionRepository', () => ({
  sessionRepository: {
    details: jest.fn(),
    export: jest.fn(),
    remove: jest.fn(),
  },
}));
jest.mock('../src/services/captureSession', () => ({ retryCapturedSession: jest.fn() }));
jest.mock('../src/services/providerFactory', () => ({
  createInferenceProvider: jest.fn(),
  createTranscriptionProvider: jest.fn(),
}));
jest.mock('../src/state/settingsStore', () => ({
  useSettingsStore: () => ({
    retainRecordings: false,
    autoSummarize: true,
    autoQuestion: true,
  }),
}));

const session = {
  id: 'session_1', startedAt: 1_700_000_000_000, endedAt: 1_700_000_001_000,
  durationMs: 1000, status: 'complete' as const, audioUri: null,
  transcriptionProvider: 'native-speech', inferenceProvider: 'capability-router',
  processingMode: 'balanced' as const, createdAt: 1_700_000_000_000,
  updatedAt: 1_700_000_001_000,
};

describe('<SessionDetailScreen />', () => {
  test('renders transcript and every derived record group', async () => {
    jest.mocked(sessionRepository.details).mockResolvedValue({
      session,
      segments: [{ id: 'seg', sessionId: session.id, text: 'Synthetic transcript', startMs: 0, endMs: 900, speakerLabel: null, confidence: 0.9, createdAt: 1 }],
      insights: [{ id: 'insight', type: 'decision', content: 'Ship Friday' }],
      summaries: [{ id: 'summary', title: 'Release', body: 'Ship Friday safely.' }],
      questions: [{ id: 'question', status: 'open', question: 'Who owns release?' }],
      threads: [{ id: 'thread', title: 'Release planning' }],
      agentRuns: [{ id: 'agent-run', agent_id: 'extractor', status: 'completed', duration_ms: 20 }],
      providerRuns: [{ id: 'provider-run', provider_id: 'native-speech', operation: 'transcription', status: 'completed', duration_ms: 40 }],
    });
    render(<SessionDetailScreen />);
    expect(await screen.findByText('TRANSCRIPT')).toBeTruthy();
    expect(screen.getByText('INSIGHTS')).toBeTruthy();
    expect(screen.getByText('Release planning')).toBeTruthy();
    expect(screen.getByText('PROVIDER RUNS')).toBeTruthy();
  });

  test('shows repository load failure', async () => {
    jest.mocked(sessionRepository.details).mockRejectedValue(new Error('database unavailable'));
    render(<SessionDetailScreen />);
    expect(await screen.findByText('The session details could not be loaded.')).toBeTruthy();
  });
});
