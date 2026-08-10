import { create } from 'zustand';
import { AppSettings } from '../domain/models';

export const defaultSettings: AppSettings = {
  reducedMotion: false,
  lowPerformanceMode: false,
  onboardingComplete: false,
  remoteProcessingConsent: false,
  retainRecordings: false,
  autoSummarize: true,
  autoQuestion: true,
  processingMode: 'balanced',
  ollamaEndpoint: 'http://localhost:11434',
  ollamaModel: 'qwen2.5:3b',
  transcriptionProvider: 'device-adapter',
  transcriptionEndpoint: 'http://localhost:8080',
  voiceProvider: 'none',
  dataRetentionDays: 0,
  cloudTranscriptionEnabled: true,
  cloudIntelligenceEnabled: true,
  dailyCloudRequestLimit: 25,
};

interface SettingsState extends AppSettings {
  hydrated: boolean;
  hydrate: (settings: Partial<AppSettings>) => void;
  update: (settings: Partial<AppSettings>) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  ...defaultSettings,
  hydrated: false,
  hydrate: (settings) => set({ ...settings, hydrated: true }),
  update: (settings) => set(settings),
}));
