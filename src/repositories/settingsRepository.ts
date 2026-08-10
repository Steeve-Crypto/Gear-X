import { AppSettings } from '../domain/models';
import { openAppDatabase } from '../infrastructure/database';
import { defaultSettings } from '../state/settingsStore';

const allowedKeys = new Set<keyof AppSettings>(Object.keys(defaultSettings) as (keyof AppSettings)[]);

export function normalizeProcessingMode(value: unknown): AppSettings['processingMode'] | undefined {
  if (value === 'local') return 'private';
  if (value === 'remote') return 'quality';
  if (value === 'private' || value === 'balanced' || value === 'quality' || value === 'developer') {
    return value;
  }
  return undefined;
}

export const settingsRepository = {
  async load(): Promise<AppSettings> {
    const db = await openAppDatabase();
    const rows = await db.getAllAsync<{ key: string; value: string }>('SELECT key, value FROM settings');
    const settings: AppSettings = { ...defaultSettings };
    for (const row of rows) {
      if (!allowedKeys.has(row.key as keyof AppSettings)) continue;
      try {
        const value = JSON.parse(row.value) as unknown;
        if (row.key === 'processingMode') {
          const mode = normalizeProcessingMode(value);
          if (mode) settings.processingMode = mode;
        } else {
          Object.assign(settings, { [row.key]: value });
        }
      } catch {
        // Invalid old settings are ignored in favor of safe local defaults.
      }
    }
    return settings;
  },

  async save(patch: Partial<AppSettings>): Promise<void> {
    const db = await openAppDatabase();
    await db.withTransactionAsync(async () => {
      for (const [key, value] of Object.entries(patch)) {
        if (!allowedKeys.has(key as keyof AppSettings)) continue;
        await db.runAsync(
          `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)
           ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
          [key, JSON.stringify(value), Date.now()],
        );
      }
    });
  },
};
