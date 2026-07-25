import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import VaultScreen from '../app/(tabs)/vault';
import { knowledgeRepository } from '../src/repositories/knowledgeRepository';

jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
  useFocusEffect: (callback: () => void) => require('react').useEffect(callback, [callback]),
}));

jest.mock('../src/repositories/knowledgeRepository', () => ({
  knowledgeRepository: {
    insights: jest.fn(),
    bulkUpdateInsights: jest.fn(),
    bulkRemoveInsights: jest.fn(),
  },
}));

const decision = {
  id: 'insight_1',
  sessionId: 'session_1',
  content: 'Ship the brass navigation',
  type: 'decision' as const,
  confidence: 0.92,
  sourceSegmentIds: ['segment_1'],
  pinned: false,
  archived: false,
  unresolved: false,
  createdAt: 1_700_000_000_000,
  updatedAt: 1_700_000_000_000,
};

describe('<VaultScreen />', () => {
  test('renders evidence, filters, and bulk selection state', async () => {
    jest.mocked(knowledgeRepository.insights).mockResolvedValue([decision]);
    render(<VaultScreen />);

    expect(await screen.findByText('Ship the brass navigation')).toBeTruthy();
    fireEvent.press(screen.getAllByRole('button', { name: 'decision' })[0]);
    await waitFor(() => expect(knowledgeRepository.insights).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'decision' }),
    ));
    fireEvent(screen.getByLabelText('Select or open Ship the brass navigation'), 'longPress');
    expect(await screen.findByText('1 selected')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Archive selected' }).props.disabled).not.toBe(true);
  });

  test('shows a repository failure without crashing', async () => {
    jest.mocked(knowledgeRepository.insights).mockRejectedValue(new Error('offline'));
    render(<VaultScreen />);
    expect(await screen.findByText('The vault could not be loaded.')).toBeTruthy();
  });
});
