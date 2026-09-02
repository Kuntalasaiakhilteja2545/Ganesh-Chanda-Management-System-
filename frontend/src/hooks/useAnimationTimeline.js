import { useRef, useState, useCallback, useEffect } from 'react';
import gsap from 'gsap';

/**
 * Animation states for the cinematic login sequence.
 * These flow linearly: INTRO → TEMPLE_REVEAL → ... → DASHBOARD_TRANSITION
 */
export const CINEMATIC_STATES = {
  INTRO: 'INTRO',
  TEMPLE_REVEAL: 'TEMPLE_REVEAL',
  GANESH_REVEAL: 'GANESH_REVEAL',
  GANESH_IDLE: 'GANESH_IDLE',
  BLESSING: 'BLESSING',
  TITLE_REVEAL: 'TITLE_REVEAL',
  LOGIN_REVEAL: 'LOGIN_REVEAL',
  LOGIN_READY: 'LOGIN_READY',
  LOGIN_LOADING: 'LOGIN_LOADING',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  DASHBOARD_TRANSITION: 'DASHBOARD_TRANSITION',
};

const STATE_ORDER = [
  CINEMATIC_STATES.INTRO,
  CINEMATIC_STATES.TEMPLE_REVEAL,
  CINEMATIC_STATES.GANESH_REVEAL,
  CINEMATIC_STATES.GANESH_IDLE,
  CINEMATIC_STATES.BLESSING,
  CINEMATIC_STATES.TITLE_REVEAL,
  CINEMATIC_STATES.LOGIN_REVEAL,
  CINEMATIC_STATES.LOGIN_READY,
];

/**
 * Custom hook to manage the GSAP-based cinematic timeline.
 *
 * @param {Object} options
 * @param {Function} options.onStateChange - callback fired when animation state changes
 * @param {boolean} options.reducedMotion - if true, skip to LOGIN_READY immediately
 * @param {string} options.quality - 'HIGH' | 'MEDIUM' | 'LOW'
 * @returns timeline controls and current state
 */
