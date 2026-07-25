import { AppSettings } from '../domain/models';
import { GearXError } from '../domain/errors';
import { OllamaProvider } from '../infrastructure/inference/ollama';
import { InferenceProvider } from '../infrastructure/inference/types';
import {
  DeviceTranscriptionAdapter,
  LocalWhisperServerProvider,
} from '../infrastructure/transcription/providers';
import { TranscriptionProvider } from '../infrastructure/transcription/types';

export function createTranscriptionProvider(
  settings: AppSettings,
): TranscriptionProvider {
  if (settings.transcriptionProvider === 'local-whisper-server') {
    return new LocalWhisperServerProvider(
      settings.transcriptionEndpoint,
      () => settings.remoteProcessingConsent,
    );
  }
  return new DeviceTranscriptionAdapter();
}

export function createInferenceProvider(settings: AppSettings): InferenceProvider {
  if (settings.processingMode === 'local') {
    return new OllamaProvider(settings.ollamaEndpoint, settings.ollamaModel);
  }
  return {
    id: 'remote-unconfigured',
    name: 'Remote inference (not configured)',
    remote: true,
    isAvailable: async () => false,
    generate: async () => {
      if (!settings.remoteProcessingConsent) {
        throw new GearXError('REMOTE_CONSENT_MISSING', 'Remote inference consent is required.');
      }
      throw new GearXError(
        'PROVIDER_UNAVAILABLE',
        'A secure backend session is required for remote inference.',
      );
    },
  };
}
