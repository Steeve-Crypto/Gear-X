import { Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { EmptyState, Screen, commonStyles } from '../../src/components/primitives';
export default function ThreadDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Screen title="Thread" eyebrow="RELATIONSHIP DETAIL"><EmptyState title="Thread relationship" body={`Thread ${id ?? ''} has no linked detail records to display yet.`} /><Text style={commonStyles.meta}>Weaver relationships remain inspectable in SQLite.</Text></Screen>;
}
