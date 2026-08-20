import { launchPlanCatalog, publicPlan } from '../src/domain/plans';

describe('approved launch plan catalog', () => {
  test('contains exactly Free, Pro, and Max with approved public economics', () => {
    expect(launchPlanCatalog.map((plan) => plan.id)).toEqual(['free', 'pro', 'max']);
    expect(publicPlan('free')).toMatchObject({ priceLabel: '$0', monthlyTranscriptionMs: 1_800_000 });
    expect(publicPlan('pro')).toMatchObject({
      priceLabel: '$9.99/month',
      monthlyTranscriptionMs: 36_000_000,
      revenueCatEntitlementId: 'gearx_pro',
      appleProductId: 'gearx_pro_monthly',
      googleProductId: 'gearx_pro_monthly',
    });
    expect(publicPlan('max')).toMatchObject({
      priceLabel: '$19.99/month',
      monthlyTranscriptionMs: 108_000_000,
      revenueCatEntitlementId: 'gearx_max',
      appleProductId: 'gearx_max_monthly',
      googleProductId: 'gearx_max_monthly',
    });
  });

  test('does not market any launch plan as unlimited', () => {
    expect(JSON.stringify(launchPlanCatalog).toLowerCase()).not.toContain('unlimited');
  });
});
