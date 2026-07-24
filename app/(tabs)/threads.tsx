import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { EmptyState, Panel, Screen, commonStyles } from '../../src/components/primitives';
import { KnowledgeThread } from '../../src/domain/models';
import { knowledgeRepository } from '../../src/repositories/knowledgeRepository';

export default function ThreadsScreen() {
  const [threads, setThreads] = useState<KnowledgeThread[]>([]);
  useEffect(() => { knowledgeRepository.threads().then(setThreads).catch(() => setThreads([])); }, []);
  return (
    <Screen title="Threads" eyebrow="CONNECTED KNOWLEDGE">
      {!threads.length ? <EmptyState title="No threads yet" body="Weaver will create inspectable relationships when insights share a meaningful connection." /> :
        threads.map((thread) => <Panel key={thread.id}>
          <Text style={commonStyles.label}>{thread.title}</Text>
          <Text style={commonStyles.body}>{thread.description}</Text>
          <Text style={commonStyles.meta}>{Math.round(thread.confidence * 100)}% relationship confidence</Text>
        </Panel>)}
    </Screen>
  );
}
