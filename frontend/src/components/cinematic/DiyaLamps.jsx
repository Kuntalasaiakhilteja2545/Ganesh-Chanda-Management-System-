import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * A single Diya oil lamp with animated flame and warm point light.
 */
function Diya({ position = [0, 0, 0], intensity = 1.0, scale = 1.0 }) {
  const flameRef = useRef();
  const lightRef = useRef();
  const groupRef = useRef();

  // Brass/gold material for the bowl
  const brassMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#b8860b',
        metalness: 0.7,
        roughness: 0.35,
        emissive: '#3d2200',
        emissiveIntensity: 0.15,
      }),
    []
  );

  // Flame material — emissive orange with additive blending feel
  const flameMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#ff8c00',
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide,
      }),
    []
  );

  // Inner glow material
  const glowMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#ffdd44',
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide,
      }),
    []
  );

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    const idx = position[0] * 7.3 + position[2] * 3.7; // unique per-diya offset

    if (flameRef.current) {
      // Subtle flame flicker — scale and rotation
      const flicker = Math.sin(time * 8 + idx) * 0.08 + Math.sin(time * 13 + idx * 2) * 0.04;
      flameRef.current.scale.x = (0.9 + flicker) * scale;
      flameRef.current.scale.y = (1.0 + flicker * 0.6) * scale;
      flameRef.current.rotation.z = Math.sin(time * 5 + idx) * 0.1;
    }

    if (lightRef.current) {
      // Warm light intensity fluctuation matching flame
      const lightFlicker = Math.sin(time * 7 + idx) * 0.15 + Math.sin(time * 11 + idx) * 0.08;
      lightRef.current.intensity = Math.max(0, (0.8 + lightFlicker) * intensity);
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Bowl — lathe-like shape using a flattened torus */}
      <mesh material={brassMaterial} position={[0, 0, 0]} castShadow>
        <torusGeometry args={[0.08 * scale, 0.03 * scale, 8, 16]} />
      </mesh>

      {/* Oil surface */}
      <mesh position={[0, 0.01 * scale, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.06 * scale, 16]} />
        <meshStandardMaterial color="#4a3000" roughness={0.9} />
      </mesh>

      {/* Flame — elongated sphere with flicker animation */}
      <group ref={flameRef} position={[0, 0.06 * scale, 0]}>
        {/* Inner bright core */}
        <mesh material={glowMaterial}>
          <sphereGeometry args={[0.015 * scale, 8, 8]} />
        </mesh>
        {/* Outer flame */}
        <mesh material={flameMaterial} position={[0, 0.02 * scale, 0]}>
          <sphereGeometry args={[0.01 * scale, 8, 6]} />
        </mesh>
        <mesh material={flameMaterial} scale={[0.7, 1.4, 0.7]}>
          <coneGeometry args={[0.012 * scale, 0.04 * scale, 6]} />
        </mesh>
      </group>

      {/* Warm point light emanating from the flame */}
      <pointLight
        ref={lightRef}
        position={[0, 0.1 * scale, 0]}
        color="#ff9933"
        intensity={intensity}
        distance={3}
        decay={2}
        castShadow={false}
      />
    </group>
  );
}

/**
 * DiyaLamps — renders multiple diya oil lamps at predefined scenic positions.
 */
export default function DiyaLamps({ intensity = 1.0, count = 4 }) {
  const positions = useMemo(() => {
    // Scenic positions: base of pillars, near pedestal
    const base = [
      [-1.8, -1.5, 0.5],   // left pillar base
      [1.8, -1.5, 0.5],    // right pillar base
      [-0.7, -1.5, 1.2],   // left near pedestal
      [0.7, -1.5, 1.2],    // right near pedestal
      [0, -1.5, 1.8],      // center front
      [-2.5, -1.0, -0.5],  // left back
    ];
    return base.slice(0, count);
  }, [count]);

  return (
    <group>
      {positions.map((pos, i) => (
        <Diya
          key={i}
          position={pos}
          intensity={intensity * (0.6 + Math.random() * 0.4)}
          scale={0.8 + Math.random() * 0.4}
        />
      ))}
    </group>
  );
}
