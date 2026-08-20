import { baselineEntitlement, EntitlementSnapshot } from '../domain/entitlements';
import { GearXError } from '../domain/errors';
import { isGearXPlanId, PurchasableGearXPlan } from '../domain/plans';
import { BillingProvider } from '../infrastructure/billing/types';
import { configuredBackendUrl, getConfiguredBackendIdentity } from './providerFactory';

export class BillingService {
  constructor(
    private billing?: BillingProvider,
    private readonly request: typeof fetch = fetch,
  ) {}

  private async billingProvider(): Promise<BillingProvider> {
    if (!this.billing) {
      const { RevenueCatBillingProvider } = await import('../infrastructure/billing/revenueCat');
      this.billing = new RevenueCatBillingProvider();
    }
    return this.billing;
  }

  async fetchEntitlement(): Promise<EntitlementSnapshot> {
    const backendUrl = configuredBackendUrl();
    if (!backendUrl) return baselineEntitlement;
    const identity = await getConfiguredBackendIdentity();
    const response = await this.request(`${backendUrl}/v1/entitlements`, {
      headers: { Authorization: `Bearer ${identity.accessToken}` },
    });
    if (!response.ok) throw new GearXError('BILLING_UNAVAILABLE', 'Cloud access could not be refreshed.');
    const snapshot = await response.json() as EntitlementSnapshot;
    if (!isGearXPlanId(snapshot.planId)) {
      throw new GearXError('BILLING_UNAVAILABLE', 'Cloud access returned an unknown plan.');
    }
    return snapshot;
  }

  async restore(): Promise<EntitlementSnapshot> {
    const identity = await getConfiguredBackendIdentity();
    const billing = await this.billingProvider();
    await billing.initialize(identity.userId);
    await billing.restorePurchases();
    return this.fetchEntitlement();
  }

  async purchase(planId: PurchasableGearXPlan): Promise<EntitlementSnapshot> {
    const identity = await getConfiguredBackendIdentity();
    const billing = await this.billingProvider();
    await billing.initialize(identity.userId);
    await billing.purchase(planId);
    return this.fetchEntitlement();
  }

  async manage(): Promise<void> {
    const identity = await getConfiguredBackendIdentity();
    const billing = await this.billingProvider();
    await billing.initialize(identity.userId);
    await billing.presentManagement();
  }
}

export const billingService = new BillingService();
