import { useState } from 'react';
import { Text } from 'react-native';
import { ActionButton, Field, Panel, Screen, commonStyles } from '../../src/components/primitives';
import { OllamaProvider } from '../../src/infrastructure/inference/ollama';
import { settingsRepository } from '../../src/repositories/settingsRepository';
import { useSettingsStore } from '../../src/state/settingsStore';

export default function InferenceScreen() {
  const settings = useSettingsStore();
  const [endpoint, setEndpoint] = useState(settings.ollamaEndpoint);
  const [model, setModel] = useState(settings.ollamaModel);
  const [result, setResult] = useState('');
  const save = async () => {
    const patch = { ollamaEndpoint: endpoint.trim(), ollamaModel: model.trim() };
    settings.update(patch);
    await settingsRepository.save(patch);
    setResult('Local inference settings saved.');
  };
  const test = async () => {
    setResult('Testing local model…');
    const provider = new OllamaProvider(endpoint.trim(), model.trim(), 5_000);
    setResult(await provider.isAvailable() ? 'Ollama and model are available.' : 'Endpoint or model is unavailable.');
  };
  return (
    <Screen title="Inference" eyebrow="LOCAL-FIRST PROVIDERS">
      <Panel>
        <Text style={commonStyles.label}>Ollama endpoint</Text>
        <Field value={endpoint} onChangeText={setEndpoint} autoCapitalize="none" autoCorrect={false} />
        <Text style={commonStyles.label}>Model</Text>
        <Field value={model} onChangeText={setModel} autoCapitalize="none" autoCorrect={false} />
        <ActionButton label="Save local provider" onPress={save} />
        <ActionButton label="Test connection" onPress={test} />
      </Panel>
      <Panel>
        <Text style={commonStyles.label}>Transcription: device adapter</Text>
        <Text style={commonStyles.body}>
          Audio recording works in Expo. Reliable offline speech-to-text requires a native Whisper-compatible module and is reported unavailable until configured; Gear X does not fabricate transcripts.
        </Text>
      </Panel>
      {result ? <Text accessibilityLiveRegion="polite" style={commonStyles.body}>{result}</Text> : null}
    </Screen>
  );
}
