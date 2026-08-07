import { useEffect, useRef } from 'react';

// 星空背景 + 偶发流星
export default function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    const stars: { x: number; y: number; r: number; s: number; a: number }[] = [];
    for (let i = 0; i < 220; i++) {
      stars.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.4 + 0.4,
        s: Math.random() * 0.4 + 0.05,
        a: Math.random() * Math.PI * 2,
      });
    }

    let meteorTimer = 0;
    const meteors: { x: number; y: number; vx: number; vy: number; life: number }[] = [];

    const onResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', onResize);

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        s.a += 0.002;
        const alpha = 0.25 + Math.sin(s.a) * 0.3;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        ctx.fill();
        s.y += s.s * 0.3;
        if (s.y > h + 5) {
          s.y = -5;
          s.x = Math.random() * w;
        }
      }
      // 流星
      meteorTimer++;
      if (meteorTimer > 180 && Math.random() < 0.02) {
        meteorTimer = 0;
        meteors.push({
          x: Math.random() * w,
          y: Math.random() * h * 0.3,
          vx: 2.5 + Math.random() * 1.5,
          vy: 1 + Math.random() * 0.6,
          life: 60,
        });
      }
      for (let i = meteors.length - 1; i >= 0; i--) {
        const m = meteors[i];
        m.x += m.vx;
        m.y += m.vy;
        m.life--;
        const grad = ctx.createLinearGradient(m.x, m.y, m.x - m.vx * 12, m.y - m.vy * 12);
        grad.addColorStop(0, `rgba(255,200,120,${m.life / 60})`);
        grad.addColorStop(1, 'rgba(255,200,120,0)');
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(m.x, m.y);
        ctx.lineTo(m.x - m.vx * 12, m.y - m.vy * 12);
        ctx.stroke();
        if (m.life <= 0) meteors.splice(i, 1);
      }
      rafRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      style={{ background: 'radial-gradient(ellipse at 20% 10%, rgba(40,20,80,0.15), transparent 50%), radial-gradient(ellipse at 80% 90%, rgba(80,30,10,0.12), transparent 50%)' }}
    />
  );
}
