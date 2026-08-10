import { useState } from 'react';
import { Switch, Text, View } from 'react-native';
import { ActionButton, ChoiceChip, Field, Panel, Screen, commonStyles } from '../../components/primitives';
import { OllamaProvider } from '../../infrastructure/inference/ollama';
import { settingsRepository } from '../../repositories/settingsRepository';
import { useSettingsStore } from '../../state/settingsStore';
import { ProcessingMode } from '../../domain/models';
import { createInferenceProvider, createTranscriptionProvider } from '../../services/providerFactory';

const modes: { id: ProcessingMode; label: string; description: string }[] = [
  { id: 'private', label: 'Private', description: 'On-device speech and local deterministic intelligence only.' },
  { id: 'balanced', label: 'Balanced', description: 'Local first, with consented cloud fallback when configured.' },
  { id: 'quality', label: 'Quality', description: 'Prefer consented cloud quality, then fall back on-device.' },
  { id: 'developer', label: 'Developer', description: 'Enable Ollama and custom local endpoints.' },
];

export default function InferenceScreen() {
  const settings = useSettingsStore();
  const [endpoint, setEndpoint] = useState(settings.ollamaEndpoint);
  const [model, setModel] = useState(settings.ollamaModel);
  const [transcriptionEndpoint, setTranscriptionEndpoint] = useState(settings.transcriptionEndpoint);
  const [result, setResult] = useState('');
  const [dailyLimit, setDailyLimit] = useState(String(settings.dailyCloudRequestLimit));
  const save = async () => {
    const patch = {
      ollamaEndpoint: endpoint.trim(),
      ollamaModel: model.trim(),
      transcriptionEndpoint: transcriptionEndpoint.trim(),
    };
    settings.update(patch);
    await settingsRepository.save(patch);
    setResult('Developer provider settings saved.');
  };
  const test = async () => {
    setResult('Testing local model…');
    const provider = new OllamaProvider(endpoint.trim(), model.trim(), 5_000);
    setResult(await provider.isAvailable() ? 'Ollama and model are available.' : 'Endpoint or model is unavailable.');
  };
  return (
    <Screen title="Inference" eyebrow="LOCAL-FIRST PROVIDERS">
      <Panel>
        <Text style={commonStyles.label}>Processing mode</Text>
        <View style={commonStyles.row}>
          {modes.map((mode) => (
            <ChoiceChip key={mode.id} label={mode.label}
              selected={settings.processingMode === mode.id}
              onPress={async () => {
                if (mode.id === 'quality' && !settings.remoteProcessingConsent) {
                  setResult('Enable remote-processing consent in Privacy before selecting remote mode.');
                  return;
                }
                settings.update({ processingMode: mode.id });
                await settingsRepository.save({ processingMode: mode.id });
                setResult(mode.description);
              }} />
          ))}
        </View>
        <Text style={commonStyles.body}>
          {modes.find((mode) => mode.id === settings.processingMode)?.description}
        </Text>
      </Panel>
      <Panel>
        <Text style={commonStyles.meta}>CLOUD COST CONTROLS</Text>
        <View style={commonStyles.spread}>
          <Text style={commonStyles.label}>Transcription fallback</Text>
          <Switch value={settings.cloudTranscriptionEnabled} onValueChange={async (value) => {
            settings.update({ cloudTranscriptionEnabled: value });
            await settingsRepository.save({ cloudTranscriptionEnabled: value });
          }} />
        </View>
        <View style={commonStyles.spread}>
          <Text style={commonStyles.label}>Intelligence refinement</Text>
          <Switch value={settings.cloudIntelligenceEnabled} onValueChange={async (value) => {
            settings.update({ cloudIntelligenceEnabled: value });
            await settingsRepository.save({ cloudIntelligenceEnabled: value });
          }} />
        </View>
        <Text style={commonStyles.label}>Daily cloud request limit</Text>
        <Field value={dailyLimit} onChangeText={setDailyLimit} keyboardType="number-pad"
          accessibilityLabel="Daily cloud request limit" />
        <ActionButton label="Save cloud limit" onPress={async () => {
          const value = Math.max(0, Math.min(500, Number.parseInt(dailyLimit, 10) || 0));
          settings.update({ dailyCloudRequestLimit: value });
          await settingsRepository.save({ dailyCloudRequestLimit: value });
          setDailyLimit(String(value));
          setResult(value ? `Cloud requests limited to ${value} per day.` : 'Cloud processing disabled by a zero request limit.');
        }} />
        <Text style={commonStyles.body}>
          These controls never override remote-processing consent. Usage records contain only provider, capability, and time.
        </Text>
      </Panel>
      <Panel>
        <Text style={commonStyles.label}>Runtime availability</Text>
        <ActionButton label="Check providers" onPress={async () => {
          setResult('Checking device and configured providersâ€¦');
          const transcription = createTranscriptionProvider(settings);
          const inference = createInferenceProvider(settings);
          const [speechReady, modelReady] = await Promise.all([
            transcription.isAvailable(), inference.isAvailable(),
          ]);
          setResult(`Speech: ${speechReady ? 'available' : 'unavailable'} Â· Optional model: ${modelReady ? 'available' : 'local rules active'}`);
        }} />
        <Text style={commonStyles.body}>
          Gear X always keeps local rules and vault retrieval available. Device speech needs a native development or store build and installed language support.
        </Text>
      </Panel>
      {settings.processingMode === 'developer' ? <>
      <Panel>
        <Text style={commonStyles.meta}>DEVELOPER PROVIDERS</Text>
        <Text style={commonStyles.label}>Ollama endpoint</Text>
        <Field value={endpoint} onChangeText={setEndpoint} autoCapitalize="none" autoCorrect={false} />
        <Text style={commonStyles.label}>Model</Text>
        <Field value={model} onChangeText={setModel} autoCapitalize="none" autoCorrect={false} />
        <ActionButton label="Save developer provider" onPress={save} />
        <ActionButton label="Test Ollama" onPress={test} />
      </Panel>
      <Panel>
        <Text style={commonStyles.label}>Voice provider</Text>
        <View style={commonStyles.row}>
          {(['none', 'grok-voice'] as const).map((voiceProvider) => (
            <ChoiceChip key={voiceProvider} label={voiceProvider}
              selected={settings.voiceProvider === voiceProvider}
              onPress={async () => {
                settings.update({ voiceProvider });
                await settingsRepository.save({ voiceProvider });
              }} />
          ))}
        </View>
        <Text style={commonStyles.body}>
          Voice is disabled by default. Grok Voice requires remote-processing consent and a short-lived backend token; no provider secret is stored in the app.
        </Text>
      </Panel>
      <Panel>
        <Text style={commonStyles.label}>Transcription provider</Text>
        <ActionButton
          label={settings.transcriptionProvider === 'automatic' ? 'Automatic · selected' : 'Use automatic routing'}
          onPress={async () => {
            settings.update({ transcriptionProvider: 'automatic' });
            await settingsRepository.save({ transcriptionProvider: 'automatic' });
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
          Native OS speech is the consumer default. The local Whisper server is an optional developer fallback, and sending audio off-device still requires consent.
        </Text>
      </Panel>
      </> : null}
      {result ? <Text accessibilityLiveRegion="polite" style={commonStyles.body}>{result}</Text> : null}
    </Screen>
  );
}
