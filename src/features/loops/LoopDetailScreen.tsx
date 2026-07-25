import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { Link, useLocalSearchParams } from 'expo-router';
import {
  ActionButton,
  ChoiceChip,
  EmptyState,
  Field,
  Panel,
  Screen,
  commonStyles,
} from '../../components/primitives';
import { OpenLoop } from '../../domain/models';
import { knowledgeRepository } from '../../repositories/knowledgeRepository';

export default function LoopDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loop, setLoop] = useState<OpenLoop | null>();
  const [question, setQuestion] = useState('');
  const [resolution, setResolution] = useState('');
  const [dueDate, setDueDate] = useState('');
  useEffect(() => {
    if (!id) return;
    void knowledgeRepository.loop(id).then((item) => {
      setLoop(item);
      setQuestion(item?.question ?? '');
      setResolution(item?.resolution ?? '');
      setDueDate(item?.dueAt ? new Date(item.dueAt).toISOString().slice(0, 10) : '');
    });
  }, [id]);
  if (loop === undefined) return <Screen title="Open Loop"><Text style={commonStyles.body}>Loading loop…</Text></Screen>;
  if (!loop) return <Screen title="Open Loop"><EmptyState title="Loop unavailable" body="This open loop no longer exists." /></Screen>;
  const save = async (patch: Parameters<typeof knowledgeRepository.updateLoop>[1]) => {
    await knowledgeRepository.updateLoop(loop.id, patch);
    const next = await knowledgeRepository.loop(loop.id);
    setLoop(next);
  };
  const close = async (status: 'resolved' | 'dismissed') => {
    const note = resolution.trim() || (status === 'resolved' ? 'Resolved in Gear X' : 'Dismissed by user');
    await knowledgeRepository.resolveLoop(loop.id, note, status);
    setLoop({ ...loop, status, resolution: note, resolvedAt: Date.now() });
  };
  return <Screen title="Open Loop" eyebrow={loop.category.replace('_', ' ').toUpperCase()}>
    <Panel>
      <Field value={question} onChangeText={setQuestion} multiline accessibilityLabel="Question" />
      <Text style={commonStyles.meta}>PRIORITY</Text>
      {(['low', 'medium', 'high'] as const).map((priority) => (
        <ChoiceChip key={priority} label={priority} selected={loop.priority === priority}
          onPress={() => save({ priority })} />
      ))}
      <Field value={dueDate} onChangeText={setDueDate} placeholder="Due date YYYY-MM-DD"
        autoCapitalize="none" accessibilityLabel="Due date" />
      <ActionButton label="Save loop details" onPress={() => {
        const parsed = dueDate ? Date.parse(`${dueDate}T12:00:00`) : null;
        void save({ question, dueAt: parsed && Number.isFinite(parsed) ? parsed : null });
      }} />
      <ChoiceChip label="Reminder ready" selected={loop.reminderReady}
        onPress={() => save({ reminderReady: !loop.reminderReady })} />
      <Text style={commonStyles.body}>Status: {loop.status}</Text>
      <Text style={commonStyles.meta}>Created {new Date(loop.createdAt).toLocaleString()}</Text>
      {loop.insightId ? <Link href={{ pathname: '/insight/[id]', params: { id: loop.insightId } }}
        style={commonStyles.body}>Open source insight</Link> : null}
      {loop.sessionId ? <Link href={{ pathname: '/session/[id]', params: { id: loop.sessionId } }}
        style={commonStyles.body}>Open source session</Link> : null}
    </Panel>
    {loop.status === 'open' ? <Panel>
      <Field value={resolution} onChangeText={setResolution} multiline
        placeholder="Resolution or dismissal note" />
      <ActionButton label="Resolve" onPress={() => close('resolved')} />
      <ActionButton label="Dismiss" onPress={() => close('dismissed')} destructive />
    </Panel> : <Panel><Text style={commonStyles.body}>{loop.resolution}</Text></Panel>}
  </Screen>;
}
