// ===== 科幻路线预览图 =====
// 基于真实宇宙位置关系，标注出发地、中转站、目的地及各段光年
import { useMemo } from 'react';
import type { Waypoint } from '@/types/types';
import { findDestination, fmtLY } from '@/data/pricing';
import { Rocket, MapPin } from 'lucide-react';

interface Props {
  origin: string;
  waypoints: Waypoint[];
  destination: string;
}

// 星球在画布上的相对坐标（x: 0-100, y: 0-100），反映真实远近
function nodePos(ly: number, index: number, total: number): { x: number; y: number } {
  // 距离越大越靠右；纵向轻微错落避免重叠
  const logLy = Math.log10(ly + 0.0000001);
  const minLog = -8;
  const maxLog = 7;
  const t = (logLy - minLog) / (maxLog - minLog);
  const x = 8 + Math.min(0.92, Math.max(0, t)) * 84;
  const y = 50 + (index - (total - 1) / 2) * 18;
  return { x, y };
}

export default function RoutePreview({ origin, waypoints, destination }: Props) {
  const nodes = useMemo(() => {
    return waypoints.map((wp, i) => {
      const dest = findDestination(wp.n);
      const ly = dest ? dest.ly : 0;
      return { wp, ly, emoji: dest?.emoji || '🪐', color: dest?.color || '#94a3b8', pos: nodePos(ly, i, waypoints.length) };
    });
  }, [waypoints]);

  const totalLy = nodes.length ? nodes[nodes.length - 1].ly : 0;

  return (
    <div className="w-full">
      <div className="relative w-full aspect-[16/9] md:aspect-[2/1] bg-[#03040a] border border-cyan-500/30 overflow-hidden">
        {/* 深空背景 */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a2e]/80 via-[#03040a] to-[#1a0a2e]/60" />
        <div
          className="absolute inset-0 opacity-40"
          style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(124,58,237,0.15) 0%, rgba(6,182,212,0.08) 40%, transparent 75%)' }}
        />
        {/* 网格 */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {[20, 40, 60, 80].map((g) => (
            <line key={`h${g}`} x1="0" y1={g} x2="100" y2={g} stroke="rgba(0,240,255,0.05)" strokeWidth="0.1" />
          ))}
          {[20, 40, 60, 80].map((g) => (
            <line key={`v${g}`} x1={g} y1="0" x2={g} y2="100" stroke="rgba(0,240,255,0.05)" strokeWidth="0.1" />
          ))}
        </svg>

        {/* 航线连线 + 节点 */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {nodes.map((n, i) => {
            if (i === 0) return null;
            const prev = nodes[i - 1];
            return (
              <g key={i}>
                <line
                  x1={prev.pos.x} y1={prev.pos.y} x2={n.pos.x} y2={n.pos.y}
                  stroke="rgba(0,240,255,0.5)" strokeWidth="0.3"
                  strokeDasharray="1.5,1" vectorEffect="non-scaling-stroke"
                />
                {/* 段光年标注 */}
                <text
                  x={(prev.pos.x + n.pos.x) / 2}
                  y={(prev.pos.y + n.pos.y) / 2 - 2}
                  fill="rgba(0,240,255,0.7)"
                  fontSize="2.4"
                  textAnchor="middle"
                  fontFamily="monospace"
                >
                  {fmtLY(Math.abs(n.ly - prev.ly))} ly
                </text>
              </g>
            );
          })}
        </svg>

        {/* 节点 */}
        {nodes.map((n, i) => (
          <div
            key={i}
            className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
            style={{ left: `${n.pos.x}%`, top: `${n.pos.y}%` }}
          >
            <div
              className="w-7 h-7 md:w-9 md:h-9 rounded-full border-2 flex items-center justify-center text-sm md:text-base shrink-0"
              style={{
                borderColor: n.color,
                background: `${n.color}25`,
                boxShadow: `0 0 12px ${n.color}60`,
              }}
            >
              {n.emoji}
            </div>
            <div
              className="mt-1 text-[8px] md:text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/70 border whitespace-nowrap"
              style={{ color: n.color, borderColor: `${n.color}40` }}
            >
              {n.wp.n.length > 8 ? n.wp.n.slice(0, 8) + '…' : n.wp.n}
            </div>
          </div>
        ))}

        {/* 飞船图标 */}
        <div className="absolute top-2 left-3 text-cyan-400 flex items-center gap-1 text-[10px] font-mono-num">
          <Rocket className="w-3 h-3" /> ROUTE PREVIEW
        </div>
        {/* 总光年 */}
        <div className="absolute bottom-2 right-3 bg-black/70 border border-cyan-500/40 px-2 py-1 text-right">
          <div className="text-[8px] text-cyan-400/60 uppercase">总航程</div>
          <div className="text-sm font-bold text-cyan-400 font-mono-num">{fmtLY(totalLy)} 光年</div>
        </div>
      </div>

      {/* 图例：各段光年明细 */}
      <div className="mt-3 space-y-1">
        {nodes.map((n, i) => (
          <div key={i} className="flex items-center gap-2 text-[11px]">
            <MapPin className="w-3 h-3 shrink-0" style={{ color: n.color }} />
            <span className="text-foreground font-medium truncate flex-1 min-w-0">{n.wp.n}</span>
            <span className="text-muted-foreground font-mono-num shrink-0">{fmtLY(n.ly)} ly</span>
          </div>
        ))}
      </div>
    </div>
  );
}