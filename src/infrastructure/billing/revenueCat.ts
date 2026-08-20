import Constants from 'expo-constants';
import { Platform } from 'react-native';
import Purchases from 'react-native-purchases';
import RevenueCatUI from 'react-native-purchases-ui';
import { GearXError } from '../../domain/errors';
import { publicPlan, PurchasableGearXPlan } from '../../domain/plans';
import { BillingProvider } from './types';

function platformKey(): string {
  const extra = Constants.expoConfig?.extra;
  const value = Platform.OS === 'ios'
    ? extra?.gearXRevenueCatAppleKey
    : Platform.OS === 'android'
      ? extra?.gearXRevenueCatGoogleKey
      : extra?.gearXRevenueCatWebKey;
  return typeof value === 'string' ? value : '';
}

export class RevenueCatBillingProvider implements BillingProvider {
  readonly configured = Boolean(platformKey());
  private appUserId = '';

  async initialize(appUserId: string): Promise<void> {
    const apiKey = platformKey();
    if (!apiKey) throw new GearXError('BILLING_UNAVAILABLE', 'Subscription services are not configured.');
    if (!(await Purchases.isConfigured())) Purchases.configure({ apiKey, appUserID: appUserId });
    else if (this.appUserId !== appUserId) await Purchases.logIn(appUserId);
    this.appUserId = appUserId;
  }

  async restorePurchases(): Promise<void> {
    await Purchases.restorePurchases();
  }

  async purchase(planId: PurchasableGearXPlan): Promise<void> {
    const definition = publicPlan(planId);
    const offerings = await Purchases.getOfferings();
    const offering = offerings.all.default ?? offerings.current;
    const selected = offering?.availablePackages.find((item) => (
      item.identifier === definition.revenueCatPackageId
      || item.product.identifier === definition.appleProductId
      || item.product.identifier.split(':', 1)[0] === definition.googleProductId
    ));
    if (!selected) {
      throw new GearXError('BILLING_UNAVAILABLE', 'The selected monthly plan is not available from the store.');
    }
    await Purchases.purchasePackage(selected);
  }

  async presentManagement(): Promise<void> {
    await RevenueCatUI.presentCustomerCenter();
  }
}
