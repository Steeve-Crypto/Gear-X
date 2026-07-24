import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { ActionButton, EmptyState, Field, Panel, Screen, commonStyles } from '../../src/components/primitives';
import { SummaryRecord } from '../../src/services/database';
import { summaryService } from '../../src/services/summaryService';

export default function SummariesScreen() {
  const [summaries, setSummaries] = useState<SummaryRecord[]>([]);
  const [busy, setBusy] = useState(false);
  const load = () => summaryService.list().then(setSummaries);
  useEffect(() => { void load(); }, []);
  const generate = async () => {
    setBusy(true);
    await summaryService.generate();
    await load();
    setBusy(false);
  };
  return <Screen title="Summaries" eyebrow="DURABLE COMPRESSION">
    <ActionButton label={busy ? 'Summarizing…' : 'Generate summary'} onPress={generate} disabled={busy} />
    {!summaries.length ? <EmptyState title="No summaries yet" body="At least two stored insights are required." /> :
      summaries.map((summary) => <SummaryEditor key={summary.id} summary={summary} onChange={load} />)}
  </Screen>;
}

function SummaryEditor({ summary, onChange }: { summary: SummaryRecord; onChange: () => Promise<void> }) {
  const [title, setTitle] = useState(summary.title);
  const [body, setBody] = useState(summary.body);
  return <Panel>
    <Text style={commonStyles.meta}>{summary.source.toUpperCase()} · {summary.insightCount} SOURCES</Text>
    <Field value={title} onChangeText={setTitle} accessibilityLabel="Summary title" />
    <Field value={body} onChangeText={setBody} multiline accessibilityLabel="Summary body" />
    <ActionButton label="Save summary" onPress={async () => {
      await summaryService.update(summary.id, title, body); await onChange();
    }} />
    <ActionButton label="Delete summary" destructive onPress={async () => {
      await summaryService.remove(summary.id); await onChange();
    }} />
  </Panel>;
}
