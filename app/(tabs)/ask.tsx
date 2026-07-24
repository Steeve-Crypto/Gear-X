import { useState } from 'react';
import { Text } from 'react-native';
import { retrieverAgent } from '../../src/agents/retriever';
import { Insight } from '../../src/agents/types';
import { ActionButton, EmptyState, Field, Panel, Screen, commonStyles } from '../../src/components/primitives';

export default function AskScreen() {
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState('');
  const [evidence, setEvidence] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(false);
  const ask = async () => {
    if (!query.trim()) return;
    setLoading(true);
    const result = await retrieverAgent.run({
      recentTranscript: '',
      currentInsights: [],
      isListening: false,
      userQuery: query.trim(),
    });
    setAnswer(result.data?.answer ?? result.error ?? 'No supported answer was found.');
    setEvidence(result.data?.matches ?? []);
    setLoading(false);
  };
  return (
    <Screen title="Ask Gear X" eyebrow="EVIDENCE, THEN SYNTHESIS">
      <Field placeholder="What did I decide?" value={query} onChangeText={setQuery} onSubmitEditing={ask} />
      <ActionButton label={loading ? 'Searching…' : 'Search vault'} onPress={ask} disabled={loading || !query.trim()} />
      {!answer ? <EmptyState title="Ask your memory" body="Gear X answers from stored records and shows the evidence it used." /> :
        <Panel><Text style={commonStyles.meta}>GENERATED SYNTHESIS</Text><Text style={commonStyles.body}>{answer}</Text></Panel>}
      {evidence.map((item, index) => <Panel key={item.id}>
        <Text style={commonStyles.meta}>EVIDENCE {index + 1} · {item.type}</Text>
        <Text style={commonStyles.label}>{item.content}</Text>
      </Panel>)}
    </Screen>
  );
}
