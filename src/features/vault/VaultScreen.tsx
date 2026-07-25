import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import {
  ActionButton,
  ChoiceChip,
  EmptyState,
  Field,
  Panel,
  Screen,
  commonStyles,
} from '../../components/primitives';
import { colors } from '../../design/tokens';
import { VaultInsight } from '../../domain/models';
import { knowledgeRepository } from '../../repositories/knowledgeRepository';

const types: VaultInsight['type'][] = ['fact', 'decision', 'action', 'entity', 'deadline', 'open_loop'];

export default function VaultScreen() {
  const [search, setSearch] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [type, setType] = useState<VaultInsight['type']>();
  const [unresolved, setUnresolved] = useState<boolean>();
  const [includeArchived, setIncludeArchived] = useState(false);
  const [minConfidence, setMinConfidence] = useState(0);
  const [days, setDays] = useState(0);
  const [limit, setLimit] = useState(30);
  const [items, setItems] = useState<VaultInsight[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState('');
  const query = useMemo(() => ({
    search,
    sessionId: sessionId.trim() || undefined,
    type,
    unresolved,
    includeArchived,
    minConfidence: minConfidence || undefined,
    createdAfter: days ? Date.now() - days * 86_400_000 : undefined,
    limit,
  }), [days, includeArchived, limit, minConfidence, search, sessionId, type, unresolved]);
  const load = useCallback(() => {
    setError('');
    knowledgeRepository.insights(query)
      .then(setItems)
      .catch(() => setError('The vault could not be loaded.'));
  }, [query]);
  useFocusEffect(load);
  useEffect(() => {
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
  }, [load]);

  const toggleSelected = (id: string) => {
    setSelected((current) => current.includes(id)
      ? current.filter((item) => item !== id)
      : [...current, id]);
  };
  const archiveSelected = async () => {
    await knowledgeRepository.bulkUpdateInsights(selected, { archived: true });
    setSelected([]);
    load();
  };
  const deleteSelected = () => Alert.alert(
    'Delete selected insights?',
    `${selected.length} insight record(s) and their relationship links will be removed.`,
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await knowledgeRepository.bulkRemoveInsights(selected);
          setSelected([]);
          load();
        },
      },
    ],
  );

  return (
    <Screen title="Vault" eyebrow="LONG-TERM MEMORY">
      <Field
        placeholder="Search insights"
        value={search}
        onChangeText={(value) => { setSearch(value); setLimit(30); }}
        returnKeyType="search"
      />
      <Panel>
        <Text style={commonStyles.meta}>FILTERS</Text>
        <View style={styles.wrap}>
          {types.map((item) => (
            <ChoiceChip
              key={item}
              label={item.replace('_', ' ')}
              selected={type === item}
              onPress={() => setType(type === item ? undefined : item)}
            />
          ))}
        </View>
        <View style={styles.wrap}>
          <ChoiceChip label="Unresolved" selected={unresolved === true}
            onPress={() => setUnresolved(unresolved === true ? undefined : true)} />
          <ChoiceChip label="Archived" selected={includeArchived}
            onPress={() => setIncludeArchived(!includeArchived)} />
          {[0, 7, 30].map((value) => (
            <ChoiceChip key={value} label={value ? `${value} days` : 'Any date'}
              selected={days === value} onPress={() => setDays(value)} />
          ))}
        </View>
        <View style={styles.wrap}>
          {[0, 0.5, 0.75].map((value) => (
            <ChoiceChip key={value} label={value ? `${value * 100}%+` : 'Any confidence'}
              selected={minConfidence === value} onPress={() => setMinConfidence(value)} />
          ))}
        </View>
        <Field placeholder="Filter by source session ID" value={sessionId} onChangeText={setSessionId}
          autoCapitalize="none" autoCorrect={false} />
      </Panel>
      {selected.length ? <Panel>
        <Text accessibilityLiveRegion="polite" style={commonStyles.label}>
          {selected.length} selected
        </Text>
        <ActionButton label="Archive selected" onPress={archiveSelected} />
        <ActionButton label="Delete selected" onPress={deleteSelected} destructive />
        <ActionButton label="Clear selection" onPress={() => setSelected([])} />
      </Panel> : null}
      {error ? <Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text> : null}
      {!items.length ? <EmptyState title="The vault is quiet" body={
        search ? 'No stored insight matches this search.' : 'Completed sessions will leave durable insights here.'
      } /> : items.map((item) => (
        <Pressable
          key={item.id}
          accessibilityRole="button"
          accessibilityLabel={`Select or open ${item.content}`}
          accessibilityState={{ selected: selected.includes(item.id) }}
          onLongPress={() => toggleSelected(item.id)}
          onPress={() => selected.length ? toggleSelected(item.id) : router.push({
            pathname: '/insight/[id]',
            params: { id: item.id },
          })}
        >
          <Panel>
            <View style={commonStyles.spread}>
              <Text style={styles.type}>{item.type.replace('_', ' ')}</Text>
              <Text style={commonStyles.meta}>{Math.round(item.confidence * 100)}%</Text>
            </View>
            <HighlightedText text={item.content} search={search} />
            <Text style={commonStyles.meta}>
              {selected.includes(item.id) ? 'SELECTED · ' : ''}
              {item.pinned ? 'Pinned · ' : ''}
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </Panel>
        </Pressable>
      ))}
      {items.length === limit ? <ActionButton label="Load more" onPress={() => setLimit(limit + 30)} /> : null}
    </Screen>
  );
}

function HighlightedText({ text, search }: { text: string; search: string }) {
  const term = search.trim();
  if (!term) return <Text style={commonStyles.label}>{text}</Text>;
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'ig'));
  return <Text style={commonStyles.label}>{parts.map((part, index) => (
    <Text key={`${part}-${index}`} style={part.toLowerCase() === term.toLowerCase() ? styles.highlight : undefined}>
      {part}
    </Text>
  ))}</Text>;
}

const styles = StyleSheet.create({
  error: { color: colors.danger },
  type: { color: colors.brass, fontSize: 11, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase' },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  highlight: { color: colors.obsidian, backgroundColor: colors.brassBright },
});
