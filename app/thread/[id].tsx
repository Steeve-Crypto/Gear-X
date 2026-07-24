import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { EmptyState, Panel, Screen, commonStyles } from '../../src/components/primitives';
import { knowledgeRepository } from '../../src/repositories/knowledgeRepository';

type Detail = Awaited<ReturnType<typeof knowledgeRepository.thread>>;

export default function ThreadDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [detail, setDetail] = useState<Detail>(null);
  useEffect(() => { if (id) void knowledgeRepository.thread(id).then(setDetail); }, [id]);
  if (!detail) {
    return <Screen title="Thread" eyebrow="RELATIONSHIP DETAIL">
      <EmptyState title="Thread unavailable" body="This relationship may have been removed with its source insights." />
    </Screen>;
  }
  return <Screen title={detail.thread.title} eyebrow="INSPECTABLE RELATIONSHIP">
    <Panel>
      <Text style={commonStyles.body}>{detail.thread.description}</Text>
      <Text style={commonStyles.meta}>{Math.round(detail.thread.confidence * 100)}% thread confidence</Text>
    </Panel>
    {detail.links.map((link) => <Panel key={link.id}>
      <Text style={commonStyles.label}>{link.content}</Text>
      <Text style={commonStyles.meta}>{link.relationship.replace('_', ' ').toUpperCase()}</Text>
      <Text style={commonStyles.body}>{link.rationale}</Text>
      <Text style={commonStyles.meta}>{Math.round(link.linkConfidence * 100)}% link confidence</Text>
    </Panel>)}
  </Screen>;
}
