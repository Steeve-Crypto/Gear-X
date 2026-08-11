import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import PrivacyScreen from '../src/features/settings/PrivacyScreen';
import { clearAllData } from '../src/services/database';
import { knowledgeRepository } from '../src/repositories/knowledgeRepository';
import { settingsRepository } from '../src/repositories/settingsRepository';

const mockUpdate = jest.fn();
jest.mock('../src/state/settingsStore', () => ({
  useSettingsStore: () => ({
    remoteProcessingConsent: false,
    retainRecordings: false,
    dataRetentionDays: 0,
    update: mockUpdate,
  }),
}));
jest.mock('../src/services/database', () => ({ clearAllData: jest.fn() }));
jest.mock('../src/repositories/knowledgeRepository', () => ({
  knowledgeRepository: { exportAll: jest.fn(), applyRetention: jest.fn() },
}));
jest.mock('../src/repositories/settingsRepository', () => ({
  settingsRepository: { save: jest.fn() },
}));
jest.mock('../src/services/exportShare', () => ({ shareJsonExport: jest.fn() }));

describe('<PrivacyScreen />', () => {
  test('persists remote consent explicitly', async () => {
    jest.mocked(settingsRepository.save).mockResolvedValue(undefined);
    render(<PrivacyScreen />);

    fireEvent(screen.getByRole('switch', { name: 'Allow remote processing' }), 'valueChange', true);

    await waitFor(() => expect(settingsRepository.save).toHaveBeenCalledWith({
      remoteProcessingConsent: true,
    }));
    expect(mockUpdate).toHaveBeenCalledWith({ remoteProcessingConsent: true });
  });

  test('requires destructive confirmation before deleting all data', async () => {
    jest.mocked(clearAllData).mockResolvedValue(undefined);
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    render(<PrivacyScreen />);

    fireEvent.press(screen.getByRole('button', { name: 'Delete all data' }));
    expect(clearAllData).not.toHaveBeenCalled();
    const actions = alert.mock.calls[0][2];
    const deleteAction = actions?.find((action) => action.text === 'Delete all');
    await act(async () => { await deleteAction?.onPress?.(); });

    expect(clearAllData).toHaveBeenCalledTimes(1);
  });

  test('prepares a readable versioned export', async () => {
    jest.mocked(knowledgeRepository.exportAll).mockResolvedValue({
      format: 'gear-x-export',
      version: 1,
      sessions: [],
    });
    render(<PrivacyScreen />);

    fireEvent.press(screen.getByRole('button', { name: 'Prepare JSON export' }));

    expect(await screen.findByText('SELECTABLE JSON EXPORT')).toBeTruthy();
    expect(screen.getByText(/"format": "gear-x-export"/)).toBeTruthy();
  });
});
