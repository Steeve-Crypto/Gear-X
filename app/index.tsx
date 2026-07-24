import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { colors } from '../src/design/tokens';
import { useSettingsStore } from '../src/state/settingsStore';

export default function Index() {
  const hydrated = useSettingsStore((state) => state.hydrated);
  const onboardingComplete = useSettingsStore((state) => state.onboardingComplete);
  if (!hydrated) {
    return <View style={{ flex: 1, backgroundColor: colors.obsidian, justifyContent: 'center' }}>
      <ActivityIndicator color={colors.brass} />
    </View>;
  }
  return <Redirect href={onboardingComplete ? '/(tabs)/orbit' : '/onboarding'} />;
}
