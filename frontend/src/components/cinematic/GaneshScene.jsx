import React, { Suspense, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import {
  EffectComposer,
  Bloom,
  Vignette,
} from '@react-three/postprocessing';
import * as THREE from 'three';

import TempleEnvironment from './TempleEnvironment';
import GaneshModel from './GaneshModel';
import DiyaLamps from './DiyaLamps';
import GoldenParticles from './GoldenParticles';
import DivineAura from './DivineAura';
import CinematicCamera from './CinematicCamera';

/**
 * AnimatedScene — inner component that reads animValues
 * and passes them as props to all scene children.
 * This runs inside the Canvas so it has access to useFrame.
 */
function AnimatedScene({ animValues, mouseNorm, quality }) {
  const ambientRef = useRef();
  const rimLightRef = useRef();
  const keyLightRef = useRef();

  const particleCount = quality === 'HIGH' ? 80 : quality === 'MEDIUM' ? 40 : 20;
  const diyaCount = quality === 'HIGH' ? 5 : quality === 'MEDIUM' ? 3 : 2;

  // Update lights each frame based on GSAP-animated values
  useFrame(() => {
    if (ambientRef.current) {
      ambientRef.current.intensity = animValues.ambientIntensity;
    }
    if (rimLightRef.current) {
      rimLightRef.current.intensity = animValues.rimLightIntensity;
    }
    if (keyLightRef.current) {
      keyLightRef.current.intensity = animValues.ambientIntensity * 2;
    }
  });

  return (
    <>
      {/* === LIGHTS === */}
      {/* Ambient fill — warm gold */}
      <ambientLight ref={ambientRef} color="#ffcc88" intensity={0} />

      {/* Key light — warm golden from upper right */}
      <directionalLight
        ref={keyLightRef}
        position={[3, 4, 2]}
        color="#ffc850"
        intensity={0}
        castShadow
        shadow-mapSize-width={quality === 'HIGH' ? 1024 : 512}
        shadow-mapSize-height={quality === 'HIGH' ? 1024 : 512}
        shadow-camera-near={0.1}
        shadow-camera-far={20}
        shadow-camera-left={-5}
        shadow-camera-right={5}
        shadow-camera-top={5}
        shadow-camera-bottom={-5}
      />

      {/* Rim/back light — warm orange from behind */}
      <directionalLight
        ref={rimLightRef}
        position={[-2, 2, -3]}
        color="#ff8833"
        intensity={0}
      />

      {/* Subtle fill from below — simulating diya light bounce */}
      <pointLight position={[0, -1, 2]} color="#ff9944" intensity={0.3} distance={6} />

      {/* === CAMERA === */}
      <CinematicCamera
        targetZ={animValues.cameraZ}
        targetY={animValues.cameraY}
        mouseX={mouseNorm.x}
        mouseY={mouseNorm.y}
        lookAtY={0.3}
      />

      {/* === SCENE OBJECTS === */}
      {/* Temple backdrop */}
      <TempleEnvironment opacity={animValues.templeOpacity} />

      {/* Divine aura behind Ganesh */}
      <DivineAura
        intensity={animValues.auraIntensity}
        scale={animValues.auraScale}
        position={[0, 0.3, -1.5]}
      />

      {/* Ganesh figure */}
      <GaneshModel
        opacity={animValues.ganeshOpacity}
        scale={animValues.ganeshScale}
        blessingProgress={animValues.blessingProgress}
        mouseX={mouseNorm.x}
        mouseY={mouseNorm.y}
      />

      {/* Diya oil lamps */}
      <DiyaLamps
        intensity={animValues.diyaIntensity}
        count={diyaCount}
      />

      {/* Golden particles */}
      <GoldenParticles
        count={particleCount}
        opacity={animValues.particleOpacity}
        spread={5}
      />
    </>
  );
}

/**
 * GaneshScene — the React Three Fiber Canvas wrapper.
 * Sets up the 3D rendering context, post-processing effects,
 * and delegates scene composition to AnimatedScene.
 */
export default function GaneshScene({ animValues, mouseNorm, quality = 'HIGH' }) {
  const dpr = quality === 'HIGH' ? [1, 2] : quality === 'MEDIUM' ? [1, 1.5] : [1, 1];

  return (
    <Canvas
      dpr={dpr}
      gl={{
        antialias: quality !== 'LOW',
        alpha: true,
        powerPreference: 'high-performance',
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 0.9,
      }}
      camera={{
        fov: 45,
        near: 0.1,
        far: 50,
        position: [0, 0.5, 12], // start far back
      }}
      shadows={quality !== 'LOW'}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 1,
      }}
    >
      <Suspense fallback={null}>
        <AnimatedScene
          animValues={animValues}
          mouseNorm={mouseNorm}
          quality={quality}
        />

        {/* Post-processing effects */}
        {quality !== 'LOW' && (
          <EffectComposer>
            <Bloom
              intensity={animValues.bloomIntensity || 0}
              luminanceThreshold={0.6}
              luminanceSmoothing={0.4}
              mipmapBlur
            />
            <Vignette
              offset={0.25}
              darkness={animValues.vignetteIntensity || 0.5}
            />
          </EffectComposer>
        )}
      </Suspense>
    </Canvas>
  );
}
