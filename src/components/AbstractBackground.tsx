import React, { useEffect, useRef } from 'react';

interface AbstractBackgroundProps {
  className?: string;
  intensity?: 'subtle' | 'normal' | 'vibrant';
  interactive?: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseRadius: number;
  color: string;
  glowColor: string;
  alpha: number;
  phase: number;
  pulseSpeed: number;
}

/**
 * Autonomous Abstract Canvas Background Engine
 * Cycles fluidly and infinitely: Waves -> Particles -> Constellation -> Waves
 * Reacts visibly to mouse position and scroll velocity/depth with vibrant neon cyber aesthetic.
 */
export const AbstractBackground: React.FC<AbstractBackgroundProps> = ({
  className = '',
  intensity = 'vibrant',
  interactive = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef<{ x: number; y: number; active: boolean }>({
    x: -1000,
    y: -1000,
    active: false,
  });

  const scrollRef = useRef<{ y: number; lastY: number; velocity: number }>({
    y: 0,
    lastY: 0,
    velocity: 0,
  });

  const animFrameIdRef = useRef<number | null>(null);
  // Softened slightly so the animations are subtle yet clearly visible
  const intensityMultiplier = intensity === 'subtle' ? 0.45 : intensity === 'normal' ? 0.65 : 0.78;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initParticles();
    };

    window.addEventListener('resize', handleResize);

    // Track scroll for reactive dynamics
    const handleScroll = () => {
      const currentY = window.scrollY || window.pageYOffset;
      const delta = currentY - scrollRef.current.lastY;
      scrollRef.current.velocity = delta;
      scrollRef.current.y = currentY;
      scrollRef.current.lastY = currentY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    // Particles count - rich enough to be visually impressive
    const particleCount = Math.min(Math.floor((width * height) / 9500), 90);
    let particles: Particle[] = [];

    const neonPalette = [
      { color: '#00FF88', glow: 'rgba(0, 255, 136, 0.6)' },
      { color: '#00F0FF', glow: 'rgba(0, 240, 255, 0.6)' },
      { color: '#4EFA9D', glow: 'rgba(78, 250, 157, 0.55)' },
      { color: '#00E5A3', glow: 'rgba(0, 229, 163, 0.55)' },
    ];

    const initParticles = () => {
      particles = [];
      for (let i = 0; i < particleCount; i++) {
        const baseRadius = Math.random() * 2.8 + 1.8;
        const pChoice = neonPalette[Math.floor(Math.random() * neonPalette.length)];
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.9,
          vy: (Math.random() - 0.5) * 0.9,
          radius: baseRadius,
          baseRadius,
          color: pChoice.color,
          glowColor: pChoice.glow,
          alpha: Math.random() * 0.4 + 0.6,
          phase: Math.random() * Math.PI * 2,
          pulseSpeed: 0.02 + Math.random() * 0.03,
        });
      }
    };

    initParticles();

    // Mouse tracking
    const handleMouseMove = (e: MouseEvent) => {
      if (!interactive) return;
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
      mouseRef.current.active = true;
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
      mouseRef.current.x = -1000;
      mouseRef.current.y = -1000;
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    let time = 0;
    const CYCLE_DURATION = 21; // 21 seconds full cycle (7s waves -> 7s particles -> 7s constellation)
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const render = () => {
      time += 0.016;

      // Dampen scroll velocity
      scrollRef.current.velocity *= 0.92;
      const scrollPush = Math.max(-12, Math.min(12, scrollRef.current.velocity * 0.18));

      // 1. Dark deep cyber background gradient
      const bgGrad = ctx.createRadialGradient(
        width * 0.5,
        height * 0.2,
        60,
        width * 0.5,
        height * 0.6,
        Math.max(width, height) * 0.95
      );
      bgGrad.addColorStop(0, '#0E1713');
      bgGrad.addColorStop(0.4, '#080E0B');
      bgGrad.addColorStop(1, '#030504');

      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Visible crisp Cyber Matrix Grid
      ctx.strokeStyle = 'rgba(0, 255, 136, 0.06)';
      ctx.lineWidth = 1;
      const gridSize = 56;
      ctx.beginPath();
      for (let x = 0; x < width; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      // 3. Autonomous Infinite Tri-Phase Weights Calculation
      // 0-7s: Waves dominate, fading into Particles
      // 7-14s: Particles dominate, fading into Constellation
      // 14-21s: Constellation dominates, fading into Waves
      const cycleTime = time % CYCLE_DURATION;
      const phaseDuration = 7;
      const phaseIndex = Math.floor(cycleTime / phaseDuration); // 0, 1, or 2
      const phaseT = (cycleTime % phaseDuration) / phaseDuration; // 0 to 1

      let wavesWeight = 0.25;
      let particlesWeight = 0.45;
      let constellationWeight = 0.3;

      if (phaseIndex === 0) {
        // Waves phase
        wavesWeight = 0.4 + 0.6 * Math.sin(phaseT * Math.PI);
        particlesWeight = 0.3 + 0.4 * (phaseT > 0.5 ? Math.sin((phaseT - 0.5) * 2 * (Math.PI / 2)) : 0);
        constellationWeight = 0.2 * (1 - phaseT);
      } else if (phaseIndex === 1) {
        // Particles phase
        wavesWeight = 0.2 * (1 - phaseT);
        particlesWeight = 0.5 + 0.5 * Math.sin(phaseT * Math.PI);
        constellationWeight = 0.3 + 0.5 * (phaseT > 0.5 ? Math.sin((phaseT - 0.5) * 2 * (Math.PI / 2)) : 0);
      } else {
        // Constellation phase
        wavesWeight = 0.25 + 0.4 * (phaseT > 0.5 ? Math.sin((phaseT - 0.5) * 2 * (Math.PI / 2)) : 0);
        particlesWeight = 0.3 * (1 - phaseT);
        constellationWeight = 0.4 + 0.6 * Math.sin(phaseT * Math.PI);
      }

      // 4. VIBRANT WAVES RENDERING
      if (wavesWeight > 0.15) {
        const waveCount = 4;
        for (let w = 0; w < waveCount; w++) {
          ctx.beginPath();
          const waveOffset = w * 1.4;
          const yCenter = height * (0.22 + w * 0.18) + (scrollRef.current.y * 0.05) % (height * 0.3);
          ctx.moveTo(0, yCenter);

          const freq = 0.0028 + w * 0.0006;
          const amp = (55 + w * 18) * wavesWeight;

          for (let x = 0; x <= width; x += 16) {
            const angle = x * freq + time * (0.65 + w * 0.22) + waveOffset;
            const y = yCenter + Math.sin(angle) * amp + Math.cos(angle * 0.7) * 20;
            ctx.lineTo(x, y);
          }

          // Glowing multi-stop gradient
          const grad = ctx.createLinearGradient(0, 0, width, 0);
          grad.addColorStop(0, 'rgba(0, 255, 136, 0)');
          grad.addColorStop(0.2, `rgba(0, 255, 136, ${0.32 * intensityMultiplier * wavesWeight})`);
          grad.addColorStop(0.5, `rgba(0, 240, 255, ${0.28 * intensityMultiplier * wavesWeight})`);
          grad.addColorStop(0.8, `rgba(78, 250, 157, ${0.25 * intensityMultiplier * wavesWeight})`);
          grad.addColorStop(1, 'rgba(0, 255, 136, 0)');

          ctx.strokeStyle = grad;
          ctx.lineWidth = (2.6 - w * 0.35) * (0.8 + wavesWeight * 0.4);
          ctx.stroke();

          // Ambient secondary glow layer
          ctx.lineWidth = 6;
          ctx.strokeStyle = `rgba(0, 255, 136, ${0.05 * intensityMultiplier * wavesWeight})`;
          ctx.stroke();
        }
      }

      // 5. VIBRANT PARTICLES & CONSTELLATION RENDERING
      const mouse = mouseRef.current;
      const maxDistance = 160;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        if (!prefersReducedMotion) {
          p.phase += p.pulseSpeed;
          p.x += p.vx;
          // React dynamically to scroll displacement
          p.y += p.vy + scrollPush;

          if (p.x < -20) p.x = width + 20;
          if (p.x > width + 20) p.x = -20;
          if (p.y < -20) p.y = height + 20;
          if (p.y > height + 20) p.y = -20;

          // Interactive mouse avoidance/pull
          if (mouse.active) {
            const dx = mouse.x - p.x;
            const dy = mouse.y - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 190 && dist > 0) {
              const force = (190 - dist) / 190;
              p.x -= (dx / dist) * force * 2.2;
              p.y -= (dy / dist) * force * 2.2;
            }
          }
        }

        // Particle Glow & Core
        const pulse = Math.sin(p.phase) * 0.25;
        const currentAlpha = Math.min(1, Math.max(0.18, (p.alpha + pulse) * intensityMultiplier * (0.5 + particlesWeight * 0.45)));
        const currentRadius = p.radius * (0.85 + particlesWeight * 0.35);

        // Core bright dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, currentRadius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = currentAlpha;
        ctx.fill();

        // Luminescent radial halo (distinctly visible neon glow)
        const haloRadius = currentRadius * 3.8;
        const haloGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, haloRadius);
        haloGrad.addColorStop(0, p.glowColor);
        haloGrad.addColorStop(1, 'rgba(0, 255, 136, 0)');

        ctx.beginPath();
        ctx.arc(p.x, p.y, haloRadius, 0, Math.PI * 2);
        ctx.fillStyle = haloGrad;
        ctx.globalAlpha = currentAlpha * 0.32;
        ctx.fill();
        ctx.globalAlpha = 1;

        // 6. CONSTELLATION INTERCONNECTS
        if (constellationWeight > 0.2) {
          for (let j = i + 1; j < particles.length; j++) {
            const p2 = particles[j];
            const dx = p.x - p2.x;
            const dy = p.y - p2.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < maxDistance) {
              const lineAlpha = (1 - dist / maxDistance) * 0.32 * intensityMultiplier * constellationWeight;
              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(p2.x, p2.y);

              // Gradient between the two nodes
              const lineGrad = ctx.createLinearGradient(p.x, p.y, p2.x, p2.y);
              lineGrad.addColorStop(0, p.color);
              lineGrad.addColorStop(1, p2.color);

              ctx.strokeStyle = lineGrad;
              ctx.globalAlpha = lineAlpha;
              ctx.lineWidth = 1.1;
              ctx.stroke();
              ctx.globalAlpha = 1;
            }
          }

          // Active mouse tethering lines
          if (mouse.active) {
            const dx = p.x - mouse.x;
            const dy = p.y - mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 170) {
              const lineAlpha = (1 - dist / 170) * 0.45 * intensityMultiplier * constellationWeight;
              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(mouse.x, mouse.y);
              ctx.strokeStyle = '#00FF88';
              ctx.globalAlpha = lineAlpha;
              ctx.lineWidth = 1.2;
              ctx.stroke();
              ctx.globalAlpha = 1;
            }
          }
        }
      }

      // 7. Cursor Glow Aura
      if (mouse.active && interactive) {
        const auraGrad = ctx.createRadialGradient(
          mouse.x,
          mouse.y,
          0,
          mouse.x,
          mouse.y,
          130
        );
        auraGrad.addColorStop(0, 'rgba(0, 255, 136, 0.12)');
        auraGrad.addColorStop(0.5, 'rgba(0, 240, 255, 0.05)');
        auraGrad.addColorStop(1, 'rgba(0, 255, 136, 0)');

        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 140, 0, Math.PI * 2);
        ctx.fillStyle = auraGrad;
        ctx.fill();
      }

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    animFrameIdRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [intensityMultiplier, interactive]);

  return (
    <div className={`fixed inset-0 pointer-events-none overflow-hidden z-0 ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{ pointerEvents: interactive ? 'auto' : 'none' }}
      />
    </div>
  );
};
