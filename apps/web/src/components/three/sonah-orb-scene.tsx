'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import {
  DUST_FRAGMENT,
  DUST_VERTEX,
  ORB_FRAGMENT,
  ORB_VERTEX,
  RING_FRAGMENT,
  RING_VERTEX,
} from './shaders';

const PALETTE = {
  deep: '#0b0e2a',
  mid: '#26306b',
  gold: '#f0b429',
  clay: '#d4622f',
  green: '#16936b',
  red: '#c0392b',
  black: '#121212',
} as const;

export interface SonahOrbSceneProps {
  /** 0 = calme, 1 = Sonah réfléchit (déformation et vitesse accrues). */
  readonly energy?: number;
  /** Rendre une seule image (mouvement réduit) ou animer en continu. */
  readonly animate?: boolean;
  /** Version allégée (moins de particules) pour les petits formats. */
  readonly compact?: boolean;
}

function color(hex: string): THREE.Color {
  return new THREE.Color(hex);
}

function Orb({ energy }: { energy: number }): JSX.Element {
  const material = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uEnergy: { value: 0 },
      uPointer: { value: new THREE.Vector3(0, 0, 1) },
      uPointerStrength: { value: 0 },
      uDeep: { value: color(PALETTE.deep) },
      uMid: { value: color(PALETTE.mid) },
      uGold: { value: color(PALETTE.gold) },
      uClay: { value: color(PALETTE.clay) },
      uGreen: { value: color(PALETTE.green) },
      uRed: { value: color(PALETTE.red) },
    }),
    [],
  );

  useFrame((state, delta) => {
    const u = material.current?.uniforms;
    if (!u) return;
    u.uTime.value += delta;
    u.uEnergy.value = THREE.MathUtils.damp(u.uEnergy.value, energy, 3, delta);
    const { x, y } = state.pointer;
    const target = new THREE.Vector3(x * 1.2, y * 1.2, 1).normalize();
    (u.uPointer.value as THREE.Vector3).lerp(target, 1 - Math.exp(-delta * 4));
    u.uPointerStrength.value = THREE.MathUtils.damp(
      u.uPointerStrength.value,
      Math.min(1, Math.hypot(x, y) * 1.4),
      4,
      delta,
    );
  });

  return (
    <mesh>
      <sphereGeometry args={[1.15, 220, 220]} />
      <shaderMaterial
        ref={material}
        vertexShader={ORB_VERTEX}
        fragmentShader={ORB_FRAGMENT}
        uniforms={uniforms}
      />
    </mesh>
  );
}

function ToghuRing({
  radius,
  rotation,
  speed,
}: {
  radius: number;
  rotation: [number, number, number];
  speed: number;
}): JSX.Element {
  const group = useRef<THREE.Group>(null);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uGold: { value: color(PALETTE.gold) },
      uGreen: { value: color(PALETTE.green) },
      uRed: { value: color(PALETTE.red) },
      uBlack: { value: color(PALETTE.black) },
    }),
    [],
  );

  useFrame((_, delta) => {
    uniforms.uTime.value += delta;
    if (group.current) group.current.rotation.z += delta * speed;
  });

  return (
    <group rotation={rotation}>
      <group ref={group}>
        <mesh>
          <torusGeometry args={[radius, 0.018, 12, 360]} />
          <shaderMaterial
            vertexShader={RING_VERTEX}
            fragmentShader={RING_FRAGMENT}
            uniforms={uniforms}
          />
        </mesh>
      </group>
    </group>
  );
}

function GoldDust({ count, energy }: { count: number; energy: number }): JSX.Element {
  const pixelRatio = useThree((state) => state.viewport.dpr);
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const angles = new Float32Array(count);
    const radii = new Float32Array(count);
    const heights = new Float32Array(count);
    const scales = new Float32Array(count);
    for (let i = 0; i < count; i += 1) {
      const r = 1.4 + Math.pow(Math.random(), 1.6) * 1.5;
      angles[i] = Math.random() * Math.PI * 2;
      radii[i] = r;
      heights[i] = (Math.random() - 0.5) * 0.22 * (r - 1.1);
      scales[i] = 0.3 + Math.random() * 1.1;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    geo.setAttribute('aAngle', new THREE.BufferAttribute(angles, 1));
    geo.setAttribute('aRadius', new THREE.BufferAttribute(radii, 1));
    geo.setAttribute('aHeight', new THREE.BufferAttribute(heights, 1));
    geo.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));
    return geo;
  }, [count]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uEnergy: { value: 0 },
      uPixelRatio: { value: pixelRatio },
      uGold: { value: color(PALETTE.gold) },
      uClay: { value: color(PALETTE.clay) },
    }),
    [pixelRatio],
  );

  useFrame((_, delta) => {
    uniforms.uTime.value += delta;
    uniforms.uEnergy.value = THREE.MathUtils.damp(uniforms.uEnergy.value, energy, 3, delta);
  });

  return (
    <points geometry={geometry} frustumCulled={false} rotation={[0.38, 0, -0.18]}>
      <shaderMaterial
        vertexShader={DUST_VERTEX}
        fragmentShader={DUST_FRAGMENT}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function Rig({ children }: { children: React.ReactNode }): JSX.Element {
  const group = useRef<THREE.Group>(null);
  useFrame((state, delta) => {
    if (!group.current) return;
    const { x, y } = state.pointer;
    group.current.rotation.x = THREE.MathUtils.damp(group.current.rotation.x, -y * 0.22, 3, delta);
    group.current.rotation.y = THREE.MathUtils.damp(group.current.rotation.y, x * 0.32, 3, delta);
    group.current.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.06;
  });
  return <group ref={group}>{children}</group>;
}

export default function SonahOrbScene({
  energy = 0,
  animate = true,
  compact = false,
}: SonahOrbSceneProps): JSX.Element {
  return (
    <Canvas
      dpr={[1, 1.75]}
      frameloop={animate ? 'always' : 'demand'}
      camera={{ position: [0, 0, 6.6], fov: 40 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      eventSource={typeof document !== 'undefined' ? document.body : undefined}
      eventPrefix="client"
    >
      <Rig>
        <Orb energy={energy} />
        <ToghuRing radius={1.6} rotation={[1.25, 0.15, 0]} speed={0.25} />
        <ToghuRing radius={1.92} rotation={[1.45, -0.55, 0.35]} speed={-0.16} />
        <GoldDust count={compact ? 1200 : 3200} energy={energy} />
      </Rig>
    </Canvas>
  );
}
