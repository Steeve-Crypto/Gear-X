import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { ActionButton, EmptyState, Panel, Screen, commonStyles } from '../../src/components/primitives';
import { OpenLoop } from '../../src/domain/models';
import { knowledgeRepository } from '../../src/repositories/knowledgeRepository';

export default function LoopDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loop, setLoop] = useState<OpenLoop | null>(null);
  useEffect(() => { if (id) void knowledgeRepository.loop(id).then(setLoop); }, [id]);
  if (!loop) return <Screen title="Open Loop"><EmptyState title="Loop unavailable" body="This open loop no longer exists." /></Screen>;
  const close = async (status: 'resolved' | 'dismissed') => {
    await knowledgeRepository.resolveLoop(loop.id, status === 'resolved' ? 'Resolved in Gear X' : 'Dismissed by user', status);
    setLoop({ ...loop, status, resolution: status === 'resolved' ? 'Resolved in Gear X' : 'Dismissed by user', resolvedAt: Date.now() });
  };
  return <Screen title="Open Loop" eyebrow={loop.category.replace('_', ' ').toUpperCase()}>
    <Panel>
      <Text style={commonStyles.label}>{loop.question}</Text>
      <Text style={commonStyles.body}>Priority: {loop.priority} · Status: {loop.status}</Text>
      <Text style={commonStyles.meta}>Created {new Date(loop.createdAt).toLocaleString()}</Text>
    </Panel>
    {loop.status === 'open' ? <>
      <ActionButton label="Resolve" onPress={() => close('resolved')} />
      <ActionButton label="Dismiss" onPress={() => close('dismissed')} destructive />
    </> : <Panel><Text style={commonStyles.body}>{loop.resolution}</Text></Panel>}
  </Screen>;
}
