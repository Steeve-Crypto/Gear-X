import { useCallback, useEffect, useState } from 'react';
import { Text } from 'react-native';
import { ActionButton, Panel, Screen, commonStyles } from '../../components/primitives';
import { userErrorMessage } from '../../domain/errors';
import { billingService } from '../../services/billing';
import { useEntitlementStore } from '../../state/entitlementStore';
import { launchPlanCatalog, publicPlan, PurchasableGearXPlan } from '../../domain/plans';

function formatTime(milliseconds: number): string {
  const minutes = Math.max(0, Math.floor(milliseconds / 60_000));
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'}`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours}h ${remainder}m` : `${hours} hour${hours === 1 ? '' : 's'}`;
}

export default function SubscriptionScreen() {
  const { snapshot, loading, message, fallbackMessage, setLoading, setSnapshot, setMessage } = useEntitlementStore();
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const run = useCallback(async (
    operation: 'refresh' | 'restore' | 'purchase' | 'manage',
    planId?: PurchasableGearXPlan,
  ) => {
    setPendingAction(planId ?? operation);
    setLoading(true);
    setMessage('');
    try {
      if (operation === 'manage') {
        await billingService.manage();
        setMessage('Subscription management closed.');
        return;
      }
      const next = operation === 'restore'
        ? await billingService.restore()
        : operation === 'purchase' && planId
          ? await billingService.purchase(planId)
          : await billingService.fetchEntitlement();
      const success = operation === 'restore'
        ? 'Purchases restored and cloud access refreshed.'
        : operation === 'purchase'
          ? 'Purchase verified and cloud access refreshed.'
          : 'Cloud access refreshed.';
      setSnapshot(next, success);
    } catch (error) {
      setMessage(userErrorMessage(error));
    } finally {
      setPendingAction(null);
    }
  }, [setLoading, setMessage, setSnapshot]);

  useEffect(() => { void run('refresh'); }, [run]);

  const definition = publicPlan(snapshot.planId);
  const resetLabel = snapshot.resetsAt
    ? new Date(snapshot.resetsAt).toLocaleDateString()
    : 'after server connection';

  return (
    <Screen title="Plan & Cloud Access" eyebrow="LOCAL-FIRST, SERVER-VERIFIED">
      <Panel>
        <Text style={commonStyles.meta}>CURRENT PLAN</Text>
        <Text accessibilityRole="header" style={commonStyles.label}>{snapshot.displayName}</Text>
        <Text style={commonStyles.body}>{definition.priceLabel} · Status: {snapshot.status.replace('_', ' ')}</Text>
        {snapshot.cancelAtPeriodEnd && snapshot.expiresAt ? (
          <Text style={commonStyles.body}>Cloud access remains active until {new Date(snapshot.expiresAt).toLocaleDateString()}.</Text>
        ) : null}
        {snapshot.pendingPlanId && snapshot.pendingEffectiveAt ? (
          <Text style={commonStyles.body}>
            Switch to {publicPlan(snapshot.pendingPlanId).name} scheduled for {new Date(snapshot.pendingEffectiveAt).toLocaleDateString()}.
          </Text>
        ) : null}
      </Panel>
      <Panel>
        <Text style={commonStyles.meta}>CLOUD ALLOWANCES</Text>
        <Text style={commonStyles.label}>Cloud transcription</Text>
        <Text style={commonStyles.body}>
          {formatTime(snapshot.allowances.transcriptionMonthlyMsRemaining)} of {formatTime(definition.monthlyTranscriptionMs)} remaining
        </Text>
        <Text style={commonStyles.label}>Enhanced intelligence</Text>
        <Text style={commonStyles.body}>{snapshot.allowances.intelligencePercentRemaining}% remaining</Text>
        <Text style={commonStyles.body}>Allowance resets {resetLabel}.</Text>
        <Text style={commonStyles.body}>Core capture, vault, search, and deterministic agents remain available locally without a subscription.</Text>
      </Panel>
      {fallbackMessage ? <Panel><Text accessibilityLiveRegion="polite" style={commonStyles.body}>{fallbackMessage}</Text></Panel> : null}
      {message ? <Text accessibilityLiveRegion="polite" style={commonStyles.body}>{message}</Text> : null}
      {launchPlanCatalog.map((plan) => (
        <Panel key={plan.id}>
          <Text style={commonStyles.label}>{plan.name}{plan.id === snapshot.planId ? ' · Current plan' : ''}</Text>
          <Text style={commonStyles.body}>{plan.priceLabel}</Text>
          {plan.highlights.map((highlight) => <Text key={highlight} style={commonStyles.body}>• {highlight}</Text>)}
          {plan.id !== 'free' && plan.id !== snapshot.planId ? (
            <ActionButton
              label={pendingAction === plan.id ? 'Contacting store…' : snapshot.planId === 'max' ? `Switch to ${plan.name}` : `Choose ${plan.name}`}
              disabled={loading}
              onPress={() => void run('purchase', plan.id === 'pro' ? 'pro' : 'max')}
            />
          ) : null}
        </Panel>
      ))}
      <ActionButton label="Restore purchases" disabled={loading} onPress={() => void run('restore')} />
      <ActionButton label="Manage subscription" disabled={loading || snapshot.status === 'none'} onPress={() => void run('manage')} />
      <ActionButton label="Refresh cloud access" disabled={loading} onPress={() => void run('refresh')} />
    </Screen>
  );
}
