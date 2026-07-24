import { Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Screen, commonStyles } from '../../src/components/primitives';
export default function LoopDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Screen title="Open Loop" eyebrow="SOURCE DETAIL"><Text style={commonStyles.body}>Open loop {id ?? ''}</Text></Screen>;
}
