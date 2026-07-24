import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Link, useFocusEffect } from 'expo-router';
import { EmptyState, Field, Panel, Screen, commonStyles } from '../../src/components/primitives';
import { colors, spacing } from '../../src/design/tokens';
import { VaultInsight } from '../../src/domain/models';
import { knowledgeRepository } from '../../src/repositories/knowledgeRepository';

export default function VaultScreen() {
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<VaultInsight[]>([]);
  const [error, setError] = useState('');
  const load = useCallback(() => {
    knowledgeRepository.insights({ search, limit: 40 })
      .then(setItems)
      .catch(() => setError('The vault could not be loaded.'));
  }, [search]);
  useFocusEffect(load);
  useEffect(() => {
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
  }, [load]);

  return (
    <Screen title="Vault" eyebrow="LONG-TERM MEMORY">
      <Field
        placeholder="Search insights"
        value={search}
        onChangeText={setSearch}
        returnKeyType="search"
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!items.length ? <EmptyState title="The vault is quiet" body={
        search ? 'No stored insight matches this search.' : 'Completed sessions will leave durable insights here.'
      } /> : items.map((item) => (
        <Link key={item.id} href={{ pathname: '/insight/[id]', params: { id: item.id } }} asChild>
          <Pressable accessibilityRole="button">
            <Panel>
              <View style={commonStyles.spread}>
                <Text style={styles.type}>{item.type.replace('_', ' ')}</Text>
                <Text style={commonStyles.meta}>{Math.round(item.confidence * 100)}%</Text>
              </View>
              <Text style={commonStyles.label}>{item.content}</Text>
              <Text style={commonStyles.meta}>
                {item.pinned ? 'Pinned · ' : ''}{new Date(item.createdAt).toLocaleDateString()}
              </Text>
            </Panel>
          </Pressable>
        </Link>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  error: { color: colors.danger },
  type: { color: colors.brass, fontSize: 11, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase' },
});
