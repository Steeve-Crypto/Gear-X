import { AppSettings } from '../domain/models';
import { GearXError } from '../domain/errors';
import { OllamaProvider } from '../infrastructure/inference/ollama';
import { InferenceProvider } from '../infrastructure/inference/types';
import { BackendInferenceProvider } from '../infrastructure/inference/backend';
import { CapabilityInferenceRouter } from '../infrastructure/inference/capabilityRouter';
import {
  BackendTranscriptionProvider,
  DeviceTranscriptionAdapter,
  LocalWhisperServerProvider,
} from '../infrastructure/transcription/providers';
import { TranscriptionProvider } from '../infrastructure/transcription/types';
import { TranscriptionRouter } from '../infrastructure/transcription/router';
import Constants from 'expo-constants';
import { usageRepository } from '../repositories/usageRepository';

export function configuredBackendUrl(): string {
  const value = Constants.expoConfig?.extra?.gearXBackendUrl;
  return typeof value === 'string' ? value.replace(/\/$/, '') : '';
}

async function getBackendSessionToken(baseUrl: string): Promise<string> {
  const response = await fetch(`${baseUrl}/v1/mobile/session`, { method: 'POST' });
  if (!response.ok) throw new GearXError('PROVIDER_UNAVAILABLE', 'Backend session is unavailable.');
  const payload = (await response.json()) as { token?: string };
  if (!payload.token) throw new GearXError('PROVIDER_UNAVAILABLE', 'Backend returned no session token.');
  return payload.token;
}

export function createTranscriptionProvider(
  settings: AppSettings,
): TranscriptionProvider {
  const device = new DeviceTranscriptionAdapter(true);
  const endpoint = configuredBackendUrl();
  const cloud = endpoint && settings.cloudTranscriptionEnabled
    ? new BackendTranscriptionProvider({
      baseUrl: endpoint,
      getAccessToken: () => getBackendSessionToken(endpoint),
      hasRemoteConsent: () => settings.remoteProcessingConsent,
    })
    : null;
  const localWhisper = settings.transcriptionProvider === 'local-whisper-server'
    ? new LocalWhisperServerProvider(
      settings.transcriptionEndpoint,
      () => settings.remoteProcessingConsent,
    )
    : null;
  const usage = {
    reserve: (providerId: string, capability: string) => usageRepository.reserveRemote(
      providerId,
      capability,
      settings.dailyCloudRequestLimit,
    ),
  };
  if (settings.processingMode === 'private') return new TranscriptionRouter([device], usage);
  if (settings.processingMode === 'quality') {
    return new TranscriptionRouter([...(cloud ? [cloud] : []), device], usage);
  }
  if (settings.processingMode === 'developer') {
    return new TranscriptionRouter([device, ...(localWhisper ? [localWhisper] : []), ...(cloud ? [cloud] : [])], usage);
  }
  return new TranscriptionRouter([device, ...(cloud ? [cloud] : [])], usage);
}

export function createInferenceProvider(settings: AppSettings): InferenceProvider {
  const providers: InferenceProvider[] = [];
  const endpoint = configuredBackendUrl();
  const cloudAllowed = endpoint
    && settings.processingMode !== 'private'
    && settings.processingMode !== 'developer'
    && settings.cloudIntelligenceEnabled
    && settings.remoteProcessingConsent;
  if (cloudAllowed) {
    providers.push(new BackendInferenceProvider({
      baseUrl: endpoint,
      getAccessToken: () => getBackendSessionToken(endpoint),
      hasRemoteConsent: () => settings.remoteProcessingConsent,
    }));
  }
  if (settings.processingMode === 'developer') {
    providers.push(new OllamaProvider(settings.ollamaEndpoint, settings.ollamaModel));
  }
  return new CapabilityInferenceRouter(providers, 12_000, {
    reserve: (providerId, capability) => usageRepository.reserveRemote(
      providerId,
      capability,
      settings.dailyCloudRequestLimit,
    ),
  });
}
