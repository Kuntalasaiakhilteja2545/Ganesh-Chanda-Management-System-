import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * GoldenParticles — floating golden dust / divine incense particles.
 * Slow upward drift with gentle horizontal sway.
 * Represents the sacred atmosphere of the temple environment.
 */
export default function GoldenParticles({ count = 80, opacity = 0.7, spread = 6 }) {
  const pointsRef = useRef();

  // Generate initial particle positions and per-particle animation offsets
  const { positions, offsets, speeds, sizes } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const off = new Float32Array(count); // phase offset for sine wave sway
    const spd = new Float32Array(count); // vertical speed multiplier
    const sz = new Float32Array(count);  // per-particle size

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * spread;       // x
      pos[i * 3 + 1] = (Math.random() - 0.3) * spread;   // y (slightly biased upward)
      pos[i * 3 + 2] = (Math.random() - 0.5) * spread;   // z

      off[i] = Math.random() * Math.PI * 2;
      spd[i] = 0.15 + Math.random() * 0.25; // slow speeds
      sz[i] = 0.02 + Math.random() * 0.04;  // small particles
    }

    return { positions: pos, offsets: off, speeds: spd, sizes: sz };
  }, [count, spread]);

  // Animate particles each frame
  useFrame((state) => {
    if (!pointsRef.current) return;
    const time = state.clock.elapsedTime;
    const posArray = pointsRef.current.geometry.attributes.position.array;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      // Slow upward float
      posArray[i3 + 1] += speeds[i] * 0.003;
      // Gentle horizontal sway (sine wave)
      posArray[i3] += Math.sin(time * 0.3 + offsets[i]) * 0.001;
      posArray[i3 + 2] += Math.cos(time * 0.2 + offsets[i] * 1.3) * 0.0008;

      // Reset particle to bottom when it floats too high
      if (posArray[i3 + 1] > spread * 0.6) {
        posArray[i3 + 1] = -spread * 0.4;
        posArray[i3] = (Math.random() - 0.5) * spread;
        posArray[i3 + 2] = (Math.random() - 0.5) * spread;
      }
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;

    // Subtle global rotation for organic feel
    pointsRef.current.rotation.y = Math.sin(time * 0.05) * 0.1;
  });

  // Custom shader material for soft golden particles with size attenuation
  const shaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uOpacity: { value: opacity },
        uColor: { value: new THREE.Color('#ffb347') },
      },
      vertexShader: `
        attribute float aSize;
        varying float vAlpha;
        void main() {
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          // Size attenuation — closer particles appear larger
          gl_PointSize = aSize * 300.0 / (-mvPosition.z);
          // Fade particles based on distance and height
          vAlpha = smoothstep(-3.0, 0.0, position.y) * smoothstep(4.0, 1.0, position.y);
        }
      `,
      fragmentShader: `
        uniform float uOpacity;
        uniform vec3 uColor;
        varying float vAlpha;
        void main() {
          // Soft circular particle shape
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          float alpha = smoothstep(0.5, 0.1, dist) * vAlpha * uOpacity;
          gl_FragColor = vec4(uColor, alpha);
        }
      `,
    });
  }, [opacity]);

  // Update opacity uniform reactively
  useFrame(() => {
    if (shaderMaterial.uniforms) {
      shaderMaterial.uniforms.uOpacity.value = opacity;
    }
  });

  return (
    <points ref={pointsRef} material={shaderMaterial}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aSize"
          count={count}
          array={sizes}
          itemSize={1}
        />
      </bufferGeometry>
    </points>
  );
}
