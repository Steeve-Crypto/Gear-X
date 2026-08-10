export interface RemoteUsagePolicy {
  reserve(providerId: string, capability: string): Promise<boolean>;
}
