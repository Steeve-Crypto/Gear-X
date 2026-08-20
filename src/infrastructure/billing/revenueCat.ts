import Constants from 'expo-constants';
import { Platform } from 'react-native';
import Purchases from 'react-native-purchases';
import RevenueCatUI from 'react-native-purchases-ui';
import { GearXError } from '../../domain/errors';
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

  async presentUpgrade(): Promise<void> {
    await RevenueCatUI.presentPaywall({ displayCloseButton: true });
  }

  async presentManagement(): Promise<void> {
    await RevenueCatUI.presentCustomerCenter();
  }
}
