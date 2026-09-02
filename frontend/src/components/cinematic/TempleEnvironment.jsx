import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * TempleEnvironment — dark premium Indian temple backdrop.
 * Two ornate pillars, a subtle arch, carved mandala wall,
 * and a deep burgundy atmosphere. All geometry uses dark
 * materials that catch the golden diya and rim lighting.
 */
export default function TempleEnvironment({ opacity = 1.0 }) {
  const groupRef = useRef();

  // Materials
  const pillarMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#2a1a12',
        metalness: 0.15,
        roughness: 0.75,
        transparent: true,
        opacity,
      }),
    []
  );

  const wallMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#1a0c08',
        metalness: 0.1,
        roughness: 0.9,
        transparent: true,
        opacity,
      }),
    []
  );

  const goldAccentMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#b8860b',
        metalness: 0.85,
        roughness: 0.2,
        emissive: '#3d2200',
        emissiveIntensity: 0.1,
        transparent: true,
        opacity,
      }),
    []
  );

  const floorMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#120a06',
        metalness: 0.05,
        roughness: 0.95,
        transparent: true,
        opacity,
      }),
    []
  );

  // Update material opacity reactively
  useFrame(() => {
    pillarMat.opacity = opacity;
    wallMat.opacity = opacity;
    goldAccentMat.opacity = opacity;
    floorMat.opacity = opacity;
  });

  return (
    <group ref={groupRef}>
      {/* Back Wall */}
      <mesh position={[0, 0, -3]} material={wallMat} receiveShadow>
        <planeGeometry args={[12, 8]} />
      </mesh>

      {/* Floor */}
      <mesh
        position={[0, -1.6, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        material={floorMat}
        receiveShadow
      >
        <planeGeometry args={[12, 8]} />
      </mesh>

      {/* Left Pillar */}
      <Pillar position={[-2.5, 0, -1]} material={pillarMat} accentMaterial={goldAccentMat} />
      {/* Right Pillar */}
      <Pillar position={[2.5, 0, -1]} material={pillarMat} accentMaterial={goldAccentMat} />

      {/* Decorative Arch between pillars (subtle) */}
      <mesh position={[0, 2.2, -1.5]} rotation={[0, 0, 0]}>
        <torusGeometry args={[2.5, 0.06, 8, 32, Math.PI]} />
        <meshStandardMaterial
          color="#3d2200"
          metalness={0.6}
          roughness={0.4}
          transparent
          opacity={opacity * 0.7}
        />
      </mesh>

      {/* Mandala / Decorative circle on back wall */}
      <MandalaDecoration position={[0, 0.5, -2.9]} opacity={opacity} />

      {/* Side atmospheric panels (depth cue) */}
      <mesh position={[-5, 0, -1]} rotation={[0, Math.PI / 6, 0]} material={wallMat}>
        <planeGeometry args={[4, 7]} />
      </mesh>
      <mesh position={[5, 0, -1]} rotation={[0, -Math.PI / 6, 0]} material={wallMat}>
        <planeGeometry args={[4, 7]} />
      </mesh>
    </group>
  );
}

/**
 * A single ornate temple pillar with gold accent rings.
 */
function Pillar({ position, material, accentMaterial }) {
  return (
    <group position={position}>
      {/* Main column */}
      <mesh material={material} castShadow receiveShadow>
        <cylinderGeometry args={[0.18, 0.22, 5, 12]} />
      </mesh>

      {/* Gold accent rings at top, middle, bottom */}
      {[-1.8, 0, 1.8].map((y, i) => (
        <mesh key={i} position={[0, y, 0]} material={accentMaterial}>
          <torusGeometry args={[0.22, 0.025, 8, 16]} />
        </mesh>
      ))}

      {/* Capital (top decorative element) */}
      <mesh position={[0, 2.4, 0]} material={accentMaterial} castShadow>
        <boxGeometry args={[0.5, 0.12, 0.5]} />
      </mesh>

      {/* Base */}
      <mesh position={[0, -2.4, 0]} material={material} receiveShadow>
        <boxGeometry args={[0.45, 0.2, 0.45]} />
      </mesh>
    </group>
  );
}

/**
 * Mandala decorative pattern on the back wall.
 * Concentric rings with radiating spokes — subtle carved look.
 */
function MandalaDecoration({ position, opacity }) {
  const mat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#4a2800',
        metalness: 0.5,
        roughness: 0.5,
        emissive: '#2a1500',
        emissiveIntensity: 0.15,
        transparent: true,
        opacity: opacity * 0.5,
        side: THREE.DoubleSide,
      }),
    []
  );

  useFrame(() => {
    mat.opacity = opacity * 0.5;
  });

  return (
    <group position={position}>
      {/* Concentric rings */}
      {[0.6, 1.0, 1.4, 1.8].map((radius, i) => (
        <mesh key={`ring-${i}`} material={mat}>
          <torusGeometry args={[radius, 0.015, 6, 32]} />
        </mesh>
      ))}

      {/* Radiating spokes */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        return (
          <mesh
            key={`spoke-${i}`}
            position={[Math.cos(angle) * 0.9, Math.sin(angle) * 0.9, 0]}
            rotation={[0, 0, angle]}
            material={mat}
          >
            <boxGeometry args={[1.2, 0.01, 0.01]} />
          </mesh>
        );
      })}

      {/* Center ornament */}
      <mesh material={mat}>
        <circleGeometry args={[0.15, 16]} />
      </mesh>
    </group>
  );
}
