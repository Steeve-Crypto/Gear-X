import { defaultSettings, useSettingsStore } from '../src/state/settingsStore';

describe('settings state selectors', () => {
  beforeEach(() => {
    useSettingsStore.setState({ ...defaultSettings, hydrated: false });
  });

  test('hydrates persisted values without replacing safe defaults', () => {
    useSettingsStore.getState().hydrate({ reducedMotion: true, dataRetentionDays: 30 });
    expect(useSettingsStore.getState()).toMatchObject({
      reducedMotion: true,
      dataRetentionDays: 30,
      processingMode: 'local',
      hydrated: true,
    });
  });

  test('updates only the selected ephemeral settings fields', () => {
    const initialEndpoint = useSettingsStore.getState().ollamaEndpoint;
    useSettingsStore.getState().update({ autoQuestion: false });
    expect(useSettingsStore.getState().autoQuestion).toBe(false);
    expect(useSettingsStore.getState().ollamaEndpoint).toBe(initialEndpoint);
  });
});
