import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * GaneshModel — Premium procedural Ganesh figure.
 *
 * Phase 1: Majestic golden silhouette built from geometric primitives
 * with PBR materials. Designed to be visually impressive even without
 * a production GLB model.
 *
 * Phase 2 (future): Replace with useGLTF() loader for a real 3D model.
 * The component interface (props) remains identical.
 */
export default function GaneshModel({
  opacity = 1.0,
  scale = 1.0,
  blessingProgress = 0,
  mouseX = 0,
  mouseY = 0,
}) {
  const groupRef = useRef();
  const bodyRef = useRef();
  const crownRef = useRef();
  const trunkRef = useRef();

  // === PBR Materials ===
  const goldMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#d4a017',
        metalness: 0.9,
        roughness: 0.15,
        emissive: '#4a3000',
        emissiveIntensity: 0.2,
        transparent: true,
      }),
    []
  );

  const bodyMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#e8b860',
        metalness: 0.3,
        roughness: 0.55,
        emissive: '#3d2800',
        emissiveIntensity: 0.1,
        transparent: true,
      }),
    []
  );

  const clothMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#8b0000',
        metalness: 0.15,
        roughness: 0.7,
        emissive: '#2a0000',
        emissiveIntensity: 0.1,
        transparent: true,
      }),
    []
  );

  const rubyMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#c41e3a',
        metalness: 0.6,
        roughness: 0.2,
        emissive: '#600010',
        emissiveIntensity: 0.3,
        transparent: true,
      }),
    []
  );

  const lotusMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#e8a0b0',
        metalness: 0.1,
        roughness: 0.6,
        emissive: '#3d1020',
        emissiveIntensity: 0.1,
        transparent: true,
      }),
    []
  );

  // === Animations ===
  useFrame((state) => {
    const time = state.clock.elapsedTime;

    // Update material opacity
    goldMat.opacity = opacity;
    bodyMat.opacity = opacity;
    clothMat.opacity = opacity;
    rubyMat.opacity = opacity;
    lotusMat.opacity = opacity;

    if (!groupRef.current) return;

    // Subtle breathing animation (gentle Y-axis scale oscillation)
    const breathe = 1.0 + Math.sin(time * 1.2) * 0.008;
    groupRef.current.scale.set(scale, scale * breathe, scale);

    // Very subtle parallax response to mouse (1-3 degrees max)
    const targetRotY = mouseX * 0.035; // ~2° max
    const targetRotX = mouseY * -0.02; // ~1° max
    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y,
      targetRotY,
      0.03
    );
    groupRef.current.rotation.x = THREE.MathUtils.lerp(
      groupRef.current.rotation.x,
      targetRotX,
      0.03
    );

    // Crown subtle bob
    if (crownRef.current) {
      crownRef.current.position.y = 1.35 + Math.sin(time * 0.9) * 0.01;
    }

    // Trunk gentle sway
    if (trunkRef.current) {
      trunkRef.current.rotation.z = Math.sin(time * 0.7) * 0.03 + Math.sin(time * 1.1) * 0.015;
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.3, 0]}>
      {/* === HEAD === */}
      <group position={[0, 1.0, 0]}>
        {/* Main head sphere */}
        <mesh material={bodyMat} castShadow>
          <sphereGeometry args={[0.42, 24, 24]} />
        </mesh>

        {/* Left ear — large elephant ear */}
        <mesh position={[-0.48, 0.05, 0]} rotation={[0, -0.3, -0.2]} material={bodyMat} castShadow>
          <sphereGeometry args={[0.25, 16, 16]} />
        </mesh>
        <mesh position={[-0.48, 0.05, 0]} rotation={[0, -0.3, -0.2]}>
          <sphereGeometry args={[0.22, 16, 16]} />
          <meshStandardMaterial color="#d4a070" metalness={0.2} roughness={0.6} transparent opacity={opacity} />
        </mesh>

        {/* Right ear */}
        <mesh position={[0.48, 0.05, 0]} rotation={[0, 0.3, 0.2]} material={bodyMat} castShadow>
          <sphereGeometry args={[0.25, 16, 16]} />
        </mesh>
        <mesh position={[0.48, 0.05, 0]} rotation={[0, 0.3, 0.2]}>
          <sphereGeometry args={[0.22, 16, 16]} />
          <meshStandardMaterial color="#d4a070" metalness={0.2} roughness={0.6} transparent opacity={opacity} />
        </mesh>

        {/* Eyes */}
        <mesh position={[-0.15, 0.12, 0.36]}>
          <sphereGeometry args={[0.06, 12, 12]} />
          <meshStandardMaterial color="#1a0a00" metalness={0.3} roughness={0.4} transparent opacity={opacity} />
        </mesh>
        <mesh position={[0.15, 0.12, 0.36]}>
          <sphereGeometry args={[0.06, 12, 12]} />
          <meshStandardMaterial color="#1a0a00" metalness={0.3} roughness={0.4} transparent opacity={opacity} />
        </mesh>
        {/* Eye highlights */}
        <mesh position={[-0.14, 0.13, 0.4]}>
          <sphereGeometry args={[0.02, 8, 8]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={opacity * 0.6} />
        </mesh>
        <mesh position={[0.16, 0.13, 0.4]}>
          <sphereGeometry args={[0.02, 8, 8]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={opacity * 0.6} />
        </mesh>

        {/* Trunk */}
        <group ref={trunkRef} position={[0, -0.1, 0.35]}>
          {/* Trunk segments — curved downward then curling left */}
          <mesh material={bodyMat} castShadow>
            <capsuleGeometry args={[0.08, 0.2, 8, 12]} />
          </mesh>
          <mesh position={[0, -0.18, 0.02]} rotation={[0.15, 0, 0]} material={bodyMat}>
            <capsuleGeometry args={[0.065, 0.15, 8, 12]} />
          </mesh>
          <mesh position={[-0.04, -0.32, 0.06]} rotation={[0.3, 0, -0.4]} material={bodyMat}>
            <capsuleGeometry args={[0.05, 0.12, 8, 12]} />
          </mesh>
          {/* Trunk tip curling */}
          <mesh position={[-0.12, -0.38, 0.08]} rotation={[0.2, 0, -0.8]} material={bodyMat}>
            <capsuleGeometry args={[0.035, 0.08, 6, 8]} />
          </mesh>
        </group>

        {/* Tilak / Bindi on forehead */}
        <mesh position={[0, 0.25, 0.39]}>
          <sphereGeometry args={[0.035, 8, 8]} />
          <meshStandardMaterial color="#cc0000" metalness={0.5} roughness={0.3} emissive="#800000" emissiveIntensity={0.3} transparent opacity={opacity} />
        </mesh>
      </group>

      {/* === CROWN === */}
      <group ref={crownRef} position={[0, 1.35, 0]}>
        {/* Crown base */}
        <mesh material={goldMat} castShadow>
          <cylinderGeometry args={[0.3, 0.38, 0.2, 8]} />
        </mesh>
        {/* Crown peak points */}
        {Array.from({ length: 5 }).map((_, i) => {
          const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
          const height = i === 2 ? 0.35 : 0.22; // center peak taller
          return (
            <group key={i}>
              <mesh
                position={[Math.cos(angle) * 0.25, 0.1 + height / 2, Math.sin(angle) * 0.25]}
                material={goldMat}
                castShadow
              >
                <coneGeometry args={[0.06, height, 6]} />
              </mesh>
              {/* Ruby on each peak */}
              <mesh
                position={[Math.cos(angle) * 0.25, 0.1 + height, Math.sin(angle) * 0.25]}
                material={rubyMat}
              >
                <sphereGeometry args={[0.025, 8, 8]} />
              </mesh>
            </group>
          );
        })}
      </group>

      {/* === BODY / TORSO === */}
      <group position={[0, 0.2, 0]}>
        {/* Main torso */}
        <mesh material={bodyMat} castShadow>
          <sphereGeometry args={[0.55, 24, 24]} />
        </mesh>
        {/* Belly (slightly larger, protruding) */}
        <mesh position={[0, -0.1, 0.15]} material={bodyMat} castShadow>
          <sphereGeometry args={[0.45, 20, 20]} />
        </mesh>

        {/* Sacred thread (yagnopavita) */}
        <mesh position={[0, 0.05, 0.25]} rotation={[0, 0, 0.4]}>
          <torusGeometry args={[0.5, 0.012, 8, 32]} />
          <meshStandardMaterial color="#f0e68c" metalness={0.7} roughness={0.3} transparent opacity={opacity} />
        </mesh>

        {/* Necklace */}
        <mesh position={[0, 0.35, 0.15]}>
          <torusGeometry args={[0.35, 0.02, 8, 24]} />
          {/* Gold necklace */}
          <meshStandardMaterial color="#daa520" metalness={0.85} roughness={0.15} emissive="#3d2200" emissiveIntensity={0.2} transparent opacity={opacity} />
        </mesh>

        {/* Dhoti / cloth wrap (lower body) */}
        <mesh position={[0, -0.45, 0.05]} material={clothMat} castShadow>
          <cylinderGeometry args={[0.45, 0.55, 0.6, 16]} />
        </mesh>
        {/* Cloth sash / belt */}
        <mesh position={[0, -0.2, 0.2]}>
          <torusGeometry args={[0.48, 0.025, 8, 24]} />
          <meshStandardMaterial color="#daa520" metalness={0.8} roughness={0.2} transparent opacity={opacity} />
        </mesh>
      </group>

      {/* === FOUR ARMS === */}
      {/* Upper Right Arm — blessing gesture (animated) */}
      <group position={[0.45, 0.65, 0]}>
        {/* Upper arm */}
        <mesh rotation={[0, 0, -0.6]} material={bodyMat} castShadow>
          <capsuleGeometry args={[0.08, 0.35, 8, 12]} />
        </mesh>
        {/* Forearm + hand (blessing — rises with blessingProgress) */}
        <group position={[0.25, 0.25 + blessingProgress * 0.15, -0.05]} rotation={[0, 0, 0.3 - blessingProgress * 0.3]}>
          <mesh material={bodyMat} castShadow>
            <capsuleGeometry args={[0.065, 0.25, 8, 12]} />
          </mesh>
          {/* Open palm — blessing */}
          <mesh position={[0.05, 0.18, 0.03]} material={bodyMat}>
            <sphereGeometry args={[0.07, 12, 12]} />
          </mesh>
          {/* Gold bangle */}
          <mesh position={[0, 0, 0]}>
            <torusGeometry args={[0.08, 0.012, 8, 16]} />
            <meshStandardMaterial color="#daa520" metalness={0.85} roughness={0.15} transparent opacity={opacity} />
          </mesh>
        </group>
      </group>

      {/* Upper Left Arm — holding symbolic item */}
      <group position={[-0.45, 0.65, 0]}>
        <mesh rotation={[0, 0, 0.6]} material={bodyMat} castShadow>
          <capsuleGeometry args={[0.08, 0.35, 8, 12]} />
        </mesh>
        <group position={[-0.25, 0.2, -0.05]} rotation={[0, 0, -0.5]}>
          <mesh material={bodyMat} castShadow>
            <capsuleGeometry args={[0.065, 0.25, 8, 12]} />
          </mesh>
          {/* Lotus in hand */}
          <mesh position={[-0.05, 0.2, 0]} material={lotusMat}>
            <coneGeometry args={[0.06, 0.1, 8]} />
          </mesh>
          <mesh position={[-0.05, 0.25, 0]}>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshStandardMaterial color="#ff69b4" metalness={0.1} roughness={0.5} transparent opacity={opacity} />
          </mesh>
          {/* Gold bangle */}
          <mesh position={[0, 0, 0]}>
            <torusGeometry args={[0.08, 0.012, 8, 16]} />
            <meshStandardMaterial color="#daa520" metalness={0.85} roughness={0.15} transparent opacity={opacity} />
          </mesh>
        </group>
      </group>

      {/* Lower Right Arm — holding modak */}
      <group position={[0.38, 0.15, 0.15]}>
        <mesh rotation={[0.2, 0, -0.8]} material={bodyMat} castShadow>
          <capsuleGeometry args={[0.07, 0.3, 8, 12]} />
        </mesh>
        {/* Modak (sweet dumpling) */}
        <mesh position={[0.28, -0.1, 0.05]}>
          <sphereGeometry args={[0.06, 12, 12]} />
          <meshStandardMaterial color="#f5deb3" metalness={0.1} roughness={0.7} transparent opacity={opacity} />
        </mesh>
      </group>

      {/* Lower Left Arm — resting or holding axe/noose */}
      <group position={[-0.38, 0.15, 0.15]}>
        <mesh rotation={[0.2, 0, 0.8]} material={bodyMat} castShadow>
          <capsuleGeometry args={[0.07, 0.3, 8, 12]} />
        </mesh>
        <group position={[-0.28, -0.1, 0.05]}>
          {/* Symbolic ankusha (goad) — small golden rod */}
          <mesh rotation={[0, 0, 0.3]} material={goldMat}>
            <cylinderGeometry args={[0.012, 0.012, 0.2, 6]} />
          </mesh>
          <mesh position={[0, 0.12, 0]} material={goldMat}>
            <sphereGeometry args={[0.025, 8, 8]} />
          </mesh>
        </group>
      </group>

      {/* === LOTUS PEDESTAL === */}
      <LotusPedestal position={[0, -1.0, 0]} opacity={opacity} />

      {/* === INNER DIVINE LIGHT === */}
      <pointLight
        position={[0, 0.5, 0.5]}
        color="#ffc850"
        intensity={1.5 * opacity}
        distance={4}
        decay={2}
      />
    </group>
  );
}

