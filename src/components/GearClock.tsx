import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  Line,
  LinearGradient,
  Path,
  RadialGradient,
  Stop,
} from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withRepeat,
  withTiming,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { AgentId } from '../agents/types';

const AnimatedG = Animated.createAnimatedComponent(G);

interface GearClockProps {
  isListening: boolean;
  insightCount: number;
  activeAgents?: AgentId[];
  reducedMotion?: boolean;
  lowPerformanceMode?: boolean;
}

/**
 * GearClock — Clock Planet visualization
 *
 * A perspective-compressed orbital deck with extruded, orbiting planetary gears.
 * As insights grow, more orbital bodies appear / gain teeth / rings.
 * Feels like a living mechanical solar system / clock planet.
 */
export function GearClock({
  isListening,
  insightCount,
  activeAgents = [],
  reducedMotion = false,
  lowPerformanceMode = false,
}: GearClockProps) {
  // Core spin
  const coreRot = useSharedValue(0);
  // Orbital positions (angles)
  const orbit1 = useSharedValue(0);
  const orbit2 = useSharedValue(0);
  const orbit3 = useSharedValue(0);
  const orbit4 = useSharedValue(0);
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) {
      [coreRot, orbit1, orbit2, orbit3, orbit4, pulse].forEach(cancelAnimation);
      coreRot.value = withTiming(0, { duration: 200 });
      orbit1.value = withTiming(0, { duration: 200 });
      orbit2.value = withTiming(0, { duration: 200 });
      orbit3.value = withTiming(0, { duration: 200 });
      orbit4.value = withTiming(0, { duration: 200 });
      pulse.value = withTiming(isListening ? 0.7 : 0.3, { duration: 200 });
      return;
    }
    const speed = isListening ? 1.4 : 0.25;

    // Core spins slowly
    coreRot.value = withRepeat(
      withTiming(360, { duration: 14000 / speed, easing: Easing.linear }),
      -1,
      false
    );

    // Planets orbit at different speeds (Kepler-ish)
    orbit1.value = withRepeat(
      withTiming(360, { duration: 9000 / speed, easing: Easing.linear }),
      -1,
      false
    );
    orbit2.value = withRepeat(
      withTiming(-360, { duration: 14000 / speed, easing: Easing.linear }),
      -1,
      false
    );
    orbit3.value = withRepeat(
      withTiming(360, { duration: 19000 / speed, easing: Easing.linear }),
      -1,
      false
    );
    orbit4.value = withRepeat(
      withTiming(-360, { duration: 26000 / speed, easing: Easing.linear }),
      -1,
      false
    );

    if (isListening) {
      pulse.value = withRepeat(
        withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    } else {
      pulse.value = withTiming(0.3, { duration: 800 });
    }
    return () => {
      [coreRot, orbit1, orbit2, orbit3, orbit4, pulse].forEach(cancelAnimation);
    };
  }, [coreRot, isListening, orbit1, orbit2, orbit3, orbit4, pulse, reducedMotion]);

  const coreProps = useAnimatedProps(() => ({
    transform: [{ rotate: `${coreRot.value}deg` }],
  }));
  const o1Props = useAnimatedProps(() => ({
    transform: [{ rotate: `${orbit1.value}deg` }],
  }));
  const o2Props = useAnimatedProps(() => ({
    transform: [{ rotate: `${orbit2.value}deg` }],
  }));
  const o3Props = useAnimatedProps(() => ({
    transform: [{ rotate: `${orbit3.value}deg` }],
  }));
  const o4Props = useAnimatedProps(() => ({
    transform: [{ rotate: `${orbit4.value}deg` }],
  }));

  const createGearPath = (cx: number, cy: number, outerR: number, innerR: number, teeth: number) => {
    const points: string[] = [];
    const angleStep = (Math.PI * 2) / teeth;
    for (let i = 0; i < teeth; i++) {
      const a1 = i * angleStep;
      const a2 = a1 + angleStep * 0.32;
      const a3 = a1 + angleStep * 0.5;
      const a4 = a1 + angleStep * 0.82;
      const x1 = cx + Math.cos(a1) * outerR;
      const y1 = cy + Math.sin(a1) * outerR;
      const x2 = cx + Math.cos(a2) * outerR;
      const y2 = cy + Math.sin(a2) * outerR;
      const x3 = cx + Math.cos(a3) * innerR;
      const y3 = cy + Math.sin(a3) * innerR;
      const x4 = cx + Math.cos(a4) * innerR;
      const y4 = cy + Math.sin(a4) * innerR;
      if (i === 0) points.push(`M ${x1} ${y1}`);
      points.push(`L ${x2} ${y2} L ${x3} ${y3} L ${x4} ${y4}`);
    }
    points.push('Z');
    return points.join(' ');
  };

  // Complexity grows with insights (clock-planet evolution)
  const coreTeeth = 14 + Math.min(insightCount, 18);
  const p1Teeth = 8 + Math.min(Math.floor(insightCount / 2), 10);
  const p2Teeth = 10 + Math.min(Math.floor(insightCount / 3), 8);
  const p3Teeth = 7 + Math.min(Math.floor(insightCount / 2), 9);
  const showPlanet4 = !lowPerformanceMode && insightCount >= 4;
  const showRings = !lowPerformanceMode && insightCount >= 2;
  const isProcessing = activeAgents.some((id) => id !== 'listener' && id !== 'visualizer');
  const hasOpenLoops = activeAgents.includes('questioner');
  const extracting = activeAgents.includes('extractor');
  const weaving = activeAgents.includes('weaver');
  const archiving = activeAgents.includes('archivist');
  const retrieving = activeAgents.includes('retriever');
  const summarizing = activeAgents.includes('summarizer');

  return (
    <View style={styles.container} testID="gear-clock-3d" accessible={false}>
      <Svg width="100%" height="100%" viewBox="0 0 320 320">
        <Defs>
          <LinearGradient id="metal" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#e8dcc0" />
            <Stop offset="45%" stopColor="#a09070" />
            <Stop offset="100%" stopColor="#5a4a30" />
          </LinearGradient>
          <LinearGradient id="coreGlow" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#f0a040" stopOpacity="0.9" />
            <Stop offset="100%" stopColor="#c06020" stopOpacity="0.4" />
          </LinearGradient>
          <LinearGradient id="orbitRing" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#6a5a40" stopOpacity="0.3" />
            <Stop offset="50%" stopColor="#c08040" stopOpacity="0.55" />
            <Stop offset="100%" stopColor="#6a5a40" stopOpacity="0.3" />
          </LinearGradient>
          <LinearGradient id="gearEdge" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#6a5a40" />
            <Stop offset="100%" stopColor="#1a1008" />
          </LinearGradient>
          <RadialGradient id="deck" cx="50%" cy="38%" rx="56%" ry="62%">
            <Stop offset="0%" stopColor="#1a1a12" />
            <Stop offset="68%" stopColor="#080808" />
            <Stop offset="100%" stopColor="#1a1008" />
          </RadialGradient>
          <RadialGradient id="hubBevel" cx="38%" cy="30%" rx="70%" ry="70%">
            <Stop offset="0%" stopColor="#e8dcc0" />
            <Stop offset="42%" stopColor="#c08040" />
            <Stop offset="100%" stopColor="#5a4a30" />
          </RadialGradient>
        </Defs>

        {/* The lower ellipses are the clock-planet's visible chassis and side wall. */}
        <Ellipse cx="160" cy="177" rx="155" ry="127" fill="#1a1008" opacity="0.9" />
        <Ellipse cx="160" cy="171" rx="155" ry="127" fill="url(#gearEdge)" stroke="#3a3a2a" strokeWidth="2" />

        {/* A tilted top plane turns the SVG clock face into a mechanical object in perspective. */}
        <G transform="translate(0 20) scale(1 0.86)">
          <Circle cx="160" cy="160" r="155" fill="url(#deck)" stroke="#5a4a30" strokeWidth="2" />
          <Circle cx="160" cy="160" r="149" fill="none" stroke="#a09070" strokeWidth="1" opacity="0.55" />

          {/* Outer clock ticks (hour markers) */}
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = (i * 30 * Math.PI) / 180;
            const x1 = 160 + Math.cos(angle) * 138;
            const y1 = 160 + Math.sin(angle) * 138;
            const x2 = 160 + Math.cos(angle) * 148;
            const y2 = 160 + Math.sin(angle) * 148;
            return (
              <Line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#3a3a2a"
                strokeWidth={i % 3 === 0 ? 2.5 : 1}
              />
            );
          })}

          {/* Orbital rings have darker offset rails beneath their engraved top edges. */}
          {showRings && (
            <>
              <Circle cx="160" cy="166" r="72" fill="none" stroke="#1a1008" strokeWidth="3" opacity="0.75" />
              <Circle cx="160" cy="160" r="72" fill="none" stroke="url(#orbitRing)" strokeWidth="1.2" strokeDasharray="4 6" />
              <Circle cx="160" cy="167" r="105" fill="none" stroke="#1a1008" strokeWidth="3" opacity="0.75" />
              <Circle cx="160" cy="160" r="105" fill="none" stroke="url(#orbitRing)" strokeWidth="1" strokeDasharray="3 8" />
            </>
          )}
          {insightCount >= 6 && (
            <>
              <Circle cx="160" cy="168" r="128" fill="none" stroke="#1a1008" strokeWidth="3" opacity="0.7" />
              <Circle cx="160" cy="160" r="128" fill="none" stroke="#4a3a25" strokeWidth="0.8" strokeDasharray="2 10" />
            </>
          )}

          {isProcessing && (
            <Circle cx="160" cy="160" r="54" fill="none" stroke="#d6a85f" strokeWidth="2" strokeDasharray="2 5" />
          )}
          {hasOpenLoops && (
            <Circle cx="160" cy="34" r="4" fill="#c97063" stroke="#e9e1d2" strokeWidth="1" />
          )}
          {extracting && (
            <Circle cx="160" cy="160" r="48" fill="none" stroke="#d6a85f" strokeWidth="3" strokeDasharray="5 3" />
          )}
          {weaving && (
            <>
              <Line x1="160" y1="160" x2="232" y2="160" stroke="#b88945" strokeWidth="1.5" />
              <Line x1="160" y1="160" x2="92" y2="88" stroke="#b88945" strokeWidth="1" />
            </>
          )}
          {retrieving && (
            <Circle cx="160" cy="160" r="139" fill="none" stroke="#d6a85f" strokeWidth="3" strokeDasharray="22 9" />
          )}
          {summarizing && (
            <>
              <Circle cx="160" cy="160" r="58" fill="none" stroke="#e9e1d2" strokeWidth="1.5" />
              <Circle cx="160" cy="160" r="50" fill="none" stroke="#b88945" strokeWidth="1.5" />
            </>
          )}

          {/* === CENTRAL CORE (Sun / Clock Heart) === */}
          <AnimatedG animatedProps={coreProps} origin="160, 160">
            <Path
              d={createGearPath(160, 168, 42, 30, coreTeeth)}
              fill="url(#gearEdge)"
              stroke="#1a1008"
              strokeWidth="2"
            />
            <Path
              d={createGearPath(160, 160, 42, 30, coreTeeth)}
              fill="url(#metal)"
              stroke="#5a4a28"
              strokeWidth="1.5"
            />
            <Circle cx="160" cy="164" r="20" fill="#1a1008" opacity="0.9" />
            <Circle cx="160" cy="160" r="18" fill="url(#coreGlow)" />
            <Circle cx="160" cy="160" r="13" fill="url(#hubBevel)" opacity="0.6" />
            {archiving && <Circle cx="160" cy="160" r="14" fill="none" stroke="#e9e1d2" strokeWidth="2" />}
            <Circle cx="160" cy="160" r="7" fill="#1a1008" />
            <Circle cx="158" cy="158" r="3" fill="#f0a040" />
          </AnimatedG>

          {/* === PLANET 1 (inner orbit) === */}
          <AnimatedG animatedProps={o1Props} origin="160, 160">
            <Path d={createGearPath(232, 166, 22, 15, p1Teeth)}
              fill="url(#gearEdge)" stroke="#1a1008" strokeWidth="1.5" />
            <Path
              d={createGearPath(232, 160, 22, 15, p1Teeth)}
              fill="url(#metal)"
              stroke="#4a3a20"
              strokeWidth="1"
            />
            <Circle cx="232" cy="163" r="7" fill="#1a1008" />
            <Circle cx="232" cy="160" r="6" fill="url(#hubBevel)" stroke="#6a5a40" strokeWidth="1" />
          </AnimatedG>

          {/* === PLANET 2 === */}
          <AnimatedG animatedProps={o2Props} origin="160, 160">
            <Path d={createGearPath(265, 167, 26, 18, p2Teeth)}
              fill="url(#gearEdge)" stroke="#1a1008" strokeWidth="1.5" />
            <Path
              d={createGearPath(265, 160, 26, 18, p2Teeth)}
              fill="url(#metal)"
              stroke="#4a3a20"
              strokeWidth="1.1"
            />
            <Circle cx="265" cy="164" r="8" fill="#1a1008" />
            <Circle cx="265" cy="160" r="7" fill="url(#hubBevel)" stroke="#6a5a40" strokeWidth="1" />
          </AnimatedG>

          {/* === PLANET 3 === */}
          <AnimatedG animatedProps={o3Props} origin="160, 160">
            <Path d={createGearPath(265, 165, 18, 12, p3Teeth)}
              fill="url(#gearEdge)" stroke="#1a1008" strokeWidth="1.3" />
            <Path
              d={createGearPath(265, 160, 18, 12, p3Teeth)}
              fill="url(#metal)"
              stroke="#4a3a20"
              strokeWidth="1"
            />
          </AnimatedG>

          {/* === PLANET 4 (appears after enough insights) === */}
          {showPlanet4 && (
            <AnimatedG animatedProps={o4Props} origin="160, 160">
              <Path d={createGearPath(288, 165, 16, 11, 8 + Math.min(insightCount, 6))}
                fill="url(#gearEdge)" stroke="#1a1008" strokeWidth="1.2" />
              <Path
                d={createGearPath(288, 160, 16, 11, 8 + Math.min(insightCount, 6))}
                fill="url(#metal)"
                stroke="#4a3a20"
                strokeWidth="1"
              />
              <Circle cx="288" cy="163" r="6" fill="#1a1008" />
              <Circle cx="288" cy="160" r="5" fill="url(#hubBevel)" stroke="#6a5a40" strokeWidth="0.8" />
            </AnimatedG>
          )}

          {/* Listening pulse ring */}
          {isListening && (
            <Circle
              cx="160"
              cy="160"
              r="152"
              fill="none"
              stroke="#c08040"
              strokeWidth="2"
              opacity="0.35"
            />
          )}
        </G>
        <Ellipse cx="160" cy="287" rx="112" ry="11" fill="#080808" opacity="0.7" />
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
