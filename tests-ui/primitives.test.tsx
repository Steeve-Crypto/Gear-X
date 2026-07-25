import { fireEvent, render, screen } from '@testing-library/react-native';
import { ActionButton, ChoiceChip, EmptyState } from '../src/components/primitives';

describe('shared mobile controls', () => {
  test('choice chip exposes selected state and responds to press', () => {
    const onPress = jest.fn();
    render(<ChoiceChip label="decision" selected onPress={onPress} />);

    const chip = screen.getByRole('button', { name: 'decision' });
    expect(chip.props.accessibilityState).toEqual({ selected: true });
    fireEvent.press(chip);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  test('disabled actions and empty states remain legible', () => {
    const onPress = jest.fn();
    render(<>
      <ActionButton label="Generate summary" disabled onPress={onPress} />
      <EmptyState title="No summaries yet" body="Two sources are required." />
    </>);

    expect(screen.getByRole('button', { name: 'Generate summary' }).props.accessibilityState)
      .toEqual(expect.objectContaining({ disabled: true }));
    expect(screen.getByText('No summaries yet')).toBeTruthy();
    expect(screen.getByText('Two sources are required.')).toBeTruthy();
  });
});