/**
 * Lotus pedestal that Ganesh sits upon.
 * Concentric petal layers with subtle floating animation.
 */
function LotusPedestal({ position, opacity }) {
  const groupRef = useRef();

  const petalMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#d4a0b0',
        metalness: 0.15,
        roughness: 0.5,
        emissive: '#3d1020',
        emissiveIntensity: 0.1,
        transparent: true,
        side: THREE.DoubleSide,
      }),
    []
  );

  const goldBaseMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#b8860b',
        metalness: 0.8,
        roughness: 0.25,
        emissive: '#3d2200',
        emissiveIntensity: 0.15,
        transparent: true,
      }),
    []
  );

  useFrame((state) => {
    if (!groupRef.current) return;
    const time = state.clock.elapsedTime;
    // Very subtle floating motion
    groupRef.current.position.y = position[1] + Math.sin(time * 0.5) * 0.015;
    petalMat.opacity = opacity;
    goldBaseMat.opacity = opacity;
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Gold base disc */}
      <mesh material={goldBaseMat} receiveShadow>
        <cylinderGeometry args={[0.6, 0.7, 0.1, 16]} />
      </mesh>

      {/* Outer petal ring */}
      {Array.from({ length: 10 }).map((_, i) => {
        const angle = (i / 10) * Math.PI * 2;
        return (
          <mesh
            key={`outer-${i}`}
            position={[Math.cos(angle) * 0.55, 0.08, Math.sin(angle) * 0.55]}
            rotation={[-0.5, angle, 0]}
            material={petalMat}
          >
            <sphereGeometry args={[0.12, 8, 6]} />
          </mesh>
        );
      })}

      {/* Inner petal ring */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2 + 0.2;
        return (
          <mesh
            key={`inner-${i}`}
            position={[Math.cos(angle) * 0.35, 0.14, Math.sin(angle) * 0.35]}
            rotation={[-0.3, angle, 0]}
            material={petalMat}
          >
            <sphereGeometry args={[0.09, 8, 6]} />
          </mesh>
        );
      })}

      {/* Center */}
      <mesh position={[0, 0.16, 0]} material={goldBaseMat}>
        <sphereGeometry args={[0.15, 12, 12]} />
      </mesh>
    </group>
  );
}
