import { AppSettings } from '../domain/models';
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
