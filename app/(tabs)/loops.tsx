import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { Link } from 'expo-router';
import { ActionButton, EmptyState, Panel, Screen, commonStyles } from '../../src/components/primitives';
import { OpenLoop } from '../../src/domain/models';
import { knowledgeRepository } from '../../src/repositories/knowledgeRepository';

export default function LoopsScreen() {
  const [loops, setLoops] = useState<OpenLoop[]>([]);
  const load = () => knowledgeRepository.loops().then(setLoops).catch(() => setLoops([]));
  useEffect(() => { void load(); }, []);
  const resolve = async (id: string) => {
    await knowledgeRepository.resolveLoop(id, 'Resolved in Gear X', 'resolved');
    await load();
  };
  return (
    <Screen title="Open Loops" eyebrow="UNRESOLVED SIGNALS">
      {!loops.length ? <EmptyState title="No open loops" body="Questioner has not found an unresolved decision, commitment, risk, or missing detail." /> :
        loops.map((loop) => <Panel key={loop.id}>
          <Text style={commonStyles.meta}>{loop.category.replace('_', ' ').toUpperCase()} · {loop.priority}</Text>
          <Text style={commonStyles.label}>{loop.question}</Text>
          <Link href={{ pathname: '/loop/[id]', params: { id: loop.id } }} style={commonStyles.body}>
            View source and status
          </Link>
          <ActionButton label="Resolve" onPress={() => resolve(loop.id)} />
        </Panel>)}
    </Screen>
  );
}
