import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import SubscriptionScreen from '../src/features/settings/SubscriptionScreen';
import { useEntitlementStore } from '../src/state/entitlementStore';
import { billingService } from '../src/services/billing';

jest.mock('../src/services/billing', () => ({
  billingService: {
    fetchEntitlement: jest.fn(),
    restore: jest.fn(),
    purchase: jest.fn(),
    manage: jest.fn(),
  },
}));

const paidSnapshot = {
  planId: 'pro' as const,
  displayName: 'GearX Pro',
  status: 'active' as const,
  capabilities: ['cloud_transcription' as const, 'cloud_summarization' as const],
  expiresAt: '2026-09-20T00:00:00.000Z',
  cancelAtPeriodEnd: false,
  pendingPlanId: null,
  pendingEffectiveAt: null,
  periodStartedAt: '2026-08-20T00:00:00.000Z',
  resetsAt: '2026-09-20T00:00:00.000Z',
  allowances: { transcriptionMonthlyMsRemaining: 24_120_000, intelligencePercentRemaining: 72 },
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
    expect(screen.getByText('GearX Pro · Current plan')).toBeTruthy();
    expect(screen.getByText('6h 42m of 10 hours remaining')).toBeTruthy();
    expect(screen.getByText('72% remaining')).toBeTruthy();
    expect(screen.getByText('GearX Free')).toBeTruthy();
    expect(screen.getByText('GearX Max')).toBeTruthy();
    await waitFor(() => expect(billingService.fetchEntitlement).toHaveBeenCalled());
  });

  test('restore refreshes the server-verified snapshot', async () => {
    jest.mocked(billingService.restore).mockResolvedValue({
      ...paidSnapshot,
      planId: 'max',
      displayName: 'GearX Max',
    });
    render(<SubscriptionScreen />);
    await waitFor(() => expect(billingService.fetchEntitlement).toHaveBeenCalled());
    fireEvent.press(screen.getByRole('button', { name: 'Restore purchases' }));
    expect(await screen.findByText('GearX Max · Current plan')).toBeTruthy();
    expect(screen.getByText('Purchases restored and cloud access refreshed.')).toBeTruthy();
  });

  test('purchases Max through the billing provider and refreshes authority', async () => {
    jest.mocked(billingService.purchase).mockResolvedValue({
      ...paidSnapshot,
      planId: 'max',
      displayName: 'GearX Max',
    });
    render(<SubscriptionScreen />);
    await waitFor(() => expect(billingService.fetchEntitlement).toHaveBeenCalled());
    fireEvent.press(screen.getByRole('button', { name: 'Choose GearX Max' }));
    await waitFor(() => expect(billingService.purchase).toHaveBeenCalledWith('max'));
    expect(await screen.findByText('Purchase verified and cloud access refreshed.')).toBeTruthy();
  });
});
