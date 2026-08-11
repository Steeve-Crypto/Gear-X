import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import LoopDetailScreen from '../src/features/loops/LoopDetailScreen';
import { knowledgeRepository } from '../src/repositories/knowledgeRepository';

jest.mock('expo-router', () => ({
  Link: ({ children }: { children: React.ReactNode }) => children,
  useLocalSearchParams: () => ({ id: 'loop_1' }),
}));
jest.mock('../src/repositories/knowledgeRepository', () => ({
  knowledgeRepository: {
    loop: jest.fn(),
    updateLoop: jest.fn(),
    resolveLoop: jest.fn(),
  },
}));

const openLoop = {
  id: 'loop_1',
  sessionId: 'session_1',
  insightId: 'insight_1',
  category: 'follow_up' as const,
  question: 'Who owns the launch?',
  status: 'open' as const,
  priority: 'high' as const,
  dueAt: null,
  resolution: null,
  reminderReady: false,
  createdAt: 1_700_000_000_000,
  resolvedAt: null,
};

describe('<LoopDetailScreen />', () => {
  test('persists a user resolution note and closes the loop', async () => {
    jest.mocked(knowledgeRepository.loop).mockResolvedValue(openLoop);
    jest.mocked(knowledgeRepository.resolveLoop).mockResolvedValue(undefined);
    render(<LoopDetailScreen />);

    expect(await screen.findByDisplayValue('Who owns the launch?')).toBeTruthy();
    fireEvent.changeText(screen.getByPlaceholderText('Resolution or dismissal note'), 'Alex owns launch.');
    fireEvent.press(screen.getByRole('button', { name: 'Resolve' }));

    await waitFor(() => expect(knowledgeRepository.resolveLoop).toHaveBeenCalledWith(
      'loop_1',
      'Alex owns launch.',
      'resolved',
    ));
    expect(screen.getByText('Status: resolved')).toBeTruthy();
    expect(screen.getByText('Alex owns launch.')).toBeTruthy();
  });

  test('renders a missing-loop state without crashing', async () => {
    jest.mocked(knowledgeRepository.loop).mockResolvedValue(null);
    render(<LoopDetailScreen />);
    expect(await screen.findByText('Loop unavailable')).toBeTruthy();
  });
});
