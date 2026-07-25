/* eslint-disable react/no-unknown-property -- React Three Fiber JSX maps props to Three.js objects. */
import React, { useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { Canvas, useFrame } from '@react-three/fiber/native';
import * as THREE from 'three';
import { AgentId } from '../agents/types';

interface GearClockProps {
  isListening: boolean;
  insightCount: number;
  activeAgents?: AgentId[];
  reducedMotion?: boolean;
  lowPerformanceMode?: boolean;
}

interface GearProps {
  teeth: number;
  radius: number;
  depth: number;
  position: [number, number, number];
  rotation?: [number, number, number];
  speed: number;
  color?: string;
  emissive?: string;
  active?: boolean;
  lowPerformanceMode?: boolean;
}

const palette = {
  obsidian: '#080807',
  surface: '#12110e',
  raised: '#1a1813',
  brass: '#B88945',
  brassBright: '#D6A85F',
  ivory: '#E9E1D2',
  border: '#383126',
  danger: '#C97063',
} as const;

export function buildGearProfile(teeth: number, rootRadius: number, outerRadius: number) {
  const points: [number, number][] = [];
  const steps = Math.max(6, teeth) * 4;
  for (let index = 0; index < steps; index += 1) {
    const phase = index % 4;
    const radius = phase < 2 ? outerRadius : rootRadius;
    const angle = (index / steps) * Math.PI * 2;
    points.push([Math.cos(angle) * radius, Math.sin(angle) * radius]);
  }
  return points;
}

function createGearShape(teeth: number, radius: number) {
  const rootRadius = radius * 0.78;
  const profile = buildGearProfile(teeth, rootRadius, radius);
  const shape = new THREE.Shape();
  profile.forEach(([x, y], index) => {
    if (index === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  });
  shape.closePath();
  const bore = new THREE.Path();
  bore.absarc(0, 0, radius * 0.23, 0, Math.PI * 2, true);
  shape.holes.push(bore);
  return shape;
}

function Gear({
  teeth,
  radius,
  depth,
  position,
  rotation = [0, 0, 0],
  speed,
  color = palette.brass,
  emissive = palette.brassBright,
  active = false,
  lowPerformanceMode = false,
}: GearProps) {
  const mesh = useRef<THREE.Mesh>(null);
  const shape = useMemo(() => createGearShape(teeth, radius), [radius, teeth]);
  const geometry = useMemo(() => ({
    depth,
    bevelEnabled: true,
    bevelSize: lowPerformanceMode ? 0.025 : 0.055,
    bevelThickness: lowPerformanceMode ? 0.025 : 0.055,
    bevelSegments: lowPerformanceMode ? 1 : 3,
    curveSegments: 2,
  }), [depth, lowPerformanceMode]);

  useFrame((_state, delta) => {
    if (mesh.current) mesh.current.rotation.z += delta * speed;
  });

  return (
    <mesh
      ref={mesh}
      position={position}
      rotation={rotation}
      castShadow={!lowPerformanceMode}
      receiveShadow={!lowPerformanceMode}
    >
      <extrudeGeometry args={[shape, geometry]} />
      <meshStandardMaterial
        color={color}
        metalness={0.94}
        roughness={0.24}
        emissive={emissive}
        emissiveIntensity={active ? 0.24 : 0.025}
      />
    </mesh>
  );
}

function StarField({ count }: { count: number }) {
  const positions = useMemo(() => {
    const points = new Float32Array(count * 3);
    for (let index = 0; index < count; index += 1) {
      const angle = index * 2.399963;
      const spread = 4.2 + ((index * 37) % 100) / 34;
      points[index * 3] = Math.cos(angle) * spread;
      points[index * 3 + 1] = Math.sin(angle) * spread;
      points[index * 3 + 2] = -1.5 - ((index * 17) % 50) / 20;
    }
    return points;
  }, [count]);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color={palette.ivory} size={0.025} transparent opacity={0.38} />
    </points>
  );
}

function GearCelestialBody({
  isListening,
  insightCount,
  activeAgents,
  reducedMotion,
  lowPerformanceMode,
}: Required<Omit<GearClockProps, 'activeAgents'>> & { activeAgents: AgentId[] }) {
  const body = useRef<THREE.Group>(null);
  const halo = useRef<THREE.Group>(null);
  const active = activeAgents.length > 0;
  const processing = activeAgents.some((agent) => agent !== 'listener' && agent !== 'visualizer');
  const motion = reducedMotion ? 0 : (isListening ? 0.34 : active ? 0.2 : 0.075);
  const complexity = Math.min(8, Math.floor(insightCount / 3));

  useFrame((state, delta) => {
    if (!body.current || reducedMotion) return;
    body.current.rotation.y += delta * motion;
    body.current.rotation.x = -0.22 + Math.sin(state.clock.elapsedTime * 0.26) * 0.055;
    if (halo.current) halo.current.rotation.z -= delta * motion * 0.5;
  });

  return (
    <>
      <StarField count={lowPerformanceMode ? 42 : 110} />
      <group ref={halo} rotation={[-0.82, 0.08, 0.16]}>
        <mesh>
          <torusGeometry args={[2.78, 0.035, lowPerformanceMode ? 6 : 12, 96]} />
          <meshStandardMaterial
            color={palette.brass}
            emissive={palette.brassBright}
            emissiveIntensity={isListening ? 0.42 : 0.08}
            metalness={0.9}
            roughness={0.32}
          />
        </mesh>
        {!lowPerformanceMode && (
          <mesh rotation={[0.3, 0.15, 0.42]}>
            <torusGeometry args={[3.08, 0.018, 8, 112]} />
            <meshStandardMaterial color={palette.border} metalness={0.88} roughness={0.3} />
          </mesh>
        )}
      </group>

      <group ref={body} rotation={[-0.22, 0.18, -0.08]}>
        <mesh castShadow receiveShadow>
          <icosahedronGeometry args={[1.18, lowPerformanceMode ? 1 : 2]} />
          <meshStandardMaterial
            color={palette.raised}
            metalness={0.84}
            roughness={0.4}
            emissive={palette.brass}
            emissiveIntensity={processing ? 0.12 : 0.015}
            flatShading
          />
        </mesh>

        <Gear teeth={26 + complexity} radius={1.34} depth={0.3} position={[0, 0, 0.74]}
          speed={motion * 1.6} active={activeAgents.includes('extractor')}
          lowPerformanceMode={lowPerformanceMode} />
        <Gear teeth={14} radius={0.69} depth={0.42} position={[-1.12, 0.52, 0.42]}
          rotation={[0.18, -0.38, 0]} speed={-motion * 2.5}
          active={activeAgents.includes('weaver')} lowPerformanceMode={lowPerformanceMode} />
        <Gear teeth={13} radius={0.62} depth={0.38} position={[1.06, 0.64, 0.38]}
          rotation={[-0.2, 0.46, 0]} speed={motion * 2.8}
          active={activeAgents.includes('archivist')} lowPerformanceMode={lowPerformanceMode} />
        <Gear teeth={11} radius={0.53} depth={0.36} position={[-0.72, -1.08, 0.34]}
          rotation={[0.42, -0.16, 0]} speed={motion * 3.2}
          active={activeAgents.includes('questioner')} lowPerformanceMode={lowPerformanceMode} />
        <Gear teeth={12} radius={0.57} depth={0.37} position={[0.84, -0.96, 0.31]}
          rotation={[0.36, 0.28, 0]} speed={-motion * 3}
          active={activeAgents.includes('summarizer')} lowPerformanceMode={lowPerformanceMode} />

        {!lowPerformanceMode && (
          <>
            <Gear teeth={10} radius={0.48} depth={0.32} position={[-1.34, -0.3, -0.15]}
              rotation={[0, -Math.PI / 2.5, 0]} speed={motion * 3.4}
              active={activeAgents.includes('listener')} />
            <Gear teeth={10} radius={0.48} depth={0.32} position={[1.34, -0.18, -0.12]}
              rotation={[0, Math.PI / 2.5, 0]} speed={-motion * 3.4}
              active={activeAgents.includes('retriever')} />
            <Gear teeth={9} radius={0.42} depth={0.3} position={[0.05, 1.38, -0.05]}
              rotation={[Math.PI / 2.5, 0, 0]} speed={motion * 3.8}
              active={activeAgents.includes('visualizer')} />
          </>
        )}

        <mesh position={[0, 0, 1.12]} castShadow>
          <sphereGeometry args={[0.29, lowPerformanceMode ? 16 : 32, lowPerformanceMode ? 12 : 24]} />
          <meshStandardMaterial
            color={palette.brassBright}
            emissive={palette.brassBright}
            emissiveIntensity={isListening ? 0.8 : 0.23}
            metalness={0.78}
            roughness={0.18}
          />
        </mesh>
        <mesh position={[0, 0, 1.39]}>
          <sphereGeometry args={[0.085, 16, 12]} />
          <meshStandardMaterial color={palette.obsidian} metalness={1} roughness={0.15} />
        </mesh>
      </group>
    </>
  );
}

export function GearClock({
  isListening,
  insightCount,
  activeAgents = [],
  reducedMotion = false,
  lowPerformanceMode = false,
}: GearClockProps) {
  return (
    <View style={styles.container} testID="gear-clock-3d" accessible={false}>
      <Canvas
        shadows={!lowPerformanceMode}
        camera={{ position: [0, 0.5, 8.7], fov: 36, near: 0.1, far: 40 }}
        gl={{ antialias: !lowPerformanceMode, alpha: true }}
      >
        <color attach="background" args={[palette.obsidian]} />
        <fog attach="fog" args={[palette.obsidian, 10, 21]} />
        <ambientLight intensity={0.55} color={palette.ivory} />
        <hemisphereLight args={[palette.ivory, palette.surface, 1.4]} />
        <spotLight
          position={[4.5, 6, 8]}
          color={palette.ivory}
          intensity={95}
          angle={0.42}
          penumbra={0.72}
          decay={2}
          castShadow={!lowPerformanceMode}
        />
        <pointLight position={[-4, -2, 5]} color={palette.brassBright}
          intensity={isListening ? 42 : 20} decay={2} />
        <pointLight position={[3, -3, -1]} color={palette.brass}
          intensity={activeAgents.length ? 28 : 12} decay={2} />
        <GearCelestialBody
          isListening={isListening}
          insightCount={insightCount}
          activeAgents={activeAgents}
          reducedMotion={reducedMotion}
          lowPerformanceMode={lowPerformanceMode}
        />
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 300,
    overflow: 'hidden',
    backgroundColor: palette.obsidian,
  },
});
