export type GearXPlanId = 'free' | 'pro' | 'max';
export type PurchasableGearXPlan = Exclude<GearXPlanId, 'free'>;

export interface PublicPlanDefinition {
  id: GearXPlanId;
  name: string;
  priceLabel: string;
  monthlyTranscriptionMs: number;
  revenueCatEntitlementId: string | null;
  revenueCatPackageId: string | null;
  appleProductId: string | null;
  googleProductId: string | null;
  highlights: readonly string[];
}

export const launchPlanCatalog: readonly PublicPlanDefinition[] = [
  {
    id: 'free',
    name: 'GearX Free',
    priceLabel: '$0',
    monthlyTranscriptionMs: 30 * 60_000,
    revenueCatEntitlementId: null,
    revenueCatPackageId: null,
    appleProductId: null,
    googleProductId: null,
    highlights: [
      'Core GearX and local intelligence',
      '30 minutes cloud transcription monthly',
      'Limited enhanced intelligence',
    ],
  },
  {
    id: 'pro',
    name: 'GearX Pro',
    priceLabel: '$9.99/month',
    monthlyTranscriptionMs: 10 * 60 * 60_000,
    revenueCatEntitlementId: 'gearx_pro',
    revenueCatPackageId: 'pro_monthly',
    appleProductId: 'gearx_pro_monthly',
    googleProductId: 'gearx_pro_monthly',
    highlights: [
      '10 hours cloud transcription monthly',
      'Enhanced GearX intelligence',
      'Balanced and Quality cloud processing',
      'Larger cloud allowance',
    ],
  },
  {
    id: 'max',
    name: 'GearX Max',
    priceLabel: '$19.99/month',
    monthlyTranscriptionMs: 30 * 60 * 60_000,
    revenueCatEntitlementId: 'gearx_max',
    revenueCatPackageId: 'max_monthly',
    appleProductId: 'gearx_max_monthly',
    googleProductId: 'gearx_max_monthly',
    highlights: [
      '30 hours cloud transcription monthly',
      'Highest GearX cloud allowance',
      'Built for heavy capture and frequent analysis',
    ],
  },
] as const;

export function isGearXPlanId(value: string): value is GearXPlanId {
  return value === 'free' || value === 'pro' || value === 'max';
}

export function publicPlan(planId: GearXPlanId): PublicPlanDefinition {
  return launchPlanCatalog.find((plan) => plan.id === planId) ?? launchPlanCatalog[0];
}
