import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import SubscriptionScreen from '../src/features/settings/SubscriptionScreen';
import { useEntitlementStore } from '../src/state/entitlementStore';
import { billingService } from '../src/services/billing';

jest.mock('../src/services/billing', () => ({
  billingService: {
    fetchEntitlement: jest.fn(),
    restore: jest.fn(),
    upgrade: jest.fn(),
    manage: jest.fn(),
  },
}));

const paidSnapshot = {
  planId: 'cloud-plus',
  displayName: 'Cloud Plus',
  status: 'active' as const,
  capabilities: ['cloud_transcription' as const, 'cloud_summarization' as const],
  expiresAt: '2026-09-20T00:00:00.000Z',
  cancelAtPeriodEnd: false,
  allowances: { transcriptionDailyMsRemaining: 5_400_000, intelligenceMonthlyTokensRemaining: 10_000 },
};

describe('<SubscriptionScreen />', () => {
  beforeEach(() => {
    useEntitlementStore.setState({
      snapshot: paidSnapshot,
      loading: false,
      message: '',
      fallbackMessage: '',
    });
    jest.mocked(billingService.fetchEntitlement).mockResolvedValue(paidSnapshot);
  });

  test('shows understandable plan and allowance information', async () => {
    render(<SubscriptionScreen />);
    expect(screen.getByText('Cloud Plus')).toBeTruthy();
    expect(screen.getByText('1h 30m remaining')).toBeTruthy();
    expect(screen.getByText('Available within your monthly plan allowance')).toBeTruthy();
    await waitFor(() => expect(billingService.fetchEntitlement).toHaveBeenCalled());
  });

  test('restore refreshes the server-verified snapshot', async () => {
    jest.mocked(billingService.restore).mockResolvedValue({
      ...paidSnapshot,
      displayName: 'Restored Plan',
    });
    render(<SubscriptionScreen />);
    await waitFor(() => expect(billingService.fetchEntitlement).toHaveBeenCalled());
    fireEvent.press(screen.getByRole('button', { name: 'Restore purchases' }));
    expect(await screen.findByText('Restored Plan')).toBeTruthy();
    expect(screen.getByText('Purchases restored and cloud access refreshed.')).toBeTruthy();
  });
});
