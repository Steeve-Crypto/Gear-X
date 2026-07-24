import { useState } from 'react';
import { Text } from 'react-native';
import { router } from 'expo-router';
import { ActionButton, Panel, Screen, commonStyles } from '../../src/components/primitives';
import { settingsRepository } from '../../src/repositories/settingsRepository';
import { useSettingsStore } from '../../src/state/settingsStore';

const pages = [
  {
    title: 'A machine for memory',
    body: 'Gear X records bounded sessions, turns provider-produced transcripts into structured insights, connects related ideas, and surfaces open questions.',
  },
  {
    title: 'Local by default',
    body: 'Knowledge is stored in an on-device SQLite database. It is protected by the app sandbox, but Gear X does not currently add database-level encryption.',
  },
  {
    title: 'You control the boundary',
    body: 'Microphone access is requested when you start listening. Remote processing remains off until you explicitly enable it. You can export or delete your data in Privacy settings.',
  },
];

export default function OnboardingScreen() {
  const [page, setPage] = useState(0);
  const update = useSettingsStore((state) => state.update);
  const finish = async () => {
    await settingsRepository.save({ onboardingComplete: true });
    update({ onboardingComplete: true });
    router.replace('/(tabs)/orbit');
  };
  return (
    <Screen title={pages[page].title} eyebrow={`GEAR X · ${page + 1} OF ${pages.length}`}>
      <Panel><Text style={commonStyles.body}>{pages[page].body}</Text></Panel>
      <ActionButton
        label={page === pages.length - 1 ? 'Enter Orbit' : 'Continue'}
        onPress={() => page === pages.length - 1 ? finish() : setPage((value) => value + 1)}
      />
    </Screen>
  );
}
