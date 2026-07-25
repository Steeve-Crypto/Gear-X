import { useState } from 'react';
import { Text } from 'react-native';
import { Link } from 'expo-router';
import { retrieverAgent } from '../../agents/retriever';
import { Insight } from '../../agents/types';
import {
  ActionButton,
  EmptyState,
  Field,
  Panel,
  Screen,
  commonStyles,
} from '../../components/primitives';

export default function AskScreen() {
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState('');
  const [evidence, setEvidence] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(false);
  const [quality, setQuality] = useState<number | null>(null);
  const ask = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const result = await retrieverAgent.run({
        recentTranscript: '',
        currentInsights: [],
        isListening: false,
        userQuery: query.trim(),
      });
      setAnswer(result.data?.answer ?? result.error ?? 'No supported answer was found.');
      setEvidence(result.data?.matches ?? []);
      setQuality(result.data?.retrievalQuality ?? null);
    } finally {
      setLoading(false);
    }
  };
  return (
    <Screen title="Ask Gear X" eyebrow="EVIDENCE, THEN SYNTHESIS">
      <Field placeholder="What did I decide?" value={query} onChangeText={setQuery}
        onSubmitEditing={ask} />
      <ActionButton label={loading ? 'Searching…' : 'Search vault'} onPress={ask}
        disabled={loading || !query.trim()} />
      {!answer ? <EmptyState title="Ask your memory"
        body="Gear X answers from stored records and shows the evidence it used." /> :
        <Panel>
          <Text style={commonStyles.meta}>GENERATED SYNTHESIS</Text>
          <Text style={commonStyles.body}>{answer}</Text>
          {quality === null ? null : <Text style={commonStyles.meta}>
            RETRIEVAL QUALITY · {Math.round(quality * 100)}%
          </Text>}
        </Panel>}
      {evidence.map((item, index) => <Panel key={item.id}>
        <Text style={commonStyles.meta}>EVIDENCE {index + 1} · {item.type}</Text>
        <Link href={{ pathname: '/insight/[id]', params: { id: item.id } }}
          style={commonStyles.label}>{item.content}</Link>
        <Text style={commonStyles.meta}>
          {Math.round(item.confidence * 100)}% source confidence
        </Text>
        {item.sessionId ? <Link href={{ pathname: '/session/[id]', params: { id: item.sessionId } }}
          style={commonStyles.body}>Open source session</Link> : null}
      </Panel>)}
    </Screen>
  );
}
