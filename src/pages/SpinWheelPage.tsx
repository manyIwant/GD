import { useState, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { spinWheel, fetchSpinRecords } from '@/services/api';
import { HudPanel, AlertBar } from '@/components/common/Hud';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Dices, Sparkles, History } from 'lucide-react';
import type { SpinRecordRow } from '@/types/types';

const SEGMENTS = [
  { label: '信用点 +300', color: '#22c55e', icon: '💰' },
  { label: '信用点 +1000', color: '#3b82f6', icon: '💎' },
  { label: '经验值 +200', color: '#eab308', icon: '⭐' },
  { label: '信用点 +200', color: '#06b6d4', icon: '🪙' },
  { label: '大奖！信用点 +5000', color: '#ef4444', icon: '🏆' },
  { label: '谢谢参与 +50', color: '#8b5cf6', icon: '🎁' },
];

const SPIN_COST = 500;

export default function SpinWheelPage() {
  const { profile, refreshProfile } = useAuth();
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<{ label: string; icon: string } | null>(null);
  const [records, setRecords] = useState<SpinRecordRow[]>([]);
  const wheelRef = useRef<HTMLDivElement>(null);
  const balance = profile?.balance ?? 0;

  const loadRecords = useCallback(async () => {
    if (!profile) return;
    try {
      const r = await fetchSpinRecords(profile.id, 8);
      setRecords(r);
    } catch { /* ignore */ }
  }, [profile]);

  const handleSpin = async () => {
    if (spinning) return;
    if (balance < SPIN_COST) {
      toast.error('信用点不足，无法抽奖');
      return;
    }
    setResult(null);
    setSpinning(true);

    try {
      const res = await spinWheel(SPIN_COST);
      // 依据服务端结果定位中奖扇区，让指针精确停在该扇区
      const winIndex = Math.max(
        0,
        SEGMENTS.findIndex((s) => s.icon === res.icon && s.label === res.label),
      );
      const segAngle = 360 / SEGMENTS.length;
      const mid = winIndex * segAngle + segAngle / 2; // 扇区中心角（顺时针，自顶部起）
      const jitter = (Math.random() - 0.5) * (segAngle * 0.5); // 停在扇区内随机位置，更自然
      const targetMod = (360 - (mid + jitter)) % 360;
      const currentMod = ((rotation % 360) + 360) % 360;
      let delta = targetMod - currentMod;
      if (delta < 0) delta += 360;
      const extraTurns = 360 * (5 + Math.floor(Math.random() * 3));
      setRotation((prev) => prev + extraTurns + delta);

      // 等待圆盘动画（4s）完全停止后再显示结果
      setTimeout(() => {
        setResult({ label: res.label, icon: res.icon });
        toast.success(`🎉 ${res.label}`);
        setSpinning(false);
      }, 4200);
      await refreshProfile();
      await loadRecords();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '抽奖失败';
      toast.error(msg);
      setSpinning(false);
    }
  };

  return (
    <div className="px-4 md:px-8 py-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Dices className="w-5 h-5 text-laser" /> 星际幸运转盘
        </h1>
        <span className="text-xs text-muted-foreground">每次消耗 {SPIN_COST} 信用点</span>
      </div>

      <AlertBar tone="info" className="mb-6">
        <Sparkles className="w-4 h-4 inline mr-1" /> 转动命运之轮，赢取信用点、经验值与稀有大奖！当前余额：{balance} 信用点。
      </AlertBar>

      <div className="flex flex-col items-center mb-6">
        <div className="relative w-72 h-72 md:w-80 md:h-80">
          {/* 指针 */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-20">
            <div className="w-0 h-0 border-l-[14px] border-r-[14px] border-t-[28px] border-l-transparent border-r-transparent border-t-laser drop-shadow-[0_0_6px_hsl(var(--laser))]" />
          </div>
          {/* 转盘 */}
          <div
            ref={wheelRef}
            className="w-full h-full rounded-full border-4 border-laser/60 overflow-hidden shadow-[0_0_30px_hsl(var(--laser)/0.3)]"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: spinning ? 'transform 4s cubic-bezier(0.17,0.67,0.12,0.99)' : 'none',
            }}
          >
            <svg viewBox="0 0 200 200" className="w-full h-full">
              {SEGMENTS.map((seg, i) => {
                const a1 = (i * 360) / SEGMENTS.length;
                const a2 = ((i + 1) * 360) / SEGMENTS.length;
                const r = 100;
                const x1 = 100 + r * Math.cos((a1 - 90) * Math.PI / 180);
                const y1 = 100 + r * Math.sin((a1 - 90) * Math.PI / 180);
                const x2 = 100 + r * Math.cos((a2 - 90) * Math.PI / 180);
                const y2 = 100 + r * Math.sin((a2 - 90) * Math.PI / 180);
                const mid = (a1 + a2) / 2;
                const tx = 100 + r * 0.55 * Math.cos((mid - 90) * Math.PI / 180);
                const ty = 100 + r * 0.55 * Math.sin((mid - 90) * Math.PI / 180);
                return (
                  <g key={i}>
                    <path d={`M100,100 L${x1},${y1} A100,100 0 0 1 ${x2},${y2} Z`} fill={seg.color} fillOpacity={0.85} stroke="#03040a" strokeWidth={1} />
                    <text x={tx} y={ty} fill="#fff" fontSize={11} fontWeight="bold" textAnchor="middle" transform={`rotate(${mid} ${tx} ${ty})`}>
                      {seg.icon}
                    </text>
                  </g>
                );
              })}
              <circle cx="100" cy="100" r="14" fill="#03040a" stroke="hsl(var(--laser))" strokeWidth="3" />
            </svg>
          </div>
        </div>

        <Button
          onClick={handleSpin}
          disabled={spinning}
          className="mt-6 btn-mech bg-laser text-primary-foreground hover:bg-laser/90 px-10 py-5 text-lg disabled:opacity-50"
        >
          {spinning ? '转动中...' : `开始抽奖（${SPIN_COST} 信用点）`}
        </Button>

        {result && (
          <div className="mt-4 px-6 py-3 border-2 border-laser/60 bg-laser/10 text-center">
            <span className="text-2xl mr-2">{result.icon}</span>
            <span className="text-lg font-bold text-laser">{result.label}</span>
          </div>
        )}
      </div>

      {/* 奖励说明 */}
      <HudPanel className="mb-6">
        <div className="p-4">
          <div className="text-sm font-bold text-foreground mb-3">🎁 奖励池</div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {SEGMENTS.map((s) => (
              <div key={s.label} className="flex items-center gap-2 p-2 border border-border bg-muted/20">
                <span className="text-lg">{s.icon}</span>
                <span className="text-xs text-muted-foreground">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </HudPanel>

      {/* 抽奖记录 */}
      <HudPanel>
        <div className="p-4">
          <div className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <History className="w-4 h-4 text-laser" /> 最近抽奖记录
          </div>
          {records.length === 0 ? (
            <div className="text-xs text-muted-foreground text-center py-4">暂无抽奖记录</div>
          ) : (
            <div className="space-y-2">
              {records.map((r) => (
                <div key={r.id} className="flex items-center justify-between p-2 border border-border bg-muted/10">
                  <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString('zh-CN')}</span>
                  <span className="text-xs font-medium text-laser">{r.reward_label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </HudPanel>
    </div>
  );
}