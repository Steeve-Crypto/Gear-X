export type CloudCapability =
  | 'cloud_transcription'
  | 'cloud_extraction'
  | 'cloud_weaving'
  | 'cloud_summarization'
  | 'cloud_questioning'
  | 'cloud_answer_synthesis';

export type SubscriptionStatus =
  | 'none' | 'active' | 'cancelled' | 'billing_retry' | 'grace' | 'expired' | 'revoked';

export interface EntitlementSnapshot {
  planId: GearXPlanId;
  displayName: string;
  status: SubscriptionStatus;
  capabilities: CloudCapability[];
  expiresAt: string | null;
  cancelAtPeriodEnd: boolean;
  pendingPlanId: GearXPlanId | null;
  pendingEffectiveAt: string | null;
  periodStartedAt: string | null;
  resetsAt: string | null;
  allowances: {
    transcriptionMonthlyMsRemaining: number;
    intelligencePercentRemaining: number;
  };
}

export const baselineEntitlement: EntitlementSnapshot = {
  planId: 'free',
  displayName: 'GearX Free',
  status: 'none',
  capabilities: [],
  expiresAt: null,
  cancelAtPeriodEnd: false,
  pendingPlanId: null,
  pendingEffectiveAt: null,
  periodStartedAt: null,
  resetsAt: null,
  allowances: { transcriptionMonthlyMsRemaining: 0, intelligencePercentRemaining: 0 },
};

export function hasCloudCapability(snapshot: EntitlementSnapshot, capability: CloudCapability): boolean {
  return snapshot.capabilities.includes(capability);
}
import { GearXPlanId } from './plans';
