import { create } from 'zustand';
import { baselineEntitlement, EntitlementSnapshot } from '../domain/entitlements';

interface EntitlementState {
  snapshot: EntitlementSnapshot;
  loading: boolean;
  message: string;
  fallbackMessage: string;
  setLoading: (loading: boolean) => void;
  setSnapshot: (snapshot: EntitlementSnapshot, message?: string) => void;
  setMessage: (message: string) => void;
  markFallback: (message: string) => void;
}

export const useEntitlementStore = create<EntitlementState>((set) => ({
  snapshot: baselineEntitlement,
  loading: false,
  message: '',
  fallbackMessage: '',
  setLoading: (loading) => set({ loading }),
  setSnapshot: (snapshot, message = '') => set({ snapshot, message, loading: false }),
  setMessage: (message) => set({ message, loading: false }),
  markFallback: (fallbackMessage) => set({ fallbackMessage }),
}));
