import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { Panel, Screen, commonStyles } from '../../src/components/primitives';
import { getDatabaseVersion } from '../../src/infrastructure/database';
import { knowledgeRepository } from '../../src/repositories/knowledgeRepository';
import { useSettingsStore } from '../../src/state/settingsStore';
import { useSessionStore } from '../../src/state/sessionStore';

export default function DiagnosticsScreen() {
  const settings = useSettingsStore();
  const lastError = useSessionStore((state) => state.lastError);
  const [version, setVersion] = useState(0);
  const [counts, setCounts] = useState<Record<string, number>>({});
  useEffect(() => {
    getDatabaseVersion().then(setVersion).catch(() => setVersion(-1));
    knowledgeRepository.counts().then(setCounts).catch(() => setCounts({}));
  }, []);
  return (
    <Screen title="Diagnostics" eyebrow="INTERNAL HEALTH">
      <Panel>
        <Row label="App version" value="0.1.0" />
        <Row label="Database version" value={version < 0 ? 'Migration error' : String(version)} />
        <Row label="Sessions" value={String(counts.sessions ?? 0)} />
        <Row label="Insights" value={String(counts.insights ?? 0)} />
        <Row label="Threads" value={String(counts.threads ?? 0)} />
        <Row label="Open-loop records" value={String(counts.questions ?? 0)} />
      </Panel>
      <Panel>
        <Row label="Inference" value={`Ollama · ${settings.ollamaModel}`} />
        <Row label="Transcription" value={settings.transcriptionProvider} />
        <Row label="Processing" value={settings.processingMode} />
        <Row label="Remote consent" value={settings.remoteProcessingConsent ? 'Enabled' : 'Disabled'} />
      </Panel>
      <Panel>
        <Text style={commonStyles.meta}>LAST SESSION ERROR</Text>
        <Text style={commonStyles.body}>{lastError ?? 'No error recorded in this app run.'}</Text>
      </Panel>
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <Text style={commonStyles.body}><Text style={commonStyles.label}>{label}: </Text>{value}</Text>;
}
