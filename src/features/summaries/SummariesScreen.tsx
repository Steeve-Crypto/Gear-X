import { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { Link } from 'expo-router';
import {
  ActionButton,
  ChoiceChip,
  EmptyState,
  Field,
  Panel,
  Screen,
  commonStyles,
} from '../../components/primitives';
import { SummaryRecord } from '../../services/database';
import { SummaryRequest, summaryService } from '../../services/summaryService';
import { createInferenceProvider } from '../../services/providerFactory';
import { useSettingsStore } from '../../state/settingsStore';

export default function SummariesScreen() {
  const settings = useSettingsStore();
  const [summaries, setSummaries] = useState<SummaryRecord[]>([]);
  const [scope, setScope] = useState<SummaryRequest['scope']>('session');
  const [sourceId, setSourceId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const load = useCallback(() => summaryService.list().then(setSummaries), []);
  useEffect(() => { void load(); }, [load]);
  const generate = async () => {
    setBusy(true);
    setMessage('');
    try {
      const request: SummaryRequest = scope === 'daily'
        ? { scope, date }
        : { scope, sourceId: sourceId.trim() };
      const result = await summaryService.generate(request, createInferenceProvider(settings));
      setMessage(result ? 'Summary saved.' : 'At least two matching insights are required.');
      await load();
    } catch {
      setMessage('Summary generation failed without changing existing summaries.');
    } finally {
      setBusy(false);
    }
  };
  const valid = scope === 'daily' ? Boolean(date) : Boolean(sourceId.trim());
  return <Screen title="Summaries" eyebrow="DURABLE COMPRESSION">
    <Panel>
      <Text style={commonStyles.meta}>NEW SUMMARY SCOPE</Text>
      <View style={commonStyles.row}>
        {(['session', 'daily', 'thread'] as const).map((item) => (
          <ChoiceChip key={item} label={item} selected={scope === item}
            onPress={() => setScope(item)} />
        ))}
      </View>
      {scope === 'daily'
        ? <Field value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" />
        : <Field value={sourceId} onChangeText={setSourceId}
          placeholder={`${scope === 'thread' ? 'Thread' : 'Session'} ID`}
          autoCapitalize="none" autoCorrect={false} />}
      <ActionButton label={busy ? 'Summarizing…' : 'Generate summary'}
        onPress={generate} disabled={busy || !valid} />
      {message ? <Text accessibilityLiveRegion="polite" style={commonStyles.body}>{message}</Text> : null}
    </Panel>
    {!summaries.length ? <EmptyState title="No summaries yet"
      body="At least two matching stored insights are required." /> :
      summaries.map((summary) => <SummaryEditor key={summary.id} summary={summary}
        onChange={load} inferenceProvider={createInferenceProvider(settings)} />)}
  </Screen>;
}

function SummaryEditor({ summary, onChange, inferenceProvider }: {
  summary: SummaryRecord;
  onChange: () => Promise<void>;
  inferenceProvider: ReturnType<typeof createInferenceProvider>;
}) {
  const [title, setTitle] = useState(summary.title);
  const [body, setBody] = useState(summary.body);
  return <Panel>
    <Text style={commonStyles.meta}>
      {(summary.scope ?? 'session').toUpperCase()} · {summary.source.toUpperCase()} · {summary.insightCount} SOURCES
    </Text>
    <Field value={title} onChangeText={setTitle} accessibilityLabel="Summary title" />
    <Field value={body} onChangeText={setBody} multiline accessibilityLabel="Summary body" />
    {summary.insightIds.map((id, index) => <Link key={id}
      href={{ pathname: '/insight/[id]', params: { id } }}
      style={commonStyles.body}>Source {index + 1}</Link>)}
    <ActionButton label="Save summary" onPress={async () => {
      await summaryService.update(summary.id, title, body); await onChange();
    }} />
    <ActionButton label="Regenerate" onPress={async () => {
      await summaryService.regenerate(summary, inferenceProvider); await onChange();
    }} />
    <ActionButton label="Delete summary" destructive onPress={async () => {
      await summaryService.remove(summary.id); await onChange();
    }} />
  </Panel>;
}
