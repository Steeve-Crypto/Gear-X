import { EntitlementSnapshot } from '../../domain/entitlements';
import { PurchasableGearXPlan } from '../../domain/plans';

export interface BillingProvider {
  readonly configured: boolean;
  initialize(appUserId: string): Promise<void>;
  restorePurchases(): Promise<void>;
  purchase(planId: PurchasableGearXPlan): Promise<void>;
  presentManagement(): Promise<void>;
}

export interface EntitlementProvider {
  fetchSnapshot(): Promise<EntitlementSnapshot>;
}
