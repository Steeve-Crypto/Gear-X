import { AppSettings } from '../domain/models';
import { getDatabaseVersion } from '../infrastructure/database';
import { latestSchemaVersion } from '../infrastructure/database/migrations';
import { knowledgeRepository } from '../repositories/knowledgeRepository';
import { runRepository } from '../repositories/runRepository';
import { usageRepository } from '../repositories/usageRepository';
import {
  configuredBackendUrl,
  createInferenceProvider,
  createTranscriptionProvider,
} from './providerFactory';

export interface DiagnosticsSnapshot {
  databaseVersion: number;
  latestSchemaVersion: number;
  counts: Record<string, number>;
  approximateExportBytes: number;
  cloudUsesToday: number;
  recentAgentRuns: Record<string, unknown>[];
  recentProviderRuns: Record<string, unknown>[];
  transcriptionAvailable: boolean;
  inferenceAvailable: boolean;
  backendConfigured: boolean;
  developerEndpoint: string | null;
}

const unavailable = <T>(fallback: T) => (_cause: unknown): T => fallback;

export async function collectDiagnostics(settings: AppSettings): Promise<DiagnosticsSnapshot> {
  const transcription = createTranscriptionProvider(settings);
  const inference = createInferenceProvider(settings);
  const [
    databaseVersion,
    counts,
    exported,
    cloudUsesToday,
    recentAgentRuns,
    recentProviderRuns,
    transcriptionAvailable,
    inferenceAvailable,
  ] = await Promise.all([
    getDatabaseVersion().catch(unavailable(-1)),
    knowledgeRepository.counts().catch(unavailable({})),
    knowledgeRepository.exportAll().catch(unavailable({})),
    usageRepository.todayCount().catch(unavailable(0)),
    runRepository.recentAgentRuns().catch(unavailable([])),
    runRepository.recentProviderRuns().catch(unavailable([])),
    transcription.isAvailable().catch(unavailable(false)),
    inference.isAvailable().catch(unavailable(false)),
  ]);
  const endpoint = configuredBackendUrl();
  return {
    databaseVersion,
    latestSchemaVersion,
    counts,
    approximateExportBytes: JSON.stringify(exported).length * 2,
    cloudUsesToday,
    recentAgentRuns,
    recentProviderRuns,
    transcriptionAvailable,
    inferenceAvailable,
    backendConfigured: Boolean(endpoint),
    developerEndpoint: settings.processingMode === 'developer'
      ? redactEndpoint(settings.ollamaEndpoint)
      : null,
  };
}

function redactEndpoint(value: string): string {
  try {
    const endpoint = new URL(value);
    endpoint.username = '';
    endpoint.password = '';
    endpoint.search = '';
    endpoint.hash = '';
    return endpoint.toString().replace(/\/$/, '');
  } catch {
    return 'Invalid developer endpoint';
  }
}
