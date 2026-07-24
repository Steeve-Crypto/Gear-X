import { AppSettings } from '../domain/models';
import { openAppDatabase } from '../infrastructure/database';
import { defaultSettings } from '../state/settingsStore';

const allowedKeys = new Set<keyof AppSettings>(Object.keys(defaultSettings) as (keyof AppSettings)[]);

export const settingsRepository = {
  async load(): Promise<AppSettings> {
    const db = await openAppDatabase();
    const rows = await db.getAllAsync<{ key: string; value: string }>('SELECT key, value FROM settings');
    const settings: AppSettings = { ...defaultSettings };
    for (const row of rows) {
      if (!allowedKeys.has(row.key as keyof AppSettings)) continue;
      try {
        Object.assign(settings, { [row.key]: JSON.parse(row.value) });
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
