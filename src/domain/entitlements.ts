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
  planId: string;
  displayName: string;
  status: SubscriptionStatus;
  capabilities: CloudCapability[];
  expiresAt: string | null;
  cancelAtPeriodEnd: boolean;
  allowances: {
    transcriptionDailyMsRemaining: number;
    intelligenceMonthlyTokensRemaining: number;
  };
}

export const baselineEntitlement: EntitlementSnapshot = {
  planId: 'baseline',
  displayName: 'Local access',
  status: 'none',
  capabilities: [],
  expiresAt: null,
  cancelAtPeriodEnd: false,
  allowances: { transcriptionDailyMsRemaining: 0, intelligenceMonthlyTokensRemaining: 0 },
};

export function hasCloudCapability(snapshot: EntitlementSnapshot, capability: CloudCapability): boolean {
  return snapshot.capabilities.includes(capability);
}
