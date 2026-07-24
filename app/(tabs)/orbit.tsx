import { useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { AgentId, Insight } from '../../src/agents/types';
import { GearClock } from '../../src/components/GearClock';
import { ActionButton, Panel, Screen, commonStyles } from '../../src/components/primitives';
import { colors, spacing } from '../../src/design/tokens';
import { CaptureSession } from '../../src/domain/models';
import { userErrorMessage } from '../../src/domain/errors';
import { DeviceTranscriptionAdapter, LocalWhisperServerProvider } from '../../src/infrastructure/transcription/providers';
import { useSettingsStore } from '../../src/state/settingsStore';
import { useSessionStore } from '../../src/state/sessionStore';
import { getInsightCount } from '../../src/services/database';
import { pauseListening, resumeListening } from '../../src/services/audio';
import { startCaptureSession, stopAndProcessSession } from '../../src/services/captureSession';

export default function OrbitScreen() {
  const settings = useSettingsStore();
  const current = useSessionStore((state) => state.current);
  const setCurrent = useSessionStore((state) => state.setCurrent);
  const activeAgents = useSessionStore((state) => state.activeAgents);
  const setActiveAgents = useSessionStore((state) => state.setActiveAgents);
  const lastError = useSessionStore((state) => state.lastError);
  const setLastError = useSessionStore((state) => state.setLastError);
  const [insightCount, setInsightCount] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [lastInsight, setLastInsight] = useState('');
  const insights = useRef<Insight[]>([]);

  useEffect(() => {
    getInsightCount().then(setInsightCount).catch(() => setLastError('Vault count unavailable.'));
  }, [setLastError]);

  useEffect(() => {
    if (!current || (current.status !== 'recording' && current.status !== 'paused')) return;
    const timer = setInterval(() => setElapsed(Date.now() - current.startedAt), 1_000);
    return () => clearInterval(timer);
  }, [current]);

  const start = async () => {
    setLastError(null);
    try {
      const session = await startCaptureSession({
        transcriptionProvider: settings.transcriptionProvider,
        inferenceProvider: 'ollama',
        processingMode: settings.processingMode,
      });
      setCurrent(session);
      setElapsed(0);
      setTranscript('');
      setLastInsight('');
      setActiveAgents(['listener']);
    } catch (error) {
      setLastError(userErrorMessage(error));
    }
  };

  const togglePause = async () => {
    if (!current) return;
    const pausing = current.status === 'recording';
    const ok = pausing ? await pauseListening() : await resumeListening();
    if (!ok) {
      setLastError('The recording state could not be changed.');
      return;
    }
    setCurrent({ ...current, status: pausing ? 'paused' : 'recording', updatedAt: Date.now() });
    setActiveAgents(pausing ? [] : ['listener']);
  };

  const stop = async () => {
    if (!current) return;
    setLastError(null);
    setCurrent({ ...current, status: 'processing', updatedAt: Date.now() });
    setActiveAgents(['listener']);
    try {
      const provider = settings.transcriptionProvider === 'local-whisper-server'
        ? new LocalWhisperServerProvider(
            settings.transcriptionEndpoint,
            () => settings.remoteProcessingConsent,
          )
        : new DeviceTranscriptionAdapter();
      const result = await stopAndProcessSession({
        session: current,
        provider,
        retainRecording: settings.retainRecordings,
        currentInsights: insights.current,
        onAgents: (ids) => setActiveAgents(ids as AgentId[]),
      });
      insights.current = [...insights.current, ...result.newInsights];
      setInsightCount((count) => count + result.newInsights.length);
      setTranscript(result.transcript);
      setLastInsight(result.newInsights[0]?.content ?? '');
      setCurrent(result.session);
    } catch (error) {
      setCurrent({ ...current, status: 'failed', endedAt: Date.now(), updatedAt: Date.now() });
      setLastError(userErrorMessage(error));
      Alert.alert('Session saved', userErrorMessage(error));
    } finally {
      setActiveAgents([]);
    }
  };

  const listening = current?.status === 'recording';
  const processing = current?.status === 'processing';
  const status = processing
    ? 'Processing session'
    : listening
      ? 'Listener active'
      : current?.status === 'paused'
        ? 'Capture paused'
        : current?.status === 'failed'
          ? 'Session needs recovery'
          : 'Machine ready';

  return (
    <Screen title="Orbit" eyebrow="LIVE INTELLIGENCE">
      <View style={styles.clock}>
        <GearClock
          isListening={listening}
          insightCount={insightCount}
          activeAgents={activeAgents}
          reducedMotion={settings.reducedMotion}
          lowPerformanceMode={settings.lowPerformanceMode}
        />
      </View>
      <View accessibilityLiveRegion="polite" style={styles.status}>
        <Text style={styles.statusTitle}>{status}</Text>
        <Text style={commonStyles.meta}>
          {Math.floor(elapsed / 60_000).toString().padStart(2, '0')}:
          {Math.floor((elapsed % 60_000) / 1_000).toString().padStart(2, '0')} · {insightCount} insights
        </Text>
        <Text style={commonStyles.body}>
          {activeAgents.length ? `Active: ${activeAgents.join(', ')}` : 'All agents at rest'}
        </Text>
      </View>
      {!current || ['complete', 'failed'].includes(current.status) ? (
        <ActionButton label="Start listening" onPress={start} />
      ) : (
        <View style={styles.actions}>
          {!processing ? (
            <ActionButton
              label={current.status === 'paused' ? 'Resume' : 'Pause'}
              onPress={togglePause}
            />
          ) : null}
          <ActionButton label="Stop session" onPress={stop} disabled={processing} destructive />
        </View>
      )}
      {lastError ? <Panel><Text style={styles.error}>{lastError}</Text>
        <Text style={commonStyles.body}>
          Recording is separate from transcription. Configure a compatible provider in Inference settings.
        </Text>
      </Panel> : null}
      {transcript || lastInsight ? <Panel>
        <Text style={commonStyles.label}>{lastInsight || 'Transcript'}</Text>
        <Text style={commonStyles.body}>{transcript}</Text>
      </Panel> : null}
      <Link href="/settings" style={styles.link} accessibilityRole="link">Settings and privacy</Link>
      <View style={styles.actions}>
        <Link href="/session" style={styles.link} accessibilityRole="link">Session history</Link>
        <Link href="/summaries" style={styles.link} accessibilityRole="link">Summaries</Link>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  clock: { height: 300, width: '100%', maxWidth: 360, alignSelf: 'center' },
  status: { alignItems: 'center', gap: spacing.xs },
  statusTitle: { color: colors.brassBright, fontSize: 17, fontWeight: '700' },
  actions: { gap: spacing.sm },
  error: { color: colors.danger, fontSize: 15, fontWeight: '600' },
  link: { color: colors.brass, textAlign: 'center', padding: spacing.md },
});
