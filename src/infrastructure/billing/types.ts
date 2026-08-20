import { EntitlementSnapshot } from '../../domain/entitlements';

export interface BillingProvider {
  readonly configured: boolean;
  initialize(appUserId: string): Promise<void>;
  restorePurchases(): Promise<void>;
  presentUpgrade(): Promise<void>;
  presentManagement(): Promise<void>;
}

export interface EntitlementProvider {
  fetchSnapshot(): Promise<EntitlementSnapshot>;
}
