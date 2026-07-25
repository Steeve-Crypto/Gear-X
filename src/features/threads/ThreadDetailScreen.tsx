import { useCallback, useEffect, useState } from 'react';
import { Text } from 'react-native';
import { Link, useLocalSearchParams } from 'expo-router';
import { retrieverAgent } from '../../agents/retriever';
import {
  ActionButton,
  EmptyState,
  Field,
  Panel,
  Screen,
  commonStyles,
} from '../../components/primitives';
import { knowledgeRepository } from '../../repositories/knowledgeRepository';

type Detail = NonNullable<Awaited<ReturnType<typeof knowledgeRepository.thread>>>;

export default function ThreadDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [detail, setDetail] = useState<Detail | null>();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [insightId, setInsightId] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const load = useCallback(async () => {
    if (!id) return;
    const next = await knowledgeRepository.thread(id);
    setDetail(next);
    setTitle(next?.thread.title ?? '');
    setDescription(next?.thread.description ?? '');
  }, [id]);
  useEffect(() => { void load(); }, [load]);
  if (detail === undefined) {
    return <Screen title="Thread"><Text style={commonStyles.body}>Loading relationship…</Text></Screen>;
  }
  if (!detail) {
    return <Screen title="Thread" eyebrow="RELATIONSHIP DETAIL">
      <EmptyState title="Thread unavailable" body="This relationship may have been removed with its source insights." />
    </Screen>;
  }
  const save = async () => {
    await knowledgeRepository.updateThread(detail.thread.id, title, description);
    await load();
  };
  const link = async () => {
    if (!insightId.trim()) return;
    await knowledgeRepository.linkThreadInsight(detail.thread.id, insightId.trim());
    setInsightId('');
    await load();
  };
  const ask = async () => {
    if (!question.trim()) return;
    const result = await retrieverAgent.run({
      recentTranscript: '',
      currentInsights: detail.links.map((item) => ({
        ...item,
        sourceTimestamp: item.createdAt,
        linkedInsightIds: [],
      })),
      isListening: false,
      userQuery: question.trim(),
    });
    setAnswer(result.data?.answer ?? result.error ?? 'No supported answer was found.');
  };
  return <Screen title={detail.thread.title} eyebrow="INSPECTABLE RELATIONSHIP">
    <Panel>
      <Field value={title} onChangeText={setTitle} accessibilityLabel="Thread title" />
      <Field value={description} onChangeText={setDescription} multiline
        accessibilityLabel="Thread description" />
      <Text style={commonStyles.meta}>{Math.round(detail.thread.confidence * 100)}% thread confidence</Text>
      <ActionButton label="Save thread" onPress={save} disabled={!title.trim()} />
    </Panel>
    {detail.links.map((link) => <Panel key={link.id}>
      <Link href={{ pathname: '/insight/[id]', params: { id: link.id } }}
        style={commonStyles.label}>{link.content}</Link>
      <Text style={commonStyles.meta}>{link.relationship.replace('_', ' ').toUpperCase()}</Text>
      <Text style={commonStyles.body}>{link.rationale}</Text>
      <Text style={commonStyles.meta}>{Math.round(link.linkConfidence * 100)}% link confidence</Text>
      <ActionButton label="Unlink insight" destructive onPress={async () => {
        await knowledgeRepository.unlinkThreadInsight(detail.thread.id, link.id);
        await load();
      }} />
    </Panel>)}
    <Panel>
      <Text style={commonStyles.meta}>MANUAL LINK</Text>
      <Field value={insightId} onChangeText={setInsightId} placeholder="Insight ID"
        autoCapitalize="none" autoCorrect={false} />
      <ActionButton label="Link insight" onPress={link} disabled={!insightId.trim()} />
    </Panel>
    <Panel>
      <Text style={commonStyles.meta}>ASK THIS THREAD</Text>
      <Field value={question} onChangeText={setQuestion} placeholder="What connects these records?"
        onSubmitEditing={ask} />
      <ActionButton label="Ask thread" onPress={ask} disabled={!question.trim()} />
      {answer ? <Text accessibilityLiveRegion="polite" style={commonStyles.body}>{answer}</Text> : null}
    </Panel>
  </Screen>;
}
