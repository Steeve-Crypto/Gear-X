import { Alert, Text } from 'react-native';
import { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { ActionButton, Field, Panel, Screen, commonStyles } from '../../src/components/primitives';
import { VaultInsight } from '../../src/domain/models';
import { knowledgeRepository } from '../../src/repositories/knowledgeRepository';

export default function InsightDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [insight, setInsight] = useState<VaultInsight | null>(null);
  const [content, setContent] = useState('');
  useEffect(() => {
    if (!id) return;
    knowledgeRepository.insight(id).then((item) => { setInsight(item); setContent(item?.content ?? ''); });
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
    </Panel>
    <ActionButton label={insight.pinned ? 'Unpin' : 'Pin'} onPress={() => update({ pinned: !insight.pinned })} />
    <ActionButton label={insight.archived ? 'Restore' : 'Archive'} onPress={() => update({ archived: !insight.archived })} />
    <ActionButton label="Delete insight" onPress={remove} destructive />
  </Screen>;
}
