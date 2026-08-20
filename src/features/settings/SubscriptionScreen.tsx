import { useCallback, useEffect } from 'react';
import { Text } from 'react-native';
import { ActionButton, Panel, Screen, commonStyles } from '../../components/primitives';
import { userErrorMessage } from '../../domain/errors';
import { billingService } from '../../services/billing';
import { useEntitlementStore } from '../../state/entitlementStore';

function formatTime(milliseconds: number): string {
  const minutes = Math.max(0, Math.floor(milliseconds / 60_000));
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'}`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours}h ${remainder}m` : `${hours} hour${hours === 1 ? '' : 's'}`;
}

export default function SubscriptionScreen() {
  const { snapshot, loading, message, fallbackMessage, setLoading, setSnapshot, setMessage } = useEntitlementStore();

  const run = useCallback(async (operation: 'refresh' | 'restore' | 'upgrade' | 'manage') => {
    setLoading(true);
    try {
      if (operation === 'manage') {
        await billingService.manage();
        setMessage('Subscription management closed.');
        return;
      }
      const next = operation === 'restore'
        ? await billingService.restore()
        : operation === 'upgrade'
          ? await billingService.upgrade()
          : await billingService.fetchEntitlement();
      setSnapshot(next, operation === 'restore' ? 'Purchases restored and cloud access refreshed.' : 'Cloud access refreshed.');
    } catch (error) {
      setMessage(userErrorMessage(error));
    }
  }, [setLoading, setMessage, setSnapshot]);

  useEffect(() => { void run('refresh'); }, [run]);

  const enhancedAvailable = snapshot.capabilities.length > 0
    && snapshot.allowances.intelligenceMonthlyTokensRemaining > 0;

  return (
    <Screen title="Plan & Cloud Access" eyebrow="LOCAL-FIRST, SERVER-VERIFIED">
      <Panel>
        <Text style={commonStyles.meta}>CURRENT PLAN</Text>
        <Text accessibilityRole="header" style={commonStyles.label}>{snapshot.displayName}</Text>
        <Text style={commonStyles.body}>Status: {snapshot.status.replace('_', ' ')}</Text>
        {snapshot.cancelAtPeriodEnd && snapshot.expiresAt ? (
          <Text style={commonStyles.body}>Cloud access remains active until {new Date(snapshot.expiresAt).toLocaleDateString()}.</Text>
        ) : null}
      </Panel>
      <Panel>
        <Text style={commonStyles.meta}>CLOUD ALLOWANCES</Text>
        <Text style={commonStyles.label}>Transcription today</Text>
        <Text style={commonStyles.body}>{formatTime(snapshot.allowances.transcriptionDailyMsRemaining)} remaining</Text>
        <Text style={commonStyles.label}>Enhanced analysis</Text>
        <Text style={commonStyles.body}>{enhancedAvailable ? 'Available within your monthly plan allowance' : 'Local processing only right now'}</Text>
        <Text style={commonStyles.body}>Core capture, vault, search, and deterministic agents remain available locally without a subscription.</Text>
      </Panel>
      {fallbackMessage ? <Panel><Text accessibilityLiveRegion="polite" style={commonStyles.body}>{fallbackMessage}</Text></Panel> : null}
      {message ? <Text accessibilityLiveRegion="polite" style={commonStyles.body}>{message}</Text> : null}
      <ActionButton label="Upgrade plan" disabled={loading} onPress={() => void run('upgrade')} />
      <ActionButton label="Restore purchases" disabled={loading} onPress={() => void run('restore')} />
      <ActionButton label="Manage subscription" disabled={loading || snapshot.status === 'none'} onPress={() => void run('manage')} />
      <ActionButton label="Refresh cloud access" disabled={loading} onPress={() => void run('refresh')} />
    </Screen>
  );
}
