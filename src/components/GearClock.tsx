import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, G, Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';

const AnimatedG = Animated.createAnimatedComponent(G);

interface GearClockProps {
  isListening: boolean;
  insightCount: number;
  onInsightAdded?: () => void;
}

/**
 * GearClock — the hero visualization of Gear X.
 * Multiple interlocking gears spin at different speeds.
 * When listening, they accelerate. New insights add visual complexity over time.
 */
export function GearClock({ isListening, insightCount }: GearClockProps) {
  const rotation1 = useSharedValue(0);
  const rotation2 = useSharedValue(0);
  const rotation3 = useSharedValue(0);
  const pulse = useSharedValue(0);

  useEffect(() => {
    const speed = isListening ? 1 : 0.15;

    rotation1.value = withRepeat(
      withTiming(360, { duration: 8000 / speed, easing: Easing.linear }),
      -1,
      false
    );
    rotation2.value = withRepeat(
      withTiming(-360, { duration: 12000 / speed, easing: Easing.linear }),
      -1,
      false
    );
    rotation3.value = withRepeat(
      withTiming(360, { duration: 18000 / speed, easing: Easing.linear }),
      -1,
      false
    );

    if (isListening) {
      pulse.value = withRepeat(
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    } else {
      pulse.value = withTiming(0, { duration: 600 });
    }
  }, [isListening]);

  const animatedProps1 = useAnimatedProps(() => ({
    transform: [{ rotate: `${rotation1.value}deg` }],
  }));
  const animatedProps2 = useAnimatedProps(() => ({
    transform: [{ rotate: `${rotation2.value}deg` }],
  }));
  const animatedProps3 = useAnimatedProps(() => ({
    transform: [{ rotate: `${rotation3.value}deg` }],
  }));

  // Simple gear path generator (approximate involute teeth)
  const createGearPath = (cx: number, cy: number, outerR: number, innerR: number, teeth: number) => {
    const points: string[] = [];
    const angleStep = (Math.PI * 2) / teeth;

    for (let i = 0; i < teeth; i++) {
      const a1 = i * angleStep;
      const a2 = a1 + angleStep * 0.35;
      const a3 = a1 + angleStep * 0.5;
      const a4 = a1 + angleStep * 0.85;

      const x1 = cx + Math.cos(a1) * outerR;
      const y1 = cy + Math.sin(a1) * outerR;
      const x2 = cx + Math.cos(a2) * outerR;
      const y2 = cy + Math.sin(a2) * outerR;
      const x3 = cx + Math.cos(a3) * innerR;
      const y3 = cy + Math.sin(a3) * innerR;
      const x4 = cx + Math.cos(a4) * innerR;
      const y4 = cy + Math.sin(a4) * innerR;

      if (i === 0) {
        points.push(`M ${x1} ${y1}`);
      }
      points.push(`L ${x2} ${y2} L ${x3} ${y3} L ${x4} ${y4}`);
    }
    points.push('Z');
    return points.join(' ');
  };

  // More teeth appear as insights grow (visual complexity)
  const teeth1 = 12 + Math.min(insightCount, 20);
  const teeth2 = 8 + Math.min(Math.floor(insightCount / 2), 12);
  const teeth3 = 16 + Math.min(Math.floor(insightCount / 3), 16);

  return (
    <View style={styles.container}>
      <Svg width="100%" height="100%" viewBox="0 0 320 320">
        <Defs>
          <LinearGradient id="metal" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#d4c4a8" />
            <Stop offset="50%" stopColor="#8a7a60" />
            <Stop offset="100%" stopColor="#5a4a30" />
          </LinearGradient>
          <LinearGradient id="glow" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#c08040" stopOpacity="0.6" />
            <Stop offset="100%" stopColor="#c08040" stopOpacity="0" />
          </LinearGradient>
        </Defs>

        {/* Background circle */}
        <Circle cx="160" cy="160" r="150" fill="#111" stroke="#2a2a1a" strokeWidth="2" />

        {/* Outer ring */}
        <Circle cx="160" cy="160" r="142" fill="none" stroke="#3a3a2a" strokeWidth="1" />

        {/* Gear 1 - large central */}
        <AnimatedG animatedProps={animatedProps1} origin="160, 160">
          <Path
            d={createGearPath(160, 160, 95, 78, teeth1)}
            fill="url(#metal)"
            stroke="#4a3a20"
            strokeWidth="1.5"
          />
          <Circle cx="160" cy="160" r="28" fill="#1a1a12" stroke="#5a4a30" strokeWidth="2" />
          <Circle cx="160" cy="160" r="8" fill="#c08040" />
        </AnimatedG>

        {/* Gear 2 - upper right */}
        <AnimatedG animatedProps={animatedProps2} origin="230, 90">
          <Path
            d={createGearPath(230, 90, 48, 36, teeth2)}
            fill="url(#metal)"
            stroke="#4a3a20"
            strokeWidth="1.2"
          />
          <Circle cx="230" cy="90" r="12" fill="#1a1a12" stroke="#5a4a30" strokeWidth="1.5" />
        </AnimatedG>

        {/* Gear 3 - lower left */}
        <AnimatedG animatedProps={animatedProps3} origin="85, 220">
          <Path
            d={createGearPath(85, 220, 55, 42, teeth3)}
            fill="url(#metal)"
            stroke="#4a3a20"
            strokeWidth="1.2"
          />
          <Circle cx="85" cy="220" r="14" fill="#1a1a12" stroke="#5a4a30" strokeWidth="1.5" />
        </AnimatedG>

        {/* Listening glow indicator */}
        {isListening && (
          <Circle cx="160" cy="160" r="148" fill="none" stroke="#c08040" strokeWidth="2" opacity="0.4" />
        )}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
