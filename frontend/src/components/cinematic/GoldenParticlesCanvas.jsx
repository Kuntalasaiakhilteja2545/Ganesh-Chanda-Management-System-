import React, { useEffect, useRef } from 'react';

/**
 * GoldenParticlesCanvas — High performance 60fps golden dust & sacred temple embers
 * Lightweight canvas particle system that runs smoothly on desktop & mobile without WebGL overhead.
 */
export default function GoldenParticlesCanvas({ count = 65, active = true }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Particle pool
    const particles = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2.5 + 0.8,
      speedY: -(Math.random() * 0.4 + 0.15), // Slow upward drift
      speedX: (Math.random() - 0.5) * 0.3,
      opacity: Math.random() * 0.7 + 0.2,
      pulseSpeed: Math.random() * 0.02 + 0.01,
      hue: Math.random() > 0.3 ? 42 : 30, // 42 = Gold, 30 = Warm Amber
      angle: Math.random() * Math.PI * 2,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      if (active) {
        particles.forEach((p) => {
          p.y += p.speedY;
          p.angle += 0.02;
          p.x += Math.sin(p.angle) * 0.35 + p.speedX;

          // Wrap around screen
          if (p.y < -10) {
            p.y = height + 10;
            p.x = Math.random() * width;
          }
          if (p.x < -10) p.x = width + 10;
          if (p.x > width + 10) p.x = -10;

          // Glowing gold particle
          const currentOpacity = Math.sin(p.angle * 1.5) * 0.25 + p.opacity;

          ctx.beginPath();
          const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2.5);
          gradient.addColorStop(0, `hsla(${p.hue}, 100%, 75%, ${Math.min(1, currentOpacity)})`);
          gradient.addColorStop(0.5, `hsla(${p.hue}, 90%, 55%, ${Math.min(1, currentOpacity * 0.6)})`);
          gradient.addColorStop(1, `hsla(${p.hue}, 80%, 40%, 0)`);

          ctx.fillStyle = gradient;
          ctx.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [count, active]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-10 w-full h-full"
    />
  );
}
