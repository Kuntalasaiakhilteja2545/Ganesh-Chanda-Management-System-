import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * DivineAura — golden radial light behind Ganesh.
 * Layered transparent planes with radial gradient for
 * a volumetric god-ray approximation.
 */
export default function DivineAura({ intensity = 0.7, scale = 1.0, position = [0, 0.3, -1.5] }) {
  const groupRef = useRef();

  // Create radial gradient texture programmatically
  const gradientTexture = useMemo(() => {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Golden radial gradient: bright center → transparent edge
    const gradient = ctx.createRadialGradient(
      size / 2, size / 2, 0,
      size / 2, size / 2, size / 2
    );
    gradient.addColorStop(0, 'rgba(255, 200, 80, 0.9)');
    gradient.addColorStop(0.2, 'rgba(255, 170, 50, 0.6)');
    gradient.addColorStop(0.5, 'rgba(255, 140, 30, 0.2)');
    gradient.addColorStop(0.8, 'rgba(200, 100, 20, 0.05)');
    gradient.addColorStop(1, 'rgba(150, 60, 10, 0.0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }, []);

  // Secondary softer outer glow texture
  const outerGlowTexture = useMemo(() => {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createRadialGradient(
      size / 2, size / 2, 0,
      size / 2, size / 2, size / 2
    );
    gradient.addColorStop(0, 'rgba(255, 220, 120, 0.4)');
    gradient.addColorStop(0.3, 'rgba(255, 180, 60, 0.15)');
    gradient.addColorStop(0.7, 'rgba(200, 120, 30, 0.03)');
    gradient.addColorStop(1, 'rgba(100, 50, 10, 0.0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }, []);

  // Subtle breathing / pulsing animation
  useFrame((state) => {
    if (!groupRef.current) return;
    const time = state.clock.elapsedTime;
    const breathe = 1.0 + Math.sin(time * 0.8) * 0.04 + Math.sin(time * 1.3) * 0.02;
    groupRef.current.scale.setScalar(scale * breathe);
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Primary inner aura */}
      <mesh>
        <planeGeometry args={[4.5, 4.5]} />
        <meshBasicMaterial
          map={gradientTexture}
          transparent
          opacity={intensity}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Secondary outer glow — larger, softer */}
      <mesh position={[0, 0, -0.1]}>
        <planeGeometry args={[7, 7]} />
        <meshBasicMaterial
          map={outerGlowTexture}
          transparent
          opacity={intensity * 0.5}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Subtle vertical god rays (thin stretched planes) */}
      {[-0.3, 0.15, 0.4, -0.1, 0.25].map((xOff, i) => (
        <mesh
          key={i}
          position={[xOff * 3, 0.5, -0.2]}
          rotation={[0, 0, (i - 2) * 0.08]}
        >
          <planeGeometry args={[0.08 + i * 0.01, 5]} />
          <meshBasicMaterial
            color="#ffc850"
            transparent
            opacity={intensity * 0.08}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}
