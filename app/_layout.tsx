import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { colors } from '../src/design/tokens';
import { useAppBootstrap } from '../src/features/app/useAppBootstrap';

export default function RootLayout() {
  useAppBootstrap();

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{
        headerStyle: { backgroundColor: colors.obsidian },
        headerTintColor: colors.ivory,
        contentStyle: { backgroundColor: colors.obsidian },
      }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding/index" options={{ headerShown: false }} />
        <Stack.Screen name="settings/index" options={{ title: 'Settings' }} />
        <Stack.Screen name="settings/privacy" options={{ title: 'Privacy & Data' }} />
        <Stack.Screen name="settings/inference" options={{ title: 'Inference' }} />
        <Stack.Screen name="settings/diagnostics" options={{ title: 'Diagnostics' }} />
        <Stack.Screen name="session/index" options={{ title: 'Sessions' }} />
        <Stack.Screen name="summaries/index" options={{ title: 'Summaries' }} />
      </Stack>
    </>
  );
}
