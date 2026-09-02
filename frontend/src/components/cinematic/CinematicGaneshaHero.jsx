import React, { useState, useEffect } from 'react';
import ganeshImage from '../../assets/ganesh_cinematic.png';

/**
 * CinematicGaneshaHero — Majestic 3D Devotional Lord Ganesha
 * Featuring:
 * - Ultra-high-def photographic 3D devotional Ganesha on golden lotus throne
 * - Pulsing divine golden aura with volumetric light rays
 * - Breathing and ambient life animations
 * - Mouse parallax 3D tilt
 * - Flickering Diya oil lamp flames on left & right
 */
export default function CinematicGaneshaHero({
  isRevealed = true,
  isBlessing = false,
  mousePos = { x: 0, y: 0 },
}) {
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0 });

  // Smooth mouse tilt parallax
  useEffect(() => {
    const rx = (mousePos.y - window.innerHeight / 2) * -0.015;
    const ry = (mousePos.x - window.innerWidth / 2) * 0.015;
    setTilt({
      rotateX: Math.max(-6, Math.min(6, rx)),
      rotateY: Math.max(-6, Math.min(6, ry)),
    });
  }, [mousePos]);

  return (
    <div className="relative flex items-center justify-center select-none w-full max-w-[540px] aspect-square mx-auto">
      {/* 1. Volumetric Golden God Rays & Sunburst Aura */}
      <div
        className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-all duration-1000 ${
          isRevealed ? 'opacity-90 scale-100' : 'opacity-0 scale-75'
        }`}
      >
        {/* Core Divine Sunburst */}
        <div className="w-[480px] h-[480px] rounded-full bg-radial from-amber-400/40 via-yellow-500/20 to-transparent blur-3xl animate-pulse" />
        
        {/* Deep Crimson & Saffron Atmospheric Halo */}
        <div className="absolute w-[600px] h-[600px] rounded-full bg-radial from-orange-600/25 via-rose-900/15 to-transparent blur-2xl pointer-events-none" />

        {/* Radiating Golden Rays */}
        <div className="absolute w-full h-full bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.18)_0%,transparent_70%)] animate-spin [animation-duration:60s]" />
      </div>

      {/* 2. 3D Parallax Container for Lord Ganesha */}
      <div
        className={`relative z-20 w-full h-full flex items-center justify-center transition-all duration-1000 ease-out transform ${
          isRevealed
            ? 'opacity-100 translate-y-0 scale-100'
            : 'opacity-0 translate-y-12 scale-90'
        }`}
        style={{
          perspective: '1200px',
          transform: `perspective(1200px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg)`,
          transition: 'transform 0.15s ease-out, opacity 1s ease-out',
        }}
      >
        {/* Backlight Rim Glow on Ganesha */}
        <div className="absolute inset-x-8 top-10 bottom-6 bg-radial from-amber-400/30 via-yellow-500/10 to-transparent blur-xl rounded-full pointer-events-none" />

        {/* Lord Ganesha Cinematic Master Image with soft feathered edge mask */}
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden rounded-3xl [mask-image:radial-gradient(ellipse_at_center,black_75%,rgba(0,0,0,0.6)_90%,transparent_100%)]">
          <img
            src={ganeshImage}
            alt="Lord Ganesha - Cinematic Devotional Masterpiece"
            className="w-full h-full object-cover filter drop-shadow-[0_20px_35px_rgba(0,0,0,0.85)] drop-shadow-[0_0_50px_rgba(245,158,11,0.45)] transition-transform duration-700 hover:scale-[1.02]"
            style={{
              animation: 'ganeshBreathe 4.5s ease-in-out infinite',
            }}
          />

          {/* Golden blessing light flare when user interacts or logs in */}
          {isBlessing && (
            <div className="absolute top-[28%] left-[34%] w-24 h-24 bg-radial from-yellow-100 via-amber-300 to-transparent rounded-full blur-md animate-ping pointer-events-none" />
          )}
        </div>

        {/* 3. Left Flickering Diya Flame Light */}
        <div className="absolute bottom-10 left-3 flex flex-col items-center pointer-events-none z-30">
          <div className="w-4 h-6 bg-gradient-to-t from-orange-600 via-amber-400 to-yellow-100 rounded-full blur-[1.5px] animate-flame transform origin-bottom" />
          <div className="w-12 h-12 -mt-6 bg-amber-500/35 rounded-full blur-lg animate-pulse" />
        </div>

        {/* 4. Right Flickering Diya Flame Light */}
        <div className="absolute bottom-10 right-3 flex flex-col items-center pointer-events-none z-30">
          <div className="w-4 h-6 bg-gradient-to-t from-orange-600 via-amber-400 to-yellow-100 rounded-full blur-[1.5px] animate-flame transform origin-bottom [animation-delay:0.3s]" />
          <div className="w-12 h-12 -mt-6 bg-amber-500/35 rounded-full blur-lg animate-pulse [animation-delay:0.3s]" />
        </div>
      </div>

      {/* Subtle Lotus Pedestal Ambient Gold Reflection */}
      <div className="absolute -bottom-4 w-3/4 h-8 bg-radial from-amber-500/40 via-yellow-600/10 to-transparent blur-xl pointer-events-none" />
    </div>
  );
}
