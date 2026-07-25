import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Link, useFocusEffect } from 'expo-router';
import {
  ChoiceChip,
  EmptyState,
  Field,
  Panel,
  Screen,
  commonStyles,
} from '../../components/primitives';
import { OpenLoop } from '../../domain/models';
import { knowledgeRepository } from '../../repositories/knowledgeRepository';

const categories: OpenLoop['category'][] = [
  'decision', 'commitment', 'missing_information', 'follow_up', 'risk',
  'contradiction', 'question', 'deadline', 'uncertainty',
];

export default function LoopsScreen() {
  const [loops, setLoops] = useState<OpenLoop[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<OpenLoop['status'] | 'all'>('open');
  const [category, setCategory] = useState<OpenLoop['category']>();
  const [dueOnly, setDueOnly] = useState(false);
  const [error, setError] = useState('');
  const load = useCallback(() => {
    setError('');
    knowledgeRepository.loops({ search, status, category, dueOnly })
      .then(setLoops)
      .catch(() => setError('Open loops could not be loaded.'));
  }, [category, dueOnly, search, status]);
  useFocusEffect(load);
  useEffect(() => {
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
  }, [load]);
  return (
    <Screen title="Open Loops" eyebrow="UNRESOLVED SIGNALS">
      <Field placeholder="Search questions and resolutions" value={search} onChangeText={setSearch} />
      <Panel>
        <View style={styles.wrap}>
          {(['open', 'resolved', 'dismissed', 'all'] as const).map((item) => (
            <ChoiceChip key={item} label={item} selected={status === item}
              onPress={() => setStatus(item)} />
          ))}
          <ChoiceChip label="Has due date" selected={dueOnly} onPress={() => setDueOnly(!dueOnly)} />
        </View>
        <View style={styles.wrap}>
          {categories.map((item) => (
            <ChoiceChip key={item} label={item.replace('_', ' ')} selected={category === item}
              onPress={() => setCategory(category === item ? undefined : item)} />
          ))}
        </View>
      </Panel>
      {error ? <Text accessibilityLiveRegion="polite" style={commonStyles.body}>{error}</Text> : null}
      {!loops.length ? <EmptyState title="No matching loops"
        body="Questioner has not found an unresolved record matching these filters." /> :
        loops.map((loop) => <Link key={loop.id}
          href={{ pathname: '/loop/[id]', params: { id: loop.id } }}>
          <Panel>
            <Text style={commonStyles.meta}>
              {loop.category.replace('_', ' ').toUpperCase()} · {loop.priority}
            </Text>
            <Text style={commonStyles.label}>{loop.question}</Text>
            <Text style={commonStyles.body}>
              {loop.status}{loop.dueAt ? ` · due ${new Date(loop.dueAt).toLocaleDateString()}` : ''}
              {loop.reminderReady ? ' · reminder ready' : ''}
            </Text>
          </Panel>
        </Link>)}
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
