import { useEffect, useRef } from 'react';

interface Props {
  className?: string;
  particleCount?: number;
  connectionDist?: number;
  mouseRadius?: number;
  colors?: string[];
}

// Canvas 粒子网络背景：漂浮发光粒子 + 粒子间连线 + 鼠标引力连线（粒子被光标吸引）
export default function ParticleNetwork({
  className = '',
  particleCount,
  connectionDist = 150,
  mouseRadius = 220,
  colors = ['0,212,255', '139,92,246', '34,211,238', '245,158,11'],
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let particles: {
      x: number; y: number; vx: number; vy: number;
      size: number; opacity: number; colorIdx: number;
      pulseSpeed: number; pulseOffset: number;
    }[] = [];
    let animFrame = 0;
    let lastTime = 0;
    const fpsLimit = 60;
    let mouseX = -1000;
    let mouseY = -1000;
    let targetMouseX = -1000;
    let targetMouseY = -1000;
    let running = true;

    const computeCount = () => {
      const area = width * height;
      const c = Math.floor(area / 14000);
      return Math.max(50, Math.min(c, 180));
    };

    const initParticles = () => {
      const count = particleCount ?? computeCount();
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        size: Math.random() * 1.8 + 0.8,
        opacity: Math.random() * 0.6 + 0.2,
        colorIdx: Math.floor(Math.random() * colors.length),
        pulseSpeed: Math.random() * 0.02 + 0.005,
        pulseOffset: Math.random() * Math.PI * 2,
      }));
    };

    const resize = () => {
      const parent = canvas.parentElement;
      width = parent?.clientWidth || window.innerWidth;
      height = parent?.clientHeight || window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      initParticles();
    };

    const drawConnections = () => {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < connectionDist) {
            const alpha = (1 - dist / connectionDist) * 0.35;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(0,212,255,${alpha})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }
    };

    const drawMouseConnections = () => {
      if (mouseX < -500) return;
      for (let i = 0; i < particles.length; i++) {
        const dx = particles[i].x - mouseX;
        const dy = particles[i].y - mouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < mouseRadius) {
          const alpha = (1 - dist / mouseRadius) * 0.75;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(mouseX, mouseY);
          ctx.strokeStyle = `rgba(139,92,246,${alpha})`;
          ctx.lineWidth = 0.9;
          ctx.stroke();
          // 引力：粒子被鼠标吸引
          const force = (1 - dist / mouseRadius) * 0.04;
          particles[i].vx += (dx / dist) * force;
          particles[i].vy += (dy / dist) * force;
        }
      }
    };

    const animate = (timestamp: number) => {
      if (!running) return;
      animFrame = requestAnimationFrame(animate);
      if (timestamp - lastTime < 1000 / fpsLimit) return;
      lastTime = timestamp;

      mouseX += (targetMouseX - mouseX) * 0.12;
      mouseY += (targetMouseY - mouseY) * 0.12;

      ctx.clearRect(0, 0, width, height);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        // 阻尼，避免引力累积导致粒子飞出
        p.vx *= 0.99;
        p.vy *= 0.99;
        p.opacity = 0.2 + Math.sin(timestamp * p.pulseSpeed + p.pulseOffset) * 0.2 + 0.3;
        const margin = 40;
        if (p.x < -margin) p.x = width + margin;
        if (p.x > width + margin) p.x = -margin;
        if (p.y < -margin) p.y = height + margin;
        if (p.y > height + margin) p.y = -margin;

        const color = colors[p.colorIdx];
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${color},${p.opacity})`;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${color},${p.opacity * 0.15})`;
        ctx.fill();
      }

      drawConnections();
      drawMouseConnections();
    };

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      targetMouseX = e.clientX - rect.left;
      targetMouseY = e.clientY - rect.top;
    };
    const onMouseLeave = () => { targetMouseX = -1000; targetMouseY = -1000; };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const rect = canvas.getBoundingClientRect();
        targetMouseX = e.touches[0].clientX - rect.left;
        targetMouseY = e.touches[0].clientY - rect.top;
      }
    };
    const onTouchEnd = () => { targetMouseX = -1000; targetMouseY = -1000; };
    const onVisibility = () => {
      if (document.hidden) { running = false; cancelAnimationFrame(animFrame); }
      else { running = true; lastTime = performance.now(); animFrame = requestAnimationFrame(animate); }
    };

    resize();
    animFrame = requestAnimationFrame(animate);
    window.addEventListener('resize', resize);
    canvas.addEventListener('mousemove', onMouseMove, { passive: true });
    canvas.addEventListener('mouseleave', onMouseLeave);
    canvas.addEventListener('touchmove', onTouchMove, { passive: true });
    canvas.addEventListener('touchend', onTouchEnd);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      running = false;
      cancelAnimationFrame(animFrame);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mouseleave', onMouseLeave);
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('touchend', onTouchEnd);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [particleCount, connectionDist, mouseRadius, colors]);

  return <canvas ref={canvasRef} className={`absolute inset-0 w-full h-full pointer-events-none ${className}`} />;
}