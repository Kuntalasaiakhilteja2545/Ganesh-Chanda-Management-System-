import { useState, useEffect } from 'react';

/**
 * Hook to detect if user has prefers-reduced-motion enabled
 * or has explicitly requested skipping heavy animations.
 */
export function useReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(() => {
    if (typeof window === 'undefined') return false;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const savedPreference = localStorage.getItem('gms_reduced_motion');
    if (savedPreference !== null) {
      return savedPreference === 'true';
    }
    return mediaQuery.matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = () => {
      if (localStorage.getItem('gms_reduced_motion') === null) {
        setReducedMotion(mediaQuery.matches);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const setManualReducedMotion = (val) => {
    setReducedMotion(val);
    localStorage.setItem('gms_reduced_motion', String(val));
  };

  return { reducedMotion, setManualReducedMotion };
}