export function useAnimationTimeline({ onStateChange, reducedMotion = false, quality = 'HIGH' } = {}) {
  const timelineRef = useRef(null);
  const [currentState, setCurrentState] = useState(CINEMATIC_STATES.INTRO);
  const [progress, setProgress] = useState(0);
  const animValuesRef = useRef({
    // Scene-wide animated values driven by GSAP
    ambientIntensity: 0,
    templeOpacity: 0,
    ganeshOpacity: 0,
    ganeshScale: 0.5,
    auraIntensity: 0,
    auraScale: 0.3,
    diyaIntensity: 0,
    particleOpacity: 0,
    blessingProgress: 0,
    titleOpacity: 0,
    loginOpacity: 0,
    loginY: 40,
    loginBlur: 15,
    cameraZ: 12,
    cameraY: 0.5,
    rimLightIntensity: 0,
    bloomIntensity: 0,
    vignetteIntensity: 0.9,
  });

  const transitionState = useCallback((newState) => {
    setCurrentState(newState);
    onStateChange?.(newState);
  }, [onStateChange]);

  // Build the master timeline
  const buildTimeline = useCallback(() => {
    if (timelineRef.current) {
      timelineRef.current.kill();
    }

    const v = animValuesRef.current;
    const tl = gsap.timeline({
      paused: true,
      onUpdate: () => {
        setProgress(tl.progress());
      },
    });

    // Durations scale with quality tier
    const durationScale = quality === 'HIGH' ? 1.0 : quality === 'MEDIUM' ? 0.6 : 0.35;
    const d = (seconds) => seconds * durationScale;

    // === PHASE 1: INTRO (0.0–1.0s) ===
    // Dark screen, particles begin
    tl.call(() => transitionState(CINEMATIC_STATES.INTRO), null, 0);
    tl.to(v, { particleOpacity: 0.3, duration: d(1.0), ease: 'power2.out' }, 0);
    tl.to(v, { vignetteIntensity: 0.7, duration: d(1.0), ease: 'power2.out' }, 0);

    // === PHASE 2: TEMPLE REVEAL (1.0–3.5s) ===
    tl.call(() => transitionState(CINEMATIC_STATES.TEMPLE_REVEAL), null, d(1.0));
    // Golden ambient light grows
    tl.to(v, { ambientIntensity: 0.4, duration: d(1.5), ease: 'power2.inOut' }, d(1.0));
    // Temple pillars become visible
    tl.to(v, { templeOpacity: 1.0, duration: d(2.0), ease: 'power2.inOut' }, d(1.2));
    // Camera begins dolly forward
    tl.to(v, { cameraZ: 7, duration: d(2.5), ease: 'power2.inOut' }, d(1.0));
    // Diya lamps ignite
    tl.to(v, { diyaIntensity: 1.0, duration: d(1.5), ease: 'power3.out' }, d(2.0));
    // Bloom ramps up for warmth
    tl.to(v, { bloomIntensity: 0.6, duration: d(1.5), ease: 'power2.out' }, d(1.5));

    // === PHASE 3: GANESH REVEAL (3.5–5.5s) ===
    tl.call(() => transitionState(CINEMATIC_STATES.GANESH_REVEAL), null, d(3.5));
    // Ganesh fades in with backlight
    tl.to(v, { ganeshOpacity: 1.0, duration: d(2.0), ease: 'power2.inOut' }, d(3.5));
    tl.to(v, { ganeshScale: 1.0, duration: d(2.0), ease: 'back.out(1.2)' }, d(3.5));
    // Rim light illuminates Ganesh
    tl.to(v, { rimLightIntensity: 2.0, duration: d(1.5), ease: 'power2.out' }, d(3.8));
    // Camera continues approach
    tl.to(v, { cameraZ: 5.5, cameraY: 0.8, duration: d(2.0), ease: 'power1.inOut' }, d(3.5));
    // Particles increase
    tl.to(v, { particleOpacity: 0.7, duration: d(1.5), ease: 'power2.out' }, d(4.0));

    // === PHASE 4: GANESH IDLE (5.5–7.5s) ===
    tl.call(() => transitionState(CINEMATIC_STATES.GANESH_IDLE), null, d(5.5));
    // Aura appears
    tl.to(v, { auraIntensity: 0.8, auraScale: 1.0, duration: d(1.5), ease: 'power2.out' }, d(5.5));
    // Ambient settles
    tl.to(v, { ambientIntensity: 0.6, duration: d(1.0), ease: 'power1.inOut' }, d(6.0));

    // === PHASE 5: BLESSING (7.5–9.0s) ===
    tl.call(() => transitionState(CINEMATIC_STATES.BLESSING), null, d(7.5));
    tl.to(v, { blessingProgress: 1.0, duration: d(1.5), ease: 'power2.inOut' }, d(7.5));
    // Aura pulses slightly
    tl.to(v, { auraIntensity: 1.0, duration: d(0.8), ease: 'power2.out' }, d(7.8));
    tl.to(v, { auraIntensity: 0.7, duration: d(0.7), ease: 'power2.inOut' }, d(8.6));
    // Vignette opens
    tl.to(v, { vignetteIntensity: 0.4, duration: d(1.0), ease: 'power2.out' }, d(7.5));

    // === PHASE 6: TITLE REVEAL (9.0–10.5s) ===
    tl.call(() => transitionState(CINEMATIC_STATES.TITLE_REVEAL), null, d(9.0));
    tl.to(v, { titleOpacity: 1.0, duration: d(1.2), ease: 'power2.out' }, d(9.0));

    // === PHASE 7: LOGIN REVEAL (10.5–12.0s) ===
    tl.call(() => transitionState(CINEMATIC_STATES.LOGIN_REVEAL), null, d(10.5));
    tl.to(v, { loginOpacity: 1.0, duration: d(0.9), ease: 'power2.out' }, d(10.5));
    tl.to(v, { loginY: 0, duration: d(0.9), ease: 'power3.out' }, d(10.5));
    tl.to(v, { loginBlur: 0, duration: d(0.7), ease: 'power2.out' }, d(10.7));

    // === PHASE 8: LOGIN READY ===
    tl.call(() => transitionState(CINEMATIC_STATES.LOGIN_READY), null, d(12.0));

    timelineRef.current = tl;
    return tl;
  }, [quality, transitionState]);

  // Skip to end
  const skip = useCallback(() => {
    const v = animValuesRef.current;
    if (timelineRef.current) {
      timelineRef.current.kill();
    }
    // Set all values to their final state
    Object.assign(v, {
      ambientIntensity: 0.6,
      templeOpacity: 1.0,
      ganeshOpacity: 1.0,
      ganeshScale: 1.0,
      auraIntensity: 0.7,
      auraScale: 1.0,
      diyaIntensity: 1.0,
      particleOpacity: 0.7,
      blessingProgress: 1.0,
      titleOpacity: 1.0,
      loginOpacity: 1.0,
      loginY: 0,
      loginBlur: 0,
      cameraZ: 5.5,
      cameraY: 0.8,
      rimLightIntensity: 2.0,
      bloomIntensity: 0.6,
      vignetteIntensity: 0.4,
    });
    setProgress(1);
    transitionState(CINEMATIC_STATES.LOGIN_READY);
  }, [transitionState]);

  // Start the timeline
  const play = useCallback(() => {
    const tl = buildTimeline();
    tl.play();
  }, [buildTimeline]);

  // Initialize
  useEffect(() => {
    if (reducedMotion) {
      skip();
    }
    return () => {
      if (timelineRef.current) {
        timelineRef.current.kill();
      }
    };
  }, [reducedMotion]);

  return {
    currentState,
    progress,
    animValues: animValuesRef.current,
    play,
    skip,
    timeline: timelineRef,
  };
}
