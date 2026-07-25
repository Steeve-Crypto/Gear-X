import { render } from '@testing-library/react-native';
import { Ellipse, Path } from 'react-native-svg';
import { GearClock } from '../src/components/GearClock';

describe('GearClock', () => {
  test('renders a layered 3D chassis and extruded gears', () => {
    const view = render(
      <GearClock
        isListening
        insightCount={6}
        activeAgents={['listener', 'extractor', 'archivist']}
      />,
    );

    expect(view.getByTestId('gear-clock-3d')).toBeTruthy();
    expect(view.UNSAFE_getAllByType(Ellipse).length).toBeGreaterThanOrEqual(3);
    expect(view.UNSAFE_getAllByType(Path).length).toBeGreaterThanOrEqual(8);
  });

  test('retains its 3D structure with motion reduced', () => {
    const view = render(
      <GearClock
        isListening={false}
        insightCount={0}
        reducedMotion
        lowPerformanceMode
      />,
    );

    expect(view.UNSAFE_getAllByType(Ellipse).length).toBeGreaterThanOrEqual(3);
  });
});
