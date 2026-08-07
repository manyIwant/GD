import { useState, useEffect, useMemo, useRef } from 'react';
import { useGameStore } from '@/hooks/useGameStore';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { HudPanel, DataItem, LocationHero, EmptyState, AlertBar } from '@/components/common/Hud';
import MiniGame from '@/components/game/MiniGame';
import { pickCosmicEvent, pickMiniGame } from '@/data/cosmicEvents';
import type { MiniGameType } from '@/data/cosmicEvents';
import type { EventChoice } from '@/data/cosmicEvents';
import type { CosmicEvent } from '@/types/types';
import type { OrderRow } from '@/types/types';
import { Radio, Snowflake, Eye, Moon, AlertTriangle, Zap, Gift, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

interface ProgressCalc {
  totalMs: number;
  displayElapsed: number;
  progress: number;
  remainingMs: number;
  wps: OrderRow['waypoints'];
  wpIndex: number;
}

export default function MonitorPage() {
  const store = useGameStore();
  const navigate = useNavigate();
  const { activeOrderId, orders, completeFlight } = store;
  const order = useMemo(() => orders.find((o) => o.id === activeOrderId), [orders, activeOrderId]);

  // 时间锚点（用于让航行时间在UI上更直观；DB时间才是真实数据）
  const [vTs, setVTs] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [hib, setHib] = useState(false);
  const [hibStart, setHibStart] = useState<number | null>(null);
  const [hibRate, setHibRate] = useState(1); // 休眠加速倍率
  const [hibCountdown, setHibCountdown] = useState(0);
  const [hibMode, setHibMode] = useState<'full' | 'next' | null>(null);
  const [hibBaseElapsed, setHibBaseElapsed] = useState(0); // 进入休眠时已积累的进度
  const [hibTargetProgress, setHibTargetProgress] = useState(100); // 浅度休眠目标进度

  // 宇宙事件
  const [eventOpen, setEventOpen] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<CosmicEvent | null>(null);
  const lastEventProgressRef = useRef(0);

  // 小游戏
  const [miniGameOpen, setMiniGameOpen] = useState(false);
  const [miniGameType, setMiniGameType] = useState<MiniGameType>('decode');
  const [pendingChoice, setPendingChoice] = useState<EventChoice | null>(null);

  // 抵达弹窗
  const [arriveOpen, setArriveOpen] = useState(false);

  useEffect(() => {
    if (order?.status === 'flying' && vTs === null) setVTs(Date.now());
    if (!order || order.status !== 'flying') { setVTs(null); setHib(false); setHibStart(null); setHibMode(null); setHibRate(1); }
  }, [order, vTs]);

  // 主刷新循环
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // 休眠倒计时
  useEffect(() => {
    if (hibCountdown <= 0) return;
    const t = setInterval(() => {
      setHibCountdown((c) => {
        if (c <= 1) { clearInterval(t); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [hibCountdown]);

  // 计算进度
  const calc: ProgressCalc | null = useMemo(() => {
    if (!order || order.status !== 'flying' || vTs === null) return null;
    const totalMs = new Date(order.arrival_time).getTime() - new Date(order.departure_time).getTime();
    let displayElapsed: number;
    if (hib && hibStart !== null) {
      // 休眠加速：在进入休眠前的进度基础上，按倍率快速推进
      displayElapsed = hibBaseElapsed + (Date.now() - hibStart) * hibRate;
    } else {
      displayElapsed = Date.now() - vTs;
    }
    const progress = totalMs > 0 ? Math.min(100, (displayElapsed / totalMs) * 100) : 0;
    const remainingMs = Math.max(0, totalMs - displayElapsed);
    const wps = order.waypoints || [];
    const wpIndex = Math.min(Math.floor(progress / 100 * Math.max(wps.length - 1, 1)), wps.length - 1);
    return { totalMs, displayElapsed, progress, remainingMs, wps, wpIndex };
  }, [order, vTs, hib, hibStart, hibRate, hibBaseElapsed, now]);

  // 抵达检测 + 宇宙事件
  useEffect(() => {
    if (!calc || !order) return;
    if (calc.progress >= 100 && order.status === 'flying') {
      setArriveOpen(true);
      return;
    }
    // 浅度休眠到达目标站点 → 自动唤醒
    if (hib && hibMode === 'next' && calc.progress >= hibTargetProgress - 0.01) {
      setHib(false);
      setHibStart(null);
      setHibRate(1);
      setHibMode(null);
      toast.info('🌙 已抵达休眠目标站，自动唤醒');
      return;
    }
    // 宇宙事件
    if (calc.progress - lastEventProgressRef.current > 15 && !hib) {
      const ev = pickCosmicEvent(calc.progress, false);
      if (ev) {
        lastEventProgressRef.current = calc.progress;
        setCurrentEvent(ev);
        setEventOpen(true);
      }
    }
  }, [calc?.progress, order, hib, hibMode, hibTargetProgress]);

  if (!order || order.status !== 'flying') {
    return (
      <div className="px-4 md:px-8 py-6 max-w-3xl mx-auto">
        <EmptyState
          icon="🛰"
          title="暂无航行中的飞船"
          desc="前往订单页启动一次航行"
          action={<Button className="btn-mech bg-laser text-primary-foreground" onClick={() => navigate('/orders')}>查看订单</Button>}
        />
      </div>
    );
  }

  if (!calc) return null;
  const { progress, remainingMs, wps, wpIndex } = calc;
  const cwp = wps[wpIndex] || wps[0];
  const nwp = wps[Math.min(wpIndex + 1, wps.length - 1)];
  const d = Math.floor(remainingMs / 86400000);
  const h = Math.floor((remainingMs % 86400000) / 3600000);
  const m = Math.floor((remainingMs % 3600000) / 60000);
  const s = Math.floor((remainingMs % 60000) / 1000);
  const speedC = (0.72 + progress / 100 * 0.2).toFixed(2);

  const startHibernation = (mode: 'full' | 'next') => {
    setHibMode(mode);
    setHibCountdown(10);
  };

  const finishHibernation = async () => {
    setHibCountdown(0);
    if (!calc || !order) return;
    const currentElapsed = calc.displayElapsed;
    if (hibMode === 'full') {
      // 深度休眠：约10秒加速完成航行
      const remaining = calc.totalMs - currentElapsed;
      const rate = Math.max(remaining / 10000, 1);
      setHibBaseElapsed(currentElapsed);
      setHibRate(rate);
      setHibStart(Date.now());
      setHib(true);
      toast.success('🧊 深度休眠启动·时间加速中');
    } else {
      // 浅度休眠：直接跳到下一站（无中转则直达目的地）
      const wps = order.waypoints || [];
      const targetProgress = wps.length > 1 ? Math.min(100, ((calc.wpIndex + 1) / Math.max(wps.length - 1, 1)) * 100) : 100;
      setHibTargetProgress(targetProgress);
      const targetElapsed = (targetProgress / 100) * calc.totalMs;
      setHibBaseElapsed(targetElapsed);
      setHibRate(0);
      setHibStart(Date.now());
      setHib(true);
      const nextName = wps.length > 1 ? wps[Math.min(calc.wpIndex + 1, wps.length - 1)].n : order.destination;
      toast.success(`🌙 浅度休眠·航行至 ${nextName}`);
    }
  };

  const handleArrive = async () => {
    setArriveOpen(false);
    await completeFlight(order.id);
    navigate('/logs');
  };

  // 处理宇宙事件选项
  const chooseEvent = (choice: EventChoice) => {
    setEventOpen(false);
    if (choice.type === 'game') {
      setPendingChoice(choice);
      const mg = pickMiniGame();
      setMiniGameType(mg.type);
      setMiniGameOpen(true);
    } else if (choice.type === 'risk') {
      // 风险选项：50% 概率成功
      const success = Math.random() < 0.5;
      applyEventResult(success, choice);
    } else {
      // 直接奖励
      applyEventResult(true, choice);
    }
  };

  const applyEventResult = (success: boolean, choice: EventChoice) => {
    if (success) {
      const xp = choice.rewardXp || 0;
      const bal = choice.rewardBalance || 0;
      if (xp > 0) store.addXp(xp);
      if (bal > 0) store.recharge(bal);
      toast.success(`✨ ${choice.label}成功`, { description: `+${xp} XP${bal > 0 ? ` · +${bal} 信用点` : ''}` });
    } else {
      const risk = choice.riskBalance || 0;
      if (risk > 0) store.deductBalance(risk);
      toast.error(`⚠ ${choice.label}失败`, { description: risk > 0 ? `损失 ${risk} 信用点` : '无损失' });
    }
  };

  const handleMiniGameClose = (success: boolean, _xp: number, balance: number) => {
    setMiniGameOpen(false);
    const choice = pendingChoice;
    setPendingChoice(null);
    if (!choice) return;
    applyEventResult(success, choice);
    if (balance !== 0) {
      // balance 已在 applyEventResult 中通过 reward/risk 处理，这里仅做提示兜底
    }
  };

  return (
    <div className="px-4 md:px-8 py-6 max-w-3xl mx-auto pb-24">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Radio className="w-5 h-5 text-laser animate-pulse" /> 实时监控
        </h1>
        <span className={`text-xs font-bold ${hib ? 'text-purple-400' : 'text-laser'}`}>{hib ? '💤 休眠中' : '⏱ 航行中'}</span>
      </div>

      {/* 倒计时 */}
      <HudPanel className="mb-4">
        <div className="p-5 text-center">
          {progress >= 100 ? (
            <>
              <div className="text-4xl mb-2">🎉</div>
              <div className="text-lg font-bold text-green-400">已抵达目的地</div>
              <div className="text-xs text-muted-foreground mt-1">{order.destination}</div>
            </>
          ) : (
            <>
              <div className="text-[10px] text-muted-foreground uppercase tracking-[0.3em] mb-1">{hib ? '休眠中·距唤醒' : '距抵达'}</div>
              <div className="text-3xl md:text-4xl font-bold font-mono-num text-laser text-glow">
                {d > 0 && `${d}d `}{String(h).padStart(2, '0')}h {String(m).padStart(2, '0')}m {String(s).padStart(2, '0')}s
              </div>
              <div className="text-xs text-muted-foreground mt-2">{order.destination}</div>
            </>
          )}
        </div>
      </HudPanel>

      {/* 进度条 */}
      <HudPanel title="航行数据" className="mb-4">
        <div className="p-4">
          <div className="h-3 bg-muted border border-border overflow-hidden mb-3">
            <div className="h-full bg-laser laser-line relative" style={{ width: `${progress.toFixed(1)}%` }}>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <DataItem label="航速" value={speedC} unit="c" accent />
            <DataItem label="进度" value={progress.toFixed(1)} unit="%" />
            <DataItem label="辐射" value={(0.5 + Math.random() * 0.6).toFixed(1)} unit="μSv" />
          </div>
        </div>
      </HudPanel>

      {/* 当前位置 */}
      <LocationHero bg={cwp.bg} name={`📍 ${cwp.n}`} desc={cwp.d} />

      <AlertBar tone="info" >
        <div className="flex items-center justify-between">
          <span>下一站：<b className="text-foreground">{nwp.n}</b></span>
          <span className="text-muted-foreground">通讯延迟 ~{(progress * 12000).toFixed(0)} 年</span>
        </div>
      </AlertBar>

      {/* 航行操作 */}
      {!hib && progress < 100 && (
        <HudPanel title="航行操作" className="mt-4">
          <div className="p-3 space-y-2">
            <button onClick={() => startHibernation('full')} className="w-full flex items-center gap-3 p-3 border-l-4 border-blue-500 bg-muted/30 hover:bg-muted/50 btn-mech text-left">
              <Snowflake className="w-5 h-5 text-blue-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-foreground">深度休眠·直达目的地</div>
                <div className="text-[11px] text-muted-foreground">休眠至{order.destination}自动唤醒</div>
              </div>
            </button>
            <button onClick={() => startHibernation('next')} className="w-full flex items-center gap-3 p-3 border-l-4 border-purple-500 bg-muted/30 hover:bg-muted/50 btn-mech text-left">
              <Moon className="w-5 h-5 text-purple-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-foreground">浅度休眠·下一站唤醒</div>
                <div className="text-[11px] text-muted-foreground">休眠至{nwp.n}唤醒，可观景后继续</div>
              </div>
            </button>
            <button onClick={() => { const mg = pickMiniGame(); setMiniGameType(mg.type); setMiniGameOpen(true); }} className="w-full flex items-center gap-3 p-3 border-l-4 border-laser bg-muted/30 hover:bg-muted/50 btn-mech text-left">
              <Eye className="w-5 h-5 text-laser shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-foreground">保持清醒·继续观测</div>
                <div className="text-[11px] text-muted-foreground">手动观测，可能触发宇宙事件</div>
              </div>
            </button>
          </div>
        </HudPanel>
      )}

      {/* 休眠状态卡 */}
      {hib && (
        <HudPanel className="mt-4">
          <div className="p-5 text-center">
            <div className="text-5xl mb-2">{hibMode === 'next' ? '🌙' : '🧊'}</div>
            <div className="text-base font-bold text-foreground">{hibMode === 'next' ? '浅度休眠中' : '深度休眠中'}</div>
            <div className="text-xs text-muted-foreground mt-1">{hibMode === 'next' ? '时间已冻结·等待抵达目标站' : '时间加速中·约10秒抵达'}</div>
            <div className="flex flex-wrap justify-center gap-3 mt-3 text-[11px] text-muted-foreground">
              <span>🧬 基因锁:激活</span>
              <span>💉 营养液:循环</span>
              <span>🌡 体温:36.2°C</span>
            </div>
            <Button variant="outline" size="sm" className="mt-3 btn-mech text-yellow-400" onClick={() => { setHib(false); setHibStart(null); setHibRate(1); setHibMode(null); toast.warning('⚠ 紧急唤醒完成'); }}>
              ⚠ 紧急唤醒
            </Button>
          </div>
        </HudPanel>
      )}

      {/* 休眠倒计时弹窗 */}
      <Dialog open={hibCountdown > 0} onOpenChange={(v) => !v && setHibCountdown(0)}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-sm bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">{hibMode === 'full' ? '🧊 深度休眠·直达目的地' : '🌙 浅度休眠·下一站唤醒'}</DialogTitle>
          </DialogHeader>
          <div className="text-center py-4">
            <div className="text-5xl font-bold font-mono-num text-laser text-glow">{hibCountdown}</div>
            <div className="text-xs text-muted-foreground mt-2">进入休眠舱中…</div>
            <div className="h-1 bg-muted mt-3 overflow-hidden">
              <div className="h-full bg-laser laser-line" style={{ width: `${(10 - hibCountdown) * 10}%` }} />
            </div>
          </div>
          {hibCountdown > 3 && (
            <DialogFooter>
              <Button variant="outline" className="w-full btn-mech" onClick={() => setHibCountdown(0)}>取消</Button>
            </DialogFooter>
          )}
          {hibCountdown <= 0 && (
            <DialogFooter>
              <Button className="w-full btn-mech bg-laser text-primary-foreground" onClick={finishHibernation}>确认进入休眠</Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* 宇宙事件弹窗 */}
      <Dialog open={eventOpen} onOpenChange={setEventOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg bg-card border-laser">
          <DialogHeader>
            <DialogTitle className="text-laser flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" /> 宇宙事件
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="text-base font-bold text-foreground">{currentEvent?.title}</div>
            <p className="text-xs text-muted-foreground leading-relaxed">{currentEvent?.body}</p>
            <div className="space-y-2">
              {(currentEvent?.choices || []).map((choice, idx) => (
                <button
                  key={idx}
                  onClick={() => chooseEvent(choice)}
                  className="w-full text-left p-3 border border-border bg-muted/30 hover:border-laser hover:bg-muted/50 btn-mech transition-colors"
                >
                  <div className="flex items-center gap-2 mb-1">
                    {choice.type === 'game' && <Zap className="w-3.5 h-3.5 text-laser shrink-0" />}
                    {choice.type === 'reward' && <Gift className="w-3.5 h-3.5 text-green-400 shrink-0" />}
                    {choice.type === 'risk' && <ShieldAlert className="w-3.5 h-3.5 text-yellow-400 shrink-0" />}
                    <span className="text-sm font-bold text-foreground">{choice.label}</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">{choice.desc}</div>
                </button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="w-full btn-mech" onClick={() => setEventOpen(false)}>忽略事件</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 小游戏 */}
      <MiniGame
        open={miniGameOpen}
        type={miniGameType}
        rewardXp={pendingChoice?.rewardXp}
        rewardBalance={pendingChoice?.rewardBalance}
        riskBalance={pendingChoice?.riskBalance}
        onClose={handleMiniGameClose}
      />

      {/* 抵达弹窗 */}
      <Dialog open={arriveOpen} onOpenChange={setArriveOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg bg-card border-laser">
          <DialogHeader>
            <DialogTitle className="text-green-400">🎉 已抵达目的地</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="text-center py-3">
              <div className="text-5xl mb-2">🌌</div>
              <div className="text-lg font-bold text-foreground">欢迎抵达 {order.destination}</div>
              <div className="text-xs text-muted-foreground mt-1">航程结束·单向航行</div>
            </div>
            <AlertBar tone="success">✅ 你的航行记录已生成星际明信片，可在飞行日志中查看。</AlertBar>
          </div>
          <DialogFooter>
            <Button className="w-full btn-mech bg-laser text-primary-foreground hover:bg-laser/90" onClick={handleArrive}>查看明信片</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
