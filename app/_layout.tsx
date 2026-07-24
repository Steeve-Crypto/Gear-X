import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { colors } from '../src/design/tokens';
import { settingsRepository } from '../src/repositories/settingsRepository';
import { useSettingsStore } from '../src/state/settingsStore';
import { knowledgeRepository } from '../src/repositories/knowledgeRepository';

export default function RootLayout() {
  const hydrate = useSettingsStore((state) => state.hydrate);
  useEffect(() => {
    settingsRepository.load().then(async (settings) => {
      await knowledgeRepository.applyRetention(settings.dataRetentionDays);
      hydrate(settings);
    }).catch(() => hydrate({}));
  }, [hydrate]);

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
