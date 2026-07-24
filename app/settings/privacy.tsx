import { Alert, Switch, Text, View } from 'react-native';
import { useState } from 'react';
import { ActionButton, Field, Panel, Screen, commonStyles } from '../../src/components/primitives';
import { colors } from '../../src/design/tokens';
import { clearAllData } from '../../src/services/database';
import { knowledgeRepository } from '../../src/repositories/knowledgeRepository';
import { settingsRepository } from '../../src/repositories/settingsRepository';
import { useSettingsStore } from '../../src/state/settingsStore';

export default function PrivacyScreen() {
  const settings = useSettingsStore();
  const [exportText, setExportText] = useState('');
  const save = async (patch: Parameters<typeof settings.update>[0]) => {
    settings.update(patch);
    await settingsRepository.save(patch);
  };
  const exportAll = async () => {
    const data = await knowledgeRepository.exportAll();
    setExportText(JSON.stringify(data, null, 2));
  };
  const confirmDelete = () => Alert.alert(
    'Delete all Gear X data?',
    'This removes sessions, transcripts, insights, summaries, threads, and open loops from this device. This cannot be undone.',
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete all', style: 'destructive', onPress: async () => {
        await clearAllData();
        setExportText('');
      } },
    ],
  );
  return (
    <Screen title="Privacy & Data" eyebrow="USER-CONTROLLED BOUNDARY">
      <Panel>
        <Toggle label="Allow remote processing" value={settings.remoteProcessingConsent}
          onChange={(value) => save({ remoteProcessingConsent: value })} />
        <Text style={commonStyles.body}>
          When enabled, configured remote providers may receive the minimum selected audio or text. No remote provider is configured by default.
        </Text>
      </Panel>
      <Panel>
        <Text style={commonStyles.label}>Knowledge retention days</Text>
        <Field
          keyboardType="number-pad"
          value={String(settings.dataRetentionDays)}
          onChangeText={(value) => {
            const days = Math.max(0, Number.parseInt(value || '0', 10) || 0);
            void save({ dataRetentionDays: days }).then(() => knowledgeRepository.applyRetention(days));
          }}
          accessibilityLabel="Knowledge retention days"
        />
        <Text style={commonStyles.body}>Use 0 to retain knowledge until you delete it. Older records are removed when this changes and at app start.</Text>
      </Panel>
      <Panel>
        <Toggle label="Retain recordings" value={settings.retainRecordings}
          onChange={(value) => save({ retainRecordings: value })} />
        <Text style={commonStyles.body}>
          Transcripts and knowledge remain in SQLite. Local SQLite is not application-level encrypted in this beta.
        </Text>
      </Panel>
      <ActionButton label="Prepare JSON export" onPress={exportAll} />
      {exportText ? <Panel>
        <Text style={commonStyles.meta}>SELECTABLE JSON EXPORT</Text>
        <Text selectable style={commonStyles.body}>{exportText}</Text>
      </Panel> : null}
      <ActionButton label="Delete all data" onPress={confirmDelete} destructive />
    </Screen>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (value: boolean) => void }) {
  return <View style={commonStyles.spread}><Text style={commonStyles.label}>{label}</Text>
    <Switch accessibilityLabel={label} value={value} onValueChange={onChange}
      trackColor={{ false: colors.border, true: colors.brass }} thumbColor={colors.ivory} />
  </View>;
}
