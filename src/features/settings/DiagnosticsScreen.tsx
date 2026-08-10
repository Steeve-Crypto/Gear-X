import { useCallback, useEffect, useState } from 'react';
import { Text } from 'react-native';
import { ActionButton, Panel, Screen, commonStyles } from '../../components/primitives';
import { collectDiagnostics, DiagnosticsSnapshot } from '../../services/diagnostics';
import { useSettingsStore } from '../../state/settingsStore';
import { useSessionStore } from '../../state/sessionStore';

export default function DiagnosticsScreen() {
  const settings = useSettingsStore();
  const lastError = useSessionStore((state) => state.lastError);
  const [snapshot, setSnapshot] = useState<DiagnosticsSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [exportText, setExportText] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setSnapshot(await collectDiagnostics(settings));
    setLoading(false);
  }, [settings]);

  useEffect(() => {
    let active = true;
    collectDiagnostics(settings).then((next) => {
      if (!active) return;
      setSnapshot(next);
      setLoading(false);
    });
    return () => { active = false; };
  }, [settings]);

  const counts = snapshot?.counts ?? {};
  return (
    <Screen title="Diagnostics" eyebrow="INTERNAL HEALTH">
      <Panel>
        <Row label="App version" value="0.1.0" />
        <Row label="Database schema" value={!snapshot ? 'Checking…' : snapshot.databaseVersion < 0
          ? `Migration error · latest ${snapshot.latestSchemaVersion}`
          : `${snapshot.databaseVersion} / ${snapshot.latestSchemaVersion}`} />
        <Row label="Sessions" value={String(counts.sessions ?? 0)} />
        <Row label="Insights" value={String(counts.insights ?? 0)} />
        <Row label="Threads" value={String(counts.threads ?? 0)} />
        <Row label="Open-loop records" value={String(counts.questions ?? 0)} />
        <Row label="Approximate export size" value={`${Math.ceil((snapshot?.approximateExportBytes ?? 0) / 1024)} KB`} />
        <Row label="Cloud requests today" value={`${snapshot?.cloudUsesToday ?? 0} / ${settings.dailyCloudRequestLimit}`} />
      </Panel>

      <Panel>
        <Text style={commonStyles.meta}>PROVIDER HEALTH</Text>
        <Row label="Transcription" value={loading ? 'Checking…' : availability(snapshot?.transcriptionAvailable)} />
        <Row label="Intelligence" value={loading ? 'Checking…' : availability(snapshot?.inferenceAvailable)} />
        <Row label="Mobile backend" value={snapshot?.backendConfigured ? 'Configured' : 'Not configured'} />
        {snapshot?.developerEndpoint ? <Row label="Developer endpoint" value={snapshot.developerEndpoint} /> : null}
      </Panel>

      <RunPanel title="RECENT AGENT RUNS" runs={snapshot?.recentAgentRuns ?? []}
        label={(run) => String(run.agent_id)} />
      <RunPanel title="RECENT PROVIDER RUNS" runs={snapshot?.recentProviderRuns ?? []}
        label={(run) => `${String(run.provider_id)} · ${String(run.operation)} · ${run.remote ? 'remote' : 'local'}`} />

      <ActionButton label={loading ? 'Refreshing…' : 'Refresh diagnostics'} disabled={loading}
        onPress={() => void load()} />
      <ActionButton label="Prepare diagnostics export" disabled={!snapshot} onPress={() => {
        if (!snapshot) return;
        setExportText(JSON.stringify({
          format: 'gear-x-diagnostics',
          version: 2,
          createdAt: new Date().toISOString(),
          ...snapshot,
          providers: {
            inferenceModel: settings.processingMode === 'developer' ? settings.ollamaModel : null,
            transcription: settings.transcriptionProvider,
            processing: settings.processingMode,
            remoteConsent: settings.remoteProcessingConsent,
          },
          lastError,
        }, null, 2));
      }} />
      {exportText ? <Panel><Text selectable style={commonStyles.body}>{exportText}</Text></Panel> : null}

      <Panel>
        <Row label="AI runtime" value={settings.processingMode === 'developer'
          ? `Developer · Ollama ${settings.ollamaModel}`
          : `${settings.processingMode} · deterministic local baseline`} />
        <Row label="Transcription selection" value={settings.transcriptionProvider} />
        <Row label="Remote consent" value={settings.remoteProcessingConsent ? 'Enabled' : 'Disabled'} />
      </Panel>
      <Panel>
        <Text style={commonStyles.meta}>LAST SESSION ERROR</Text>
        <Text style={commonStyles.body}>{lastError ?? 'No error recorded in this app run.'}</Text>
      </Panel>
    </Screen>
  );
}

function availability(value: boolean | undefined) {
  return value ? 'Available' : 'Unavailable';
}

function RunPanel({ title, runs, label }: {
  title: string;
  runs: Record<string, unknown>[];
  label: (run: Record<string, unknown>) => string;
}) {
  return <Panel>
    <Text style={commonStyles.meta}>{title}</Text>
    {runs.length ? runs.map((run, index) => (
      <Text key={`${label(run)}-${index}`} style={commonStyles.body}>
        {label(run)} · {String(run.status)}
        {run.duration_ms == null ? '' : ` · ${String(run.duration_ms)} ms`}
        {run.error_code ? ` · ${String(run.error_code)}` : ''}
      </Text>
    )) : <Text style={commonStyles.body}>No recorded runs yet.</Text>}
  </Panel>;
}

function Row({ label, value }: { label: string; value: string }) {
  return <Text style={commonStyles.body}><Text style={commonStyles.label}>{label}: </Text>{value}</Text>;
}
