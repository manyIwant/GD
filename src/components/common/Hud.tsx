import type { ReactNode } from 'react';

// HUD 风格的页面容器
export function HudPanel({ children, className = '', title }: { children: ReactNode; className?: string; title?: string }) {
  return (
    <div className={`relative bg-card border border-border ${className}`}>
      {title && (
        <>
          <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-muted/40">
            <span className="w-1.5 h-1.5 bg-laser laser-line" />
            <span className="text-xs tracking-[0.2em] text-muted-foreground font-mono-num uppercase">{title}</span>
            <span className="ml-auto hud-tickline flex-1 max-w-[80px]" />
          </div>
        </>
      )}
      <div className="relative">{children}</div>
    </div>
  );
}

// 空状态
export function EmptyState({ icon, title, desc, action }: { icon: string; title: string; desc?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="text-5xl mb-3 opacity-60">{icon}</div>
      <div className="text-base font-semibold text-foreground">{title}</div>
      {desc && <div className="text-xs text-muted-foreground mt-1 max-w-xs">{desc}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// 顶部状态栏（移动端）
export function StatusBar({ timeId }: { timeId?: string }) {
  return (
    <div className="flex items-center justify-between px-3 py-1.5 text-[11px] text-muted-foreground font-mono-num border-b border-border/50">
      <span>{new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span>
      <span className="flex items-center gap-2">
        <span>🔋 100%</span>
        <span className="hidden md:inline">SIGNAL ●●●●○</span>
      </span>
    </div>
  );
}

// 仪表盘数据项
export function DataItem({ label, value, unit, accent }: { label: string; value: string | number; unit?: string; accent?: boolean }) {
  return (
    <div className="bg-muted/30 border border-border/60 px-3 py-2">
      <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</div>
      <div className={`text-sm font-bold font-mono-num ${accent ? 'text-laser text-glow' : 'text-foreground'}`}>
        {value}
        {unit && <span className="text-[10px] text-muted-foreground ml-1">{unit}</span>}
      </div>
    </div>
  );
}

// 目的地 Hero
export function LocationHero({ bg, name, desc }: { bg: string; name: string; desc?: string }) {
  return (
    <div className="relative h-40 md:h-48 overflow-hidden border border-border">
      <div className={`absolute inset-0 ${bg}`} />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <div className="hud-tickline mb-2 opacity-60" />
        <div className="text-lg md:text-xl font-bold text-foreground text-glow">{name}</div>
        {desc && <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>}
      </div>
    </div>
  );
}

// 警示条
export function AlertBar({ children, tone = 'info', className = '' }: { children: ReactNode; tone?: 'info' | 'warning' | 'danger' | 'success'; className?: string }) {
  const tones: Record<string, string> = {
    info: 'border-border bg-muted/30 text-foreground',
    warning: 'border-yellow-600/50 bg-yellow-950/20 text-yellow-300',
    danger: 'border-red-600/50 bg-red-950/20 text-red-300',
    success: 'border-green-600/50 bg-green-950/20 text-green-300',
  };
  return <div className={`border px-4 py-3 text-xs leading-relaxed ${tones[tone]} ${className}`}>{children}</div>;
}
