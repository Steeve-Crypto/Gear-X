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
  processingMode: 'local',
  ollamaEndpoint: 'http://localhost:11434',
  ollamaModel: 'qwen2.5:3b',
  transcriptionProvider: 'device-adapter',
  voiceProvider: 'none',
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
