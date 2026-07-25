import { useEffect } from 'react';
import { knowledgeRepository } from '../../repositories/knowledgeRepository';
import { settingsRepository } from '../../repositories/settingsRepository';
import { useSettingsStore } from '../../state/settingsStore';

export function useAppBootstrap(): void {
  const hydrate = useSettingsStore((state) => state.hydrate);
  useEffect(() => {
    settingsRepository.load().then(async (settings) => {
      await knowledgeRepository.applyRetention(settings.dataRetentionDays);
      hydrate(settings);
    }).catch(() => hydrate({}));
  }, [hydrate]);
}
