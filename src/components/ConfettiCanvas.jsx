import React, { useEffect, useRef } from 'react';

export default function ConfettiCanvas({ duration = 5000, particleCount = 90 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let isCancelled = false;

    // Resize canvas
    const updateSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    updateSize();
    window.addEventListener('resize', updateSize);

    const colors = [
      '#00d4ff', '#00e5a0', '#ffb800', '#ff4d6d',
      '#a78bfa', '#f472b6', '#38bdf8', '#fbbf24', '#ffffff'
    ];

    const particles = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: canvas.width * (0.2 + Math.random() * 0.6),
        y: canvas.height * 0.4 + (Math.random() - 0.5) * 80,
        w: 6 + Math.random() * 8,
        h: 6 + Math.random() * 8,
        vx: (Math.random() - 0.5) * 16,
        vy: -8 - Math.random() * 12,
        gravity: 0.28 + Math.random() * 0.12,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 12,
        opacity: 1,
        shape: Math.random() > 0.4 ? 'rect' : 'circle',
        decay: 0.003 + Math.random() * 0.004,
      });
    }

    const startTime = Date.now();

    const render = () => {
      if (isCancelled) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let alive = false;
      const elapsed = Date.now() - startTime;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.vx *= 0.985;
        p.rotation += p.rotationSpeed;

        if (elapsed > duration - 2000) {
          p.opacity = Math.max(0, p.opacity - 0.015);
        }

        if (p.opacity > 0 && p.y < canvas.height + 40) {
          alive = true;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.globalAlpha = p.opacity;
          ctx.fillStyle = p.color;

          if (p.shape === 'rect') {
            ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
          } else {
            ctx.beginPath();
            ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
            ctx.fill();
          }

          ctx.restore();
        }
      }

      if (alive && elapsed < duration) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      isCancelled = true;
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', updateSize);
    };
  }, [duration, particleCount]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    />
  );
}
