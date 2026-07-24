import * as SQLite from 'expo-sqlite';
import { migrateDatabase } from './migrations';

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function openAppDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!databasePromise) {
    databasePromise = SQLite.openDatabaseAsync('gearx.db').then(async (database) => {
      await migrateDatabase(database);
      return database;
    });
  }
  return databasePromise;
}

export async function getDatabaseVersion(): Promise<number> {
  const database = await openAppDatabase();
  const row = await database.getFirstAsync<{ version: number }>(
    'SELECT MAX(version) AS version FROM schema_migrations',
  );
  return row?.version ?? 0;
}
