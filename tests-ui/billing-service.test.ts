jest.mock('../src/services/providerFactory', () => ({
  configuredBackendUrl: jest.fn(),
  getConfiguredBackendIdentity: jest.fn(),
}));
jest.mock('react-native-purchases', () => ({ __esModule: true, default: {} }));
jest.mock('react-native-purchases-ui', () => ({ __esModule: true, default: {} }));

import { BillingService } from '../src/services/billing';
import { BillingProvider } from '../src/infrastructure/billing/types';
import { configuredBackendUrl, getConfiguredBackendIdentity } from '../src/services/providerFactory';

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
  allowances: { transcriptionMonthlyMsRemaining: 3_600_000, intelligencePercentRemaining: 72 },
};

function billingMock(): jest.Mocked<BillingProvider> {
  return {
    configured: true,
    initialize: jest.fn(async (_appUserId: string) => undefined),
    restorePurchases: jest.fn(async () => undefined),
    purchase: jest.fn(async (_planId: 'pro' | 'max') => undefined),
    presentManagement: jest.fn(async () => undefined),
  };
}

describe('billing service', () => {
  beforeEach(() => {
    jest.mocked(configuredBackendUrl).mockReturnValue('https://gearx.invalid');
    jest.mocked(getConfiguredBackendIdentity).mockResolvedValue({ accessToken: 'access-token', userId: 'user-1' });
  });

  test('restore uses the stable backend identity then refreshes server authority', async () => {
    const billing = billingMock();
    const request = jest.fn(async () => ({ ok: true, json: async () => paidSnapshot } as Response));
    const service = new BillingService(billing, request);

    await expect(service.restore()).resolves.toEqual(paidSnapshot);
    expect(billing.initialize).toHaveBeenCalledWith('user-1');
    expect(billing.restorePurchases).toHaveBeenCalledTimes(1);
    expect(request).toHaveBeenCalledWith('https://gearx.invalid/v1/entitlements', {
      headers: { Authorization: 'Bearer access-token' },
    });
  });

  test('never treats a store response as entitlement authority', async () => {
    const billing = billingMock();
    const request = jest.fn(async () => ({ ok: true, json: async () => paidSnapshot } as Response));
    const service = new BillingService(billing, request);

    await expect(service.purchase('pro')).resolves.toEqual(paidSnapshot);
    expect(billing.purchase).toHaveBeenCalledWith('pro');
    expect(request).toHaveBeenCalledTimes(1);
  });

  test('returns local baseline when no backend exists', async () => {
    jest.mocked(configuredBackendUrl).mockReturnValueOnce('');
    const service = new BillingService(billingMock(), jest.fn());
    await expect(service.fetchEntitlement()).resolves.toMatchObject({ planId: 'free', capabilities: [] });
  });

  test('rejects an unknown server plan instead of trusting it', async () => {
    const request = jest.fn(async () => ({
      ok: true,
      json: async () => ({ ...paidSnapshot, planId: 'forged-unlimited' }),
    } as Response));
    const service = new BillingService(billingMock(), request);
    await expect(service.fetchEntitlement()).rejects.toMatchObject({ code: 'BILLING_UNAVAILABLE' });
  });
});
