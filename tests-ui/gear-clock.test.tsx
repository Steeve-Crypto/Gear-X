import { buildGearProfile } from '../src/components/GearClock';

describe('GearClock', () => {
  test('builds alternating tooth and root radii for extrusion', () => {
    const profile = buildGearProfile(12, 0.8, 1);
    const radii = profile.map(([x, y]) => Math.hypot(x, y));

    expect(profile).toHaveLength(48);
    expect(Math.max(...radii)).toBeCloseTo(1);
    expect(Math.min(...radii)).toBeCloseTo(0.8);
  });

  test('enforces a minimum viable gear tooth count', () => {
    expect(buildGearProfile(2, 0.8, 1)).toHaveLength(24);
  });
});
