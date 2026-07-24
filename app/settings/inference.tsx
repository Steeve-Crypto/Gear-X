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
  const [transcriptionEndpoint, setTranscriptionEndpoint] = useState(settings.transcriptionEndpoint);
  const [result, setResult] = useState('');
  const save = async () => {
    const patch = {
      ollamaEndpoint: endpoint.trim(),
      ollamaModel: model.trim(),
      transcriptionEndpoint: transcriptionEndpoint.trim(),
    };
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
        <Text style={commonStyles.label}>Transcription provider</Text>
        <ActionButton
          label={settings.transcriptionProvider === 'device-adapter' ? 'On-device adapter · selected' : 'Use on-device adapter'}
          onPress={async () => {
            settings.update({ transcriptionProvider: 'device-adapter' });
            await settingsRepository.save({ transcriptionProvider: 'device-adapter' });
          }}
        />
        <ActionButton
          label={settings.transcriptionProvider === 'local-whisper-server' ? 'Local Whisper server · selected' : 'Use local Whisper server'}
          onPress={async () => {
            settings.update({ transcriptionProvider: 'local-whisper-server' });
            await settingsRepository.save({ transcriptionProvider: 'local-whisper-server' });
          }}
        />
        <Field value={transcriptionEndpoint} onChangeText={setTranscriptionEndpoint}
          autoCapitalize="none" autoCorrect={false} accessibilityLabel="Transcription endpoint" />
        <Text style={commonStyles.body}>
          Audio recording works in Expo. The native adapter reports unavailable until a Whisper-compatible module is added. A local-network Whisper server is a real transcription path, but sending audio off-device still requires remote-processing consent.
        </Text>
      </Panel>
      {result ? <Text accessibilityLiveRegion="polite" style={commonStyles.body}>{result}</Text> : null}
    </Screen>
  );
}
