import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useAnimationTimeline, CINEMATIC_STATES } from '../../hooks/useAnimationTimeline';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import GaneshScene from './GaneshScene';

/**
 * CinematicLogin — Master orchestrator component.
 *
 * Manages:
 * - GSAP animation timeline (via useAnimationTimeline hook)
 * - Quality tier detection (HIGH/MEDIUM/LOW)
 * - Mouse tracking for parallax
 * - Reduced motion support
 * - Skip Intro functionality
 *
 * Renders the 3D Canvas and exposes state to the parent Login page
 * so the overlay UI (title text, login form) can animate in sync.
 */
export default function CinematicLogin({ onStateChange, onAnimValues }) {
  const { reducedMotion } = useReducedMotion();
  const [quality, setQuality] = useState('HIGH');
  const [mouseNorm, setMouseNorm] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  // Detect quality tier based on device capabilities
  useEffect(() => {
    const detectQuality = () => {
      const isMobile = window.innerWidth < 768;
      const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
      const hasLowCores = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4;

      if (isMobile || hasLowCores) {
        setQuality('LOW');
      } else if (isTablet) {
        setQuality('MEDIUM');
      } else {
        setQuality('HIGH');
      }
    };

    detectQuality();
    window.addEventListener('resize', detectQuality);
    return () => window.removeEventListener('resize', detectQuality);
  }, []);

  // Animation timeline
  const { currentState, animValues, play, skip } = useAnimationTimeline({
    onStateChange: (state) => {
      onStateChange?.(state);
    },
    reducedMotion,
    quality,
  });

  // Forward animated values to parent continuously via ref-style callback
  useEffect(() => {
    if (onAnimValues) {
      // Poll animated values at 30fps for the HTML overlay
      const interval = setInterval(() => {
        onAnimValues(animValues);
      }, 33);
      return () => clearInterval(interval);
    }
  }, [animValues, onAnimValues]);

  // Start the cinematic timeline once mounted
  useEffect(() => {
    if (!reducedMotion) {
      // Small delay to ensure Canvas is rendered
      const timeout = setTimeout(() => play(), 300);
      return () => clearTimeout(timeout);
    }
  }, [reducedMotion, play]);

  // Mouse tracking for parallax (normalized -1 to 1)
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (quality === 'LOW') return; // Skip parallax on low-end
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      setMouseNorm({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [quality]);

  const handleSkip = useCallback(() => {
    skip();
  }, [skip]);

  return (
    <div ref={containerRef} className="cinematic-container">
      {/* 3D Scene */}
      <GaneshScene
        animValues={animValues}
        mouseNorm={mouseNorm}
        quality={quality}
      />

      {/* Skip Intro Button */}
      {currentState !== CINEMATIC_STATES.LOGIN_READY &&
        currentState !== CINEMATIC_STATES.LOGIN_REVEAL &&
        !reducedMotion && (
          <button
            onClick={handleSkip}
            className="cinematic-skip-btn"
            aria-label="Skip intro animation"
          >
            <span>Skip Intro</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 4 15 12 5 20 5 4" />
              <line x1="19" y1="5" x2="19" y2="19" />
            </svg>
          </button>
        )}
    </div>
  );
}
