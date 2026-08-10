import { collectDiagnostics } from '../src/services/diagnostics';
import { defaultSettings } from '../src/state/settingsStore';
import { getDatabaseVersion } from '../src/infrastructure/database';
import { knowledgeRepository } from '../src/repositories/knowledgeRepository';
import { runRepository } from '../src/repositories/runRepository';
import { usageRepository } from '../src/repositories/usageRepository';
import { configuredBackendUrl, createInferenceProvider, createTranscriptionProvider } from '../src/services/providerFactory';

jest.mock('../src/infrastructure/database', () => ({ getDatabaseVersion: jest.fn() }));
jest.mock('../src/infrastructure/database/migrations', () => ({ latestSchemaVersion: 3 }));
jest.mock('../src/repositories/knowledgeRepository', () => ({
  knowledgeRepository: { counts: jest.fn(), exportAll: jest.fn() },
}));
jest.mock('../src/repositories/runRepository', () => ({
  runRepository: { recentAgentRuns: jest.fn(), recentProviderRuns: jest.fn() },
}));
jest.mock('../src/repositories/usageRepository', () => ({
  usageRepository: { todayCount: jest.fn() },
}));
jest.mock('../src/services/providerFactory', () => ({
  configuredBackendUrl: jest.fn(),
  createInferenceProvider: jest.fn(),
  createTranscriptionProvider: jest.fn(),
}));

describe('collectDiagnostics', () => {
  test('collects schema, provider health, usage, and recent runs', async () => {
    jest.mocked(getDatabaseVersion).mockResolvedValue(3);
    jest.mocked(knowledgeRepository.counts).mockResolvedValue({ sessions: 2 });
    jest.mocked(knowledgeRepository.exportAll).mockResolvedValue({ sessions: [{ id: 's' }] });
    jest.mocked(usageRepository.todayCount).mockResolvedValue(4);
    jest.mocked(runRepository.recentAgentRuns).mockResolvedValue([{ agent_id: 'extractor' }]);
    jest.mocked(runRepository.recentProviderRuns).mockResolvedValue([{ provider_id: 'ollama' }]);
    jest.mocked(configuredBackendUrl).mockReturnValue('https://backend.example');
    jest.mocked(createTranscriptionProvider).mockReturnValue({ isAvailable: jest.fn().mockResolvedValue(true) } as never);
    jest.mocked(createInferenceProvider).mockReturnValue({ isAvailable: jest.fn().mockResolvedValue(false) } as never);

    const result = await collectDiagnostics({
      ...defaultSettings,
      processingMode: 'developer',
      ollamaEndpoint: 'http://user:secret@localhost:11434/?token=hidden',
    });

    expect(result.databaseVersion).toBe(3);
    expect(result.latestSchemaVersion).toBe(3);
    expect(result.transcriptionAvailable).toBe(true);
    expect(result.inferenceAvailable).toBe(false);
    expect(result.backendConfigured).toBe(true);
    expect(result.developerEndpoint).toBe('http://localhost:11434');
    expect(result.recentProviderRuns).toEqual([{ provider_id: 'ollama' }]);
  });

  test('returns safe fallbacks when diagnostics dependencies fail', async () => {
    jest.mocked(getDatabaseVersion).mockRejectedValue(new Error('db'));
    jest.mocked(knowledgeRepository.counts).mockRejectedValue(new Error('db'));
    jest.mocked(knowledgeRepository.exportAll).mockRejectedValue(new Error('db'));
    jest.mocked(usageRepository.todayCount).mockRejectedValue(new Error('db'));
    jest.mocked(runRepository.recentAgentRuns).mockRejectedValue(new Error('db'));
    jest.mocked(runRepository.recentProviderRuns).mockRejectedValue(new Error('db'));
    jest.mocked(configuredBackendUrl).mockReturnValue('');
    jest.mocked(createTranscriptionProvider).mockReturnValue({ isAvailable: jest.fn().mockRejectedValue(new Error('provider')) } as never);
    jest.mocked(createInferenceProvider).mockReturnValue({ isAvailable: jest.fn().mockRejectedValue(new Error('provider')) } as never);

    const result = await collectDiagnostics(defaultSettings);

    expect(result.databaseVersion).toBe(-1);
    expect(result.counts).toEqual({});
    expect(result.recentProviderRuns).toEqual([]);
    expect(result.transcriptionAvailable).toBe(false);
    expect(result.backendConfigured).toBe(false);
  });
});
