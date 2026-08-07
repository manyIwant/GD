import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { HudPanel, AlertBar } from '@/components/common/Hud';
import { STAR_NODES, STAR_LINKS, STAR_TYPE_META } from '@/data/galaxyMap';
import type { StarNode } from '@/data/galaxyMap';
import { pickExploreEvent, MEMENTOS, EXPLORE_ACHIEVEMENTS } from '@/data/exploreEvents';
import type { ExploreEvent } from '@/data/exploreEvents';
import { useGameStore } from '@/hooks/useGameStore';
import { fmtPrice } from '@/data/pricing';
import { Rocket, Telescope, Zap, Lock, Star as StarIcon, Compass, Gift, Trophy, Wrench } from 'lucide-react';
import { toast } from 'sonner';

// 生成静态背景星星
function useStars(count: number) {
  return useMemo(
    () =>
      Array.from({ length: count }, () => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        r: Math.random() * 1.5 + 0.3,
        o: Math.random() * 0.6 + 0.2,
        d: Math.random() * 4 + 2,
      })),
    [count]
  );
}

// 生成星云粒子
function useNebula(count: number) {
  return useMemo(
    () =>
      Array.from({ length: count }, () => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        s: Math.random() * 200 + 80,
        c: ['rgba(124,58,237,0.08)', 'rgba(6,182,212,0.08)', 'rgba(236,72,153,0.06)'][Math.floor(Math.random() * 3)],
      })),
    [count]
  );
}

