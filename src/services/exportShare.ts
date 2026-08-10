import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { GearXError } from '../domain/errors';

export async function shareJsonExport(
  name: string,
  data: Record<string, unknown>,
): Promise<void> {
  if (!(await Sharing.isAvailableAsync())) {
    throw new GearXError('SHARE_UNAVAILABLE', 'Sharing is unavailable on this device.');
  }
  const safeName = name.replace(/[^a-z0-9_-]/gi, '-').toLowerCase();
  const uri = `${FileSystem.cacheDirectory}${safeName}-${Date.now()}.json`;
  await FileSystem.writeAsStringAsync(uri, JSON.stringify(data, null, 2), {
    encoding: FileSystem.EncodingType.UTF8,
  });
  try {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/json',
      dialogTitle: 'Export Gear X data',
      UTI: 'public.json',
    });
  } finally {
    await FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => undefined);
  }
}
