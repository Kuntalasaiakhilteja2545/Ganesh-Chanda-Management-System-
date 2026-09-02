import React, { useEffect, useState } from 'react';
import { useReducedMotion } from '../../hooks/useReducedMotion';

/**
 * Animated financial count-up component.
 * Smoothly interpolates from start value to target value without endless bouncing.
 */
export default function CountUpNumber({
  value = 0,
  duration = 900,
  prefix = '₹',
  decimals = 0,
  className = '',
}) {
  const { reducedMotion } = useReducedMotion();
  const numValue = typeof value === 'number' ? value : parseFloat(value) || 0;
  const [displayValue, setDisplayValue] = useState(reducedMotion ? numValue : 0);

  useEffect(() => {
    if (reducedMotion) {
      setDisplayValue(numValue);
      return;
    }

    let startTimestamp = null;
    const startVal = displayValue;
    const endVal = numValue;
    let animationFrameId;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      // Smooth ease-out cubic curve
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = startVal + (endVal - startVal) * easeOut;
      setDisplayValue(current);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setDisplayValue(endVal);
      }
    };

    animationFrameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrameId);
  }, [numValue, duration, reducedMotion]);

  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(displayValue);

  return (
    <span className={className}>
      {prefix}{formatted}
    </span>
  );
}