export default function StarMapPage() {
  const navigate = useNavigate();
  const store = useGameStore();
  const { profile } = store;
  const [selected, setSelected] = useState<StarNode | null>(null);
  const [discovered, setDiscovered] = useState<Set<string>>(new Set(STAR_NODES.filter((n) => n.status === 'discovered').map((n) => n.id)));
  const [warping, setWarping] = useState(false);
  const [warpTarget, setWarpTarget] = useState<StarNode | null>(null);
  const [shipPos, setShipPos] = useState({ x: 50, y: 50 });
  const [shipTarget, setShipTarget] = useState({ x: 50, y: 50 });
  const [scanOpen, setScanOpen] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [mouse, setMouse] = useState({ x: 50, y: 50 });
  const [exploreEvent, setExploreEvent] = useState<ExploreEvent | null>(null);
  const [exploreResult, setExploreResult] = useState<{ success: boolean; ev: ExploreEvent } | null>(null);
  const scanRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stars = useStars(180);
  const nebula = useNebula(6);
  const mapRef = useRef<HTMLDivElement>(null);

  // 鼠标引力追踪
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!mapRef.current) return;
    const rect = mapRef.current.getBoundingClientRect();
    setMouse({ x: ((e.clientX - rect.left) / rect.width) * 100, y: ((e.clientY - rect.top) / rect.height) * 100 });
  }, []);

  // 飞船平滑移动到目标
  useEffect(() => {
    if (shipPos.x === shipTarget.x && shipPos.y === shipTarget.y) return;
    const t = setInterval(() => {
      setShipPos((p) => {
        const dx = shipTarget.x - p.x;
        const dy = shipTarget.y - p.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 0.5) return shipTarget;
        const step = Math.min(dist, 1.5);
        return { x: p.x + (dx / dist) * step, y: p.y + (dy / dist) * step };
      });
    }, 30);
    return () => clearInterval(t);
  }, [shipTarget, shipPos]);

  // 曲速航行：移动飞船 + 解锁星球 + 触发探索事件
  const warpTo = useCallback(
    (node: StarNode) => {
      if (node.id === 'home') {
        toast.info('🏠 你已在母港');
        return;
      }
      setWarpTarget(node);
      setWarping(true);
      setShipTarget({ x: node.x, y: node.y });
      setTimeout(() => {
        setWarping(false);
        setDiscovered((prev) => {
          const next = new Set(prev);
          next.add(node.id);
          return next;
        });
        toast.success(`🚀 曲速航行完成！已抵达 ${node.name}`);
        setSelected(node);
        // 50% 概率触发探索事件
        if (Math.random() < 0.5) {
          setTimeout(() => setExploreEvent(pickExploreEvent()), 600);
        }
      }, 2600);
    },
    []
  );

  // 扫描（探索）动画
  const startScan = useCallback(() => {
    if (!selected) return;
    setScanOpen(true);
    setScanProgress(0);
    if (scanRef.current) clearInterval(scanRef.current);
    scanRef.current = setInterval(() => {
      setScanProgress((p) => {
        if (p >= 100) {
          if (scanRef.current) clearInterval(scanRef.current);
          setScanOpen(false);
          setDiscovered((prev) => {
            const next = new Set(prev);
            next.add(selected.id);
            return next;
          });
          toast.success(`🔭 扫描完成！${selected.name} 已加入你的银河版图`);
          // 扫描也有概率触发事件
          if (Math.random() < 0.4) {
            setTimeout(() => setExploreEvent(pickExploreEvent()), 500);
          }
          return 100;
        }
        return p + 4;
      });
    }, 60);
  }, [selected]);

  useEffect(() => () => { if (scanRef.current) clearInterval(scanRef.current); }, []);

  // 处理探索事件结果
  const resolveExploreEvent = async () => {
    if (!exploreEvent) return;
    const success = Math.random() < exploreEvent.successRate;
    setExploreEvent(null);
    setExploreResult({ success, ev: exploreEvent });

    if (success) {
      const ev = exploreEvent;
      if (ev.rewardType === 'credit') {
        await store.recharge(ev.rewardValue);
        toast.success(`✨ 探索成功！获得 ${fmtPrice(ev.rewardValue)} 信用点`);
      } else if (ev.rewardType === 'xp') {
        await store.addXp(ev.rewardValue);
        toast.success(`✨ 探索成功！获得 ${ev.rewardValue} XP`);
      } else if (ev.rewardType === 'memento') {
        const m = MEMENTOS[Math.floor(Math.random() * MEMENTOS.length)];
        await store.addMemento(m.name, m.desc, m.emoji);
        toast.success(`✨ 探索成功！获得神秘纪念品 ${m.emoji} ${m.name}`);
        await store.unlockExploreAchievement(EXPLORE_ACHIEVEMENTS[1].name);
      } else if (ev.rewardType === 'achievement') {
        await store.unlockExploreAchievement(EXPLORE_ACHIEVEMENTS[0].name);
        toast.success(`✨ 探索成功！解锁成就「${EXPLORE_ACHIEVEMENTS[0].name}」`);
      }
    } else {
      const ev = exploreEvent;
      if (ev.penaltyType === 'credit') {
        await store.deductBalance(ev.penaltyValue);
        toast.error(`⚠ 探索失败！${ev.penaltyLabel}`);
      } else if (ev.penaltyType === 'part') {
        // 损失一个已装备零件：扣除零件费用作为损失
        await store.deductBalance(ev.penaltyValue);
        toast.error(`⚠ 探索失败！飞船一个零件受损，维修花费 ${fmtPrice(ev.penaltyValue)}`);
      }
    }
  };

  const discoveredCount = discovered.size;
  const totalCount = STAR_NODES.length;
  const exploredPct = Math.round((discoveredCount / totalCount) * 100);
  const isDiscovered = (id: string) => discovered.has(id);
  const mementos = profile?.mementos || [];
  const achievements = profile?.explore_achievements || [];

  // 检查银河制图师成就
  useEffect(() => {
    if (discoveredCount >= Math.ceil(totalCount / 2) && !achievements.includes(EXPLORE_ACHIEVEMENTS[2].name)) {
      store.unlockExploreAchievement(EXPLORE_ACHIEVEMENTS[2].name);
    }
  }, [discoveredCount, totalCount, achievements, store]);

  return (
    <div
      ref={mapRef}
      onMouseMove={handleMouseMove}
      className="relative w-full min-h-[calc(100vh-64px)] md:min-h-screen overflow-hidden bg-[#03040a] cursor-crosshair"
    >
      {/* 深空背景渐变 */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a2e]/70 via-[#03040a] to-[#1a0a2e]/50" />
        {/* 星云团 */}
        {nebula.map((n, i) => (
          <div key={i} className="absolute rounded-full blur-[80px]" style={{ left: `${n.x}%`, top: `${n.y}%`, width: n.s, height: n.s, background: n.c }} />
        ))}
        {/* 银河旋臂 */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] aspect-[2/1] opacity-30"
          style={{ background: 'radial-gradient(ellipse at center, rgba(124,58,237,0.15) 0%, rgba(6,182,212,0.08) 30%, transparent 70%)', transform: 'translate(-50%,-50%) rotate(-15deg)' }}
        />
      </div>

      {/* 背景星星 */}
      <div className="absolute inset-0 pointer-events-none">
        {stars.map((s, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white animate-twinkle"
            style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.r, height: s.r, opacity: s.o, animationDelay: `${s.d}s`, animationDuration: `${s.d + 2}s` }}
          />
        ))}
      </div>

      {/* 顶部 HUD */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 md:p-6 pointer-events-none">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="pointer-events-auto">
            <h1 className="text-lg md:text-2xl font-bold text-white flex items-center gap-2">
              <Compass className="w-5 h-5 md:w-6 md:h-6 text-cyan-400" /> 银河星图
            </h1>
            <p className="text-[10px] md:text-xs text-cyan-400/60 font-mono-num mt-0.5">GALACTIC CHART · 你的银河版图</p>
          </div>
          <div className="flex items-center gap-2 pointer-events-auto">
            <HudPanel>
              <div className="px-3 py-1.5 text-center">
                <div className="text-[9px] text-cyan-400/60 uppercase">纪念品</div>
                <div className="text-sm font-bold text-pink-400 font-mono-num">{mementos.length}</div>
              </div>
            </HudPanel>
            <HudPanel>
              <div className="px-4 py-2 text-center">
                <div className="text-[10px] text-cyan-400/60 uppercase tracking-wider">已探索</div>
                <div className="text-lg font-bold font-mono-num text-cyan-400">{discoveredCount}/{totalCount}</div>
                <div className="w-24 h-1 bg-white/10 mt-1 overflow-hidden mx-auto">
                  <div className="h-full bg-cyan-400 transition-all duration-500" style={{ width: `${exploredPct}%` }} />
                </div>
              </div>
            </HudPanel>
          </div>
        </div>
      </div>

      {/* 星图主体 */}
      <div className="absolute inset-0 z-10">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
          {/* 航线连线（受鼠标引力吸引弯曲） */}
          {STAR_LINKS.map(([a, b], i) => {
            const na = STAR_NODES.find((n) => n.id === a)!;
            const nb = STAR_NODES.find((n) => n.id === b)!;
            const bothKnown = isDiscovered(a) && isDiscovered(b);
            const oneKnown = isDiscovered(a) || isDiscovered(b);
            // 控制点：向鼠标方向偏移（引力效果）
            const midX = (na.x + nb.x) / 2;
            const midY = (na.y + nb.y) / 2;
            const pullX = (mouse.x - midX) * 0.15;
            const pullY = (mouse.y - midY) * 0.15;
            const cx = midX + pullX;
            const cy = midY + pullY;
            return (
              <path
                key={i}
                d={`M ${na.x} ${na.y} Q ${cx} ${cy} ${nb.x} ${nb.y}`}
                fill="none"
                stroke={bothKnown ? 'rgba(0,240,255,0.5)' : oneKnown ? 'rgba(167,139,250,0.3)' : 'rgba(255,255,255,0.06)'}
                strokeWidth={bothKnown ? 0.25 : 0.12}
                strokeDasharray={bothKnown ? '0' : '1.2,1.2'}
                vectorEffect="non-scaling-stroke"
                className="transition-all duration-300"
              />
            );
          })}
        </svg>

        {/* 星球节点 */}
        {STAR_NODES.map((node) => {
          const known = isDiscovered(node.id);
          const meta = STAR_TYPE_META[node.type];
          return (
            <button
              key={node.id}
              type="button"
              onClick={() => setSelected(node)}
              className="absolute -translate-x-1/2 -translate-y-1/2 group"
              style={{ left: `${node.x}%`, top: `${node.y}%` }}
            >
              <div
                className="absolute inset-0 rounded-full animate-pulse-glow"
                style={{
                  width: node.size * 2.4,
                  height: node.size * 2.4,
                  left: -node.size * 1.2,
                  top: -node.size * 1.2,
                  background: `radial-gradient(circle, ${known ? node.color : '#555'}40 0%, transparent 70%)`,
                }}
              />
              <div
                className="relative flex items-center justify-center rounded-full border-2 transition-transform group-hover:scale-125"
                style={{
                  width: node.size,
                  height: node.size,
                  borderColor: known ? node.color : 'rgba(255,255,255,0.2)',
                  background: known ? `${node.color}30` : 'rgba(30,30,50,0.6)',
                  boxShadow: known ? `0 0 ${node.size}px ${node.color}60` : 'none',
                }}
              >
                <span className="text-xs md:text-sm">{known ? meta.icon : <Lock className="w-3 h-3 text-white/40" />}</span>
              </div>
              {known && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 whitespace-nowrap text-[9px] md:text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/60 border border-white/10" style={{ color: node.color }}>
                  {node.name}
                </div>
              )}
            </button>
          );
        })}

        {/* 玩家飞船 */}
        <div
          className="absolute z-20 -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${shipPos.x}%`, top: `${shipPos.y}%` }}
        >
          <div className={`text-2xl md:text-3xl ${warping ? 'animate-warp' : ''}`}>🚀</div>
          {warping && (
            <div className="absolute top-1/2 left-0 w-16 h-0.5 bg-gradient-to-r from-cyan-400 to-transparent -translate-y-1/2" />
          )}
        </div>
      </div>

      {/* 底部操作栏 */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-4 md:p-6 pointer-events-none">
        <div className="max-w-5xl mx-auto flex items-center justify-center gap-3 pointer-events-auto">
          <Button
            variant="outline"
            className="btn-mech border-purple-400/50 text-purple-400 hover:bg-purple-400/10"
            onClick={() => navigate('/ship-designer')}
          >
            <Wrench className="w-4 h-4 mr-1.5" /> 改装飞船
          </Button>
          <Button
            variant="outline"
            className="btn-mech border-cyan-400/50 text-cyan-400 hover:bg-cyan-400/10"
            onClick={() => navigate('/route')}
          >
            <Rocket className="w-4 h-4 mr-1.5" /> 预订航线
          </Button>
          <Button
            className="btn-mech bg-cyan-500/80 text-white hover:bg-cyan-500"
            onClick={() => { setShipTarget({ x: 50, y: 50 }); toast.info('🏠 返回母港'); }}
          >
            <Compass className="w-4 h-4 mr-1.5" /> 回到母港
          </Button>
        </div>
      </div>

      {/* 星球信息弹窗 */}
      <Dialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-md bg-[#0a0a2e] border border-cyan-500/30">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" style={{ color: selected?.color }}>
              <StarIcon className="w-5 h-5" /> {selected ? (isDiscovered(selected.id) ? selected.name : '未知星域') : ''}
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-3">
              {isDiscovered(selected.id) ? (
                <>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 bg-white/5 border border-white/10">
                      <div className="text-[10px] text-white/40 uppercase">类型</div>
                      <div className="font-bold" style={{ color: selected.color }}>{STAR_TYPE_META[selected.type].label}</div>
                    </div>
                    <div className="p-2 bg-white/5 border border-white/10">
                      <div className="text-[10px] text-white/40 uppercase">危险等级</div>
                      <div className="font-bold text-red-400">{'★'.repeat(selected.danger)}</div>
                    </div>
                    <div className="p-2 bg-white/5 border border-white/10">
                      <div className="text-[10px] text-white/40 uppercase">资源</div>
                      <div className="font-bold text-yellow-400">{selected.resource}</div>
                    </div>
                    <div className="p-2 bg-white/5 border border-white/10">
                      <div className="text-[10px] text-white/40 uppercase">探索状态</div>
                      <div className="font-bold text-green-400">✅ 已探索</div>
                    </div>
                  </div>
                  <p className="text-xs text-white/60 leading-relaxed">{selected.desc}</p>
                </>
              ) : (
                <>
                  <div className="p-4 bg-white/5 border border-white/10 text-center">
                    <Lock className="w-8 h-8 text-white/30 mx-auto mb-2" />
                    <div className="text-sm font-bold text-white/60">未知区域</div>
                    <div className="text-[11px] text-white/40 mt-1">需要曲速航行或扫描才能发现</div>
                  </div>
                  <p className="text-xs text-white/40 leading-relaxed italic">「这片星域尚未被记录在你的星图中……」</p>
                </>
              )}
            </div>
          )}
          <DialogFooter className="flex gap-2">
            {selected && !isDiscovered(selected.id) && (
              <>
                <Button variant="outline" className="flex-1 btn-mech border-purple-400/50 text-purple-400 hover:bg-purple-400/10" onClick={startScan}>
                  <Telescope className="w-4 h-4 mr-1" /> 扫描探索
                </Button>
                <Button className="flex-1 btn-mech bg-cyan-500/80 text-white hover:bg-cyan-500" onClick={() => warpTo(selected)}>
                  <Zap className="w-4 h-4 mr-1" /> 曲速航行
                </Button>
              </>
            )}
            {selected && isDiscovered(selected.id) && selected.id !== 'home' && (
              <Button className="w-full btn-mech bg-cyan-500/80 text-white hover:bg-cyan-500" onClick={() => warpTo(selected)}>
                <Rocket className="w-4 h-4 mr-1" /> 曲速前往
              </Button>
            )}
            {selected && selected.id === 'home' && (
              <Button variant="outline" className="w-full btn-mech" onClick={() => setSelected(null)}>关闭</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 扫描进度弹窗 */}
      <Dialog open={scanOpen} onOpenChange={(v) => !v && setScanOpen(false)}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-sm bg-[#0a0a2e] border border-purple-500/30">
          <DialogHeader>
            <DialogTitle className="text-purple-400 flex items-center gap-2">
              <Telescope className="w-5 h-5" /> 深空扫描中
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-4">
            <div className="text-4xl mb-3 animate-pulse">🔭</div>
            <div className="text-2xl font-bold font-mono-num text-purple-400">{scanProgress}%</div>
            <div className="w-full h-2 bg-white/10 mt-3 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 transition-all" style={{ width: `${scanProgress}%` }} />
            </div>
            <div className="text-[11px] text-white/40 mt-2">正在解析星域数据…</div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 探索事件弹窗 */}
      <Dialog open={!!exploreEvent} onOpenChange={(v) => !v && setExploreEvent(null)}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-md bg-[#0a0a2e] border border-yellow-500/30">
          <DialogHeader>
            <DialogTitle className="text-yellow-400 flex items-center gap-2">
              <Gift className="w-5 h-5" /> 探索发现
            </DialogTitle>
          </DialogHeader>
          {exploreEvent && (
            <div className="space-y-3">
              <div className="text-center py-2">
                <div className="text-5xl mb-2">{exploreEvent.icon}</div>
                <div className="text-base font-bold text-white">{exploreEvent.title}</div>
              </div>
              <p className="text-xs text-white/60 leading-relaxed">{exploreEvent.body}</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 border border-green-400/30 bg-green-400/5">
                  <div className="text-[10px] text-green-400/60 uppercase">成功奖励</div>
                  <div className="font-bold text-green-400">{exploreEvent.rewardLabel}</div>
                </div>
                <div className="p-2 border border-red-400/30 bg-red-400/5">
                  <div className="text-[10px] text-red-400/60 uppercase">失败惩罚</div>
                  <div className="font-bold text-red-400">{exploreEvent.penaltyLabel}</div>
                </div>
              </div>
              <AlertBar tone="warning">成功率约 {Math.round(exploreEvent.successRate * 100)}% · 结果由命运决定</AlertBar>
            </div>
          )}
          <DialogFooter className="flex gap-2">
            <Button variant="outline" className="flex-1 btn-mech" onClick={() => setExploreEvent(null)}>放弃</Button>
            <Button className="flex-1 btn-mech bg-yellow-500/80 text-black hover:bg-yellow-500" onClick={resolveExploreEvent}>
              <Zap className="w-4 h-4 mr-1" /> 探索！
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 探索结果弹窗 */}
      <Dialog open={!!exploreResult} onOpenChange={(v) => !v && setExploreResult(null)}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-sm bg-[#0a0a2e] border border-cyan-500/30">
          <DialogHeader>
            <DialogTitle className={exploreResult?.success ? 'text-green-400' : 'text-red-400'}>
              {exploreResult?.success ? '🎉 探索成功' : '💫 探索失败'}
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-4">
            <div className="text-5xl mb-3">{exploreResult?.success ? '✨' : '💥'}</div>
            <div className="text-sm text-white/70">{exploreResult?.ev.title}</div>
            <div className="text-xs text-white/40 mt-2">
              {exploreResult?.success ? exploreResult?.ev.rewardLabel : exploreResult?.ev.penaltyLabel}
            </div>
          </div>
          <DialogFooter>
            <Button className="w-full btn-mech bg-cyan-500/80 text-white hover:bg-cyan-500" onClick={() => setExploreResult(null)}>继续探索</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 曲速航行全屏效果 */}
      {warping && warpTarget && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center bg-black/60">
          <div className="text-center">
            <div className="text-6xl mb-4 animate-warp">🚀</div>
            <div className="text-lg font-bold text-cyan-400 font-mono-num animate-pulse">曲速航行中…</div>
            <div className="text-xs text-white/40 mt-1">目标：{warpTarget.name}</div>
          </div>
          {Array.from({ length: 24 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-px bg-gradient-to-b from-cyan-400 to-transparent animate-warp-streak"
              style={{
                height: `${Math.random() * 200 + 100}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 0.5}s`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}