jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { extra: {
    gearXRevenueCatAppleKey: 'appl_public',
    gearXRevenueCatGoogleKey: 'goog_public',
    gearXRevenueCatWebKey: 'rcb_public',
  } } },
}));
jest.mock('react-native-purchases', () => ({
  __esModule: true,
  default: {
    isConfigured: jest.fn(async () => true),
    configure: jest.fn(),
    logIn: jest.fn(async () => undefined),
    restorePurchases: jest.fn(async () => undefined),
    getOfferings: jest.fn(),
    purchasePackage: jest.fn(async (_package: unknown) => undefined),
  },
}));
jest.mock('react-native-purchases-ui', () => ({
  __esModule: true,
  default: { presentCustomerCenter: jest.fn(async () => undefined) },
}));

import { RevenueCatBillingProvider } from '../src/infrastructure/billing/revenueCat';
import Purchases from 'react-native-purchases';

const storePackage = (identifier: string, productId: string) => ({
  identifier,
  product: { identifier: productId },
});

describe('RevenueCat billing adapter', () => {
  beforeEach(() => {
    jest.mocked(Purchases.getOfferings).mockResolvedValue({
      current: null,
      all: { default: { availablePackages: [
        storePackage('pro_monthly', 'gearx_pro_monthly:monthly'),
        storePackage('max_monthly', 'gearx_max_monthly:monthly'),
      ] } },
    } as never);
  });

  test('selects the approved Pro and Max monthly packages', async () => {
    const provider = new RevenueCatBillingProvider();
    await provider.purchase('pro');
    await provider.purchase('max');
    expect(jest.mocked(Purchases.purchasePackage).mock.calls[0][0]).toMatchObject({ identifier: 'pro_monthly' });
    expect(jest.mocked(Purchases.purchasePackage).mock.calls[1][0]).toMatchObject({ identifier: 'max_monthly' });
  });

  test('fails closed when the configured offering lacks a plan', async () => {
    jest.mocked(Purchases.getOfferings).mockResolvedValueOnce({ current: null, all: { default: { availablePackages: [] } } } as never);
    const provider = new RevenueCatBillingProvider();
    await expect(provider.purchase('pro')).rejects.toMatchObject({ code: 'BILLING_UNAVAILABLE' });
  });
});
