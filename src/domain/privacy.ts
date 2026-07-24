export function canUseProvider(remote: boolean, remoteConsent: boolean): boolean {
  return !remote || remoteConsent;
}
