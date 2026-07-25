import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import OnboardingScreen from '../app/onboarding';
import { settingsRepository } from '../src/repositories/settingsRepository';

const mockReplace = jest.fn();
jest.mock('expo-router', () => ({ router: { replace: (...args: unknown[]) => mockReplace(...args) } }));
jest.mock('../src/repositories/settingsRepository', () => ({
  settingsRepository: { save: jest.fn().mockResolvedValue(undefined) },
}));

describe('<OnboardingScreen />', () => {
  test('explains privacy and completes persisted onboarding', async () => {
    render(<OnboardingScreen />);
    expect(screen.getByText('A machine for memory')).toBeTruthy();

    fireEvent.press(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByText('Local by default')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByText('You control the boundary')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByText('Local and optional remote')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Enter Orbit' }));

    await waitFor(() => expect(settingsRepository.save).toHaveBeenCalledWith({
      onboardingComplete: true,
    }));
    expect(mockReplace).toHaveBeenCalledWith('/(tabs)/orbit');
  });
});
