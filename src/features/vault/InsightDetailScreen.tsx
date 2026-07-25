import { Alert, Text } from 'react-native';
import { useEffect, useState } from 'react';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { ActionButton, Field, Panel, Screen, commonStyles } from '../../components/primitives';
import { VaultInsight } from '../../domain/models';
import { knowledgeRepository } from '../../repositories/knowledgeRepository';

export default function InsightDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [insight, setInsight] = useState<VaultInsight | null>(null);
  const [content, setContent] = useState('');
  const [context, setContext] = useState<Awaited<ReturnType<typeof knowledgeRepository.insightContext>>>();
  const [exportText, setExportText] = useState('');
  useEffect(() => {
    if (!id) return;
    knowledgeRepository.insight(id).then((item) => { setInsight(item); setContent(item?.content ?? ''); });
    knowledgeRepository.insightContext(id).then(setContext);
  }, [id]);
  if (!insight) return <Screen title="Insight"><Text style={commonStyles.body}>Insight not found.</Text></Screen>;
  const update = async (patch: Parameters<typeof knowledgeRepository.updateInsight>[1]) => {
    await knowledgeRepository.updateInsight(insight.id, patch);
    setInsight({ ...insight, ...patch });
  };
  const remove = () => Alert.alert('Delete insight?', 'Its thread links and question source references will be updated.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: async () => {
      await knowledgeRepository.removeInsight(insight.id); router.back();
    } },
  ]);
  return <Screen title="Insight" eyebrow={insight.type.toUpperCase()}>
    <Panel>
      <Field value={content} onChangeText={setContent} multiline />
      <ActionButton label="Save edit" onPress={() => update({ content })} />
    </Panel>
    <Panel>
      <Text style={commonStyles.body}>Confidence: {Math.round(insight.confidence * 100)}%</Text>
      <Text style={commonStyles.meta}>Created {new Date(insight.createdAt).toLocaleString()}</Text>
      {insight.sessionId ? <Link href={{ pathname: '/session/[id]', params: { id: insight.sessionId } }}
        style={commonStyles.body}>Open source session</Link> : null}
    </Panel>
    <Panel>
      <Text style={commonStyles.meta}>SOURCE TRANSCRIPT</Text>
      {context?.segments.length ? context.segments.map((segment) => (
        <Text key={segment.id} style={commonStyles.body}>
          {segment.speakerLabel ? `${segment.speakerLabel}: ` : ''}{segment.text}
        </Text>
      )) : <Text style={commonStyles.body}>No source segment is attached.</Text>}
    </Panel>
    {context?.threads.length ? <Panel>
      <Text style={commonStyles.meta}>CONNECTED THREADS</Text>
      {context.threads.map((thread) => <Link key={thread.id}
        href={{ pathname: '/thread/[id]', params: { id: thread.id } }}
        style={commonStyles.body}>{thread.title}</Link>)}
    </Panel> : null}
    {context?.loops.length ? <Panel>
      <Text style={commonStyles.meta}>RELATED QUESTIONS</Text>
      {context.loops.map((loop) => <Link key={loop.id}
        href={{ pathname: '/loop/[id]', params: { id: loop.id } }}
        style={commonStyles.body}>{loop.question}</Link>)}
    </Panel> : null}
    <ActionButton label={insight.pinned ? 'Unpin' : 'Pin'} onPress={() => update({ pinned: !insight.pinned })} />
    <ActionButton label={insight.archived ? 'Restore' : 'Archive'} onPress={() => update({ archived: !insight.archived })} />
    <ActionButton label="Prepare insight export" onPress={() => setExportText(JSON.stringify({
      format: 'gear-x-insight',
      version: 1,
      exportedAt: new Date().toISOString(),
      insight,
      sourceSegments: context?.segments ?? [],
    }, null, 2))} />
    {exportText ? <Panel>
      <Text style={commonStyles.meta}>PLAINTEXT EXPORT · SELECT TO COPY</Text>
      <Text selectable style={commonStyles.body}>{exportText}</Text>
    </Panel> : null}
    <ActionButton label="Delete insight" onPress={remove} destructive />
  </Screen>;
}
