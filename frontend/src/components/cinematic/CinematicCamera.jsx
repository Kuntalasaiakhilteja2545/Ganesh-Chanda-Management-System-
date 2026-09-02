import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * CinematicCamera — GSAP-driven camera choreography with smooth lerping.
 *
 * Reads target camera position from animValues (driven by GSAP timeline),
 * and smoothly interpolates the actual camera toward those targets each frame.
 * Also applies subtle mouse parallax for a "living scene" feel.
 */
export default function CinematicCamera({
  targetZ = 5.5,
  targetY = 0.8,
  mouseX = 0,
  mouseY = 0,
  lookAtY = 0.3,
}) {
  const { camera } = useThree();
  const targetRef = useRef(new THREE.Vector3(0, lookAtY, 0));

  useFrame(() => {
    // Mouse parallax offset (very subtle, ~1-2 degrees worth)
    const parallaxX = mouseX * 0.3;
    const parallaxY = mouseY * 0.15;

    // Smooth lerp camera position toward GSAP-driven targets
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, parallaxX, 0.02);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY + parallaxY, 0.02);
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, 0.02);

    // Look-at target (slightly above center — Ganesh's chest/head area)
    targetRef.current.y = THREE.MathUtils.lerp(targetRef.current.y, lookAtY, 0.02);
    camera.lookAt(targetRef.current);
  });

  return null; // This component only manipulates the camera, no geometry
}
