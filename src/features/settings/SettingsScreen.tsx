import { Link } from 'expo-router';
import { Pressable, Switch, Text, View } from 'react-native';
import { Panel, Screen, commonStyles } from '../../components/primitives';
import { colors } from '../../design/tokens';
import { settingsRepository } from '../../repositories/settingsRepository';
import { useSettingsStore } from '../../state/settingsStore';
import { AppSettings } from '../../domain/models';

export default function SettingsScreen() {
  const settings = useSettingsStore();
  const change = async (patch: Partial<AppSettings>) => {
    settings.update(patch);
    await settingsRepository.save(patch);
  };
  return (
    <Screen title="Settings" eyebrow="MACHINE PARAMETERS">
      <Panel>
        <SettingSwitch label="Reduced motion" value={settings.reducedMotion}
          onChange={(value) => change({ reducedMotion: value })} />
        <SettingSwitch label="Low-performance mode" value={settings.lowPerformanceMode}
          onChange={(value) => change({ lowPerformanceMode: value })} />
        <SettingSwitch label="Automatic summaries" value={settings.autoSummarize}
          onChange={(value) => change({ autoSummarize: value })} />
        <SettingSwitch label="Automatic questions" value={settings.autoQuestion}
          onChange={(value) => change({ autoQuestion: value })} />
      </Panel>
      <SettingsLink href="/settings/inference" title="AI & transcription" body="Privacy mode, device speech, cloud fallback, and developer providers" />
      <SettingsLink href="/settings/privacy" title="Privacy & data" body="Consent, retention, export, and deletion" />
      <SettingsLink href="/settings/diagnostics" title="Diagnostics" body="Database health, counts, providers, and recent errors" />
    </Screen>
  );
}

function SettingSwitch({ label, value, onChange }: { label: string; value: boolean; onChange: (value: boolean) => void }) {
  return <View style={commonStyles.spread}>
    <Text style={commonStyles.label}>{label}</Text>
    <Switch accessibilityLabel={label} value={value} onValueChange={onChange}
      trackColor={{ false: colors.border, true: colors.brass }} thumbColor={colors.ivory} />
  </View>;
}

function SettingsLink({ href, title, body }: { href: '/settings/inference' | '/settings/privacy' | '/settings/diagnostics'; title: string; body: string }) {
  return <Link href={href} asChild><Pressable accessibilityRole="link"><Panel>
    <Text style={commonStyles.label}>{title}</Text>
    <Text style={commonStyles.body}>{body}</Text>
  </Panel></Pressable></Link>;
}
