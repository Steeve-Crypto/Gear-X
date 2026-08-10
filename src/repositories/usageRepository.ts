import { openAppDatabase } from '../infrastructure/database';
import { createId } from '../utils/id';

function startOfLocalDay(now = Date.now()): number {
  const date = new Date(now);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

export const usageRepository = {
  async reserveRemote(providerId: string, capability: string, dailyLimit: number): Promise<boolean> {
    if (!Number.isFinite(dailyLimit) || dailyLimit <= 0) return false;
    const db = await openAppDatabase();
    let reserved = false;
    await db.withTransactionAsync(async () => {
      const row = await db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) AS count FROM provider_usage WHERE started_at >= ?',
        [startOfLocalDay()],
      );
      if ((row?.count ?? 0) >= Math.floor(dailyLimit)) return;
      await db.runAsync(
        'INSERT INTO provider_usage (id, provider_id, capability, started_at) VALUES (?, ?, ?, ?)',
        [createId('usage'), providerId, capability, Date.now()],
      );
      reserved = true;
    });
    return reserved;
  },

  async todayCount(): Promise<number> {
    const db = await openAppDatabase();
    return (await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) AS count FROM provider_usage WHERE started_at >= ?',
      [startOfLocalDay()],
    ))?.count ?? 0;
  },
};
