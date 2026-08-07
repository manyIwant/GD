import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { HudPanel } from '@/components/common/Hud';
import ParticleNetwork from '@/components/common/ParticleNetwork';
import { STAR_NODES, STAR_LINKS, STAR_TYPE_META } from '@/data/galaxyMap';
import type { StarNode } from '@/data/galaxyMap';
import { pickExploreEvent, MEMENTOS, EXPLORE_ACHIEVEMENTS } from '@/data/exploreEvents';
import type { ExploreEvent } from '@/data/exploreEvents';
import { useGameStore } from '@/hooks/useGameStore';
import { fmtPrice } from '@/data/pricing';
import { Rocket, Telescope, Zap, Lock, Star as StarIcon, Compass, Wrench, Users, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export default function StarMapPage() {
  const navigate = useNavigate();
  const store = useGameStore();
  const { profile } = store;
  const [selected, setSelected] = useState<StarNode | null>(null);
  const [discovered, setDiscovered] = useState<Set<string>>(new Set(STAR_NODES.filter((n) => n.status === 'discovered').map((n) => n.id)));
  const [warping, setWarping] = useState(false);
  const [warpTarget, setWarpTarget] = useState<StarNode | null>(null);
  const [shipPos, setShipPos] = useState({ x: 50, y: 52 });
  const [shipTarget, setShipTarget] = useState({ x: 50, y: 52 });
  const [scanOpen, setScanOpen] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [exploreEvent, setExploreEvent] = useState<ExploreEvent | null>(null);
  const [exploreResult, setExploreResult] = useState<{ success: boolean; ev: ExploreEvent } | null>(null);
  const [warpProgress, setWarpProgress] = useState(0);
  const scanRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  // 宇宙广播轮播
  const broadcasts = useMemo(
    () => [
      '📡 川陀帝国广播：今日星历稳定，银河贸易指数上涨 3.2%',
      '📡 端点基地：第一基地百科全书编纂进度 87%，预计下个纪元完成',
      '📡 自由商盟：巴纳德星中转站开放深空移民名额，名额有限',
      '📡 天文台预警：人马座A*黑洞周边时空扰动加剧，建议绕行',
      '📡 探索者联盟：大麦哲伦云前哨发现新型超新星遗迹，正在解析',
      '📡 翁法罗斯残响：忆庭之镜发出微弱信号，含义不明',
      '📡 织女星戴森云：能源输出创新高，河外文明信号疑似回应',
      '📡 三体世界档案：乱纪元持续中，遗迹探索风险等级上调',
    ],
    []
  );
  const [broadcastIdx, setBroadcastIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setBroadcastIdx((i) => (i + 1) % broadcasts.length), 5000);
    return () => clearInterval(t);
  }, [broadcasts.length]);

  // 曲速进度
  useEffect(() => {
    if (!warping) { setWarpProgress(0); return; }
    const t = setInterval(() => setWarpProgress((p) => Math.min(100, p + 4)), 100);
    return () => clearInterval(t);
  }, [warping]);

  // 飞船平滑移动
  useEffect(() => {
    if (shipPos.x === shipTarget.x && shipPos.y === shipTarget.y) return;
    const t = setInterval(() => {
      setShipPos((p) => {
        const dx = shipTarget.x - p.x;
        const dy = shipTarget.y - p.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 0.5) return shipTarget;
        const step = Math.min(dist, 1.4);
        return { x: p.x + (dx / dist) * step, y: p.y + (dy / dist) * step };
      });
    }, 30);
    return () => clearInterval(t);
  }, [shipTarget, shipPos]);

  const warpTo = useCallback((node: StarNode) => {
    if (node.id === 'home') { toast.info('🏠 你已在母港'); return; }
    setWarpTarget(node);
    setWarping(true);
    // 曲速前往时先收起信息框，航行中显示曲速提示
    setSelected(null);
    setShipTarget({ x: node.x, y: node.y });
    toast.info(`🚀 曲速引擎启动，目标：${node.name}…`);
    setTimeout(() => {
      setWarping(false);
      setDiscovered((prev) => { const n = new Set(prev); n.add(node.id); return n; });
      toast.success(`🚀 曲速航行完成！已抵达 ${node.name}`);
      // 抵达后重新弹出信息框，展示更新后的界面
      setSelected(node);
      if (Math.random() < 0.5) setTimeout(() => setExploreEvent(pickExploreEvent()), 600);
    }, 2600);
  }, []);

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
          setDiscovered((prev) => { const n = new Set(prev); n.add(selected.id); return n; });
          toast.success(`🔭 扫描完成！${selected.name} 已加入你的银河版图`);
          if (Math.random() < 0.4) setTimeout(() => setExploreEvent(pickExploreEvent()), 500);
          return 100;
        }
        return p + 4;
      });
    }, 60);
  }, [selected]);

  useEffect(() => () => { if (scanRef.current) clearInterval(scanRef.current); }, []);

  const resolveExploreEvent = async () => {
    if (!exploreEvent) return;
    const success = Math.random() < exploreEvent.successRate;
    setExploreEvent(null);
    setExploreResult({ success, ev: exploreEvent });
    if (success) {
      const ev = exploreEvent;
      if (ev.rewardType === 'credit') { await store.recharge(ev.rewardValue); toast.success(`✨ 获得 ${fmtPrice(ev.rewardValue)} 信用点`); }
      else if (ev.rewardType === 'xp') { await store.addXp(ev.rewardValue); toast.success(`✨ 获得 ${ev.rewardValue} XP`); }
      else if (ev.rewardType === 'memento') { const m = MEMENTOS[Math.floor(Math.random() * MEMENTOS.length)]; await store.addMemento(m.name, m.desc, m.emoji); toast.success(`✨ 获得纪念品 ${m.emoji} ${m.name}`); await store.unlockExploreAchievement(EXPLORE_ACHIEVEMENTS[1].name); }
      else if (ev.rewardType === 'achievement') { await store.unlockExploreAchievement(EXPLORE_ACHIEVEMENTS[0].name); toast.success(`✨ 解锁成就「${EXPLORE_ACHIEVEMENTS[0].name}」`); }
    } else {
      const ev = exploreEvent;
      await store.deductBalance(ev.penaltyValue);
      toast.error(`⚠ ${ev.penaltyLabel}`);
    }
  };

  const discoveredCount = discovered.size;
  const totalCount = STAR_NODES.length;
  const exploredPct = Math.round((discoveredCount / totalCount) * 100);
  const isDiscovered = (id: string) => discovered.has(id);
  const mementos = profile?.mementos || [];
  const achievements = profile?.explore_achievements || [];

  useEffect(() => {
    if (discoveredCount >= Math.ceil(totalCount / 2) && !achievements.includes(EXPLORE_ACHIEVEMENTS[2].name)) {
      store.unlockExploreAchievement(EXPLORE_ACHIEVEMENTS[2].name);
    }
  }, [discoveredCount, totalCount, achievements, store]);

  // 节点尺寸缩放：大画布下放大显示
  const scale = 1.6;

  return (
    <div ref={mapRef} className="relative w-full min-h-[calc(100vh-64px)] md:min-h-screen overflow-hidden bg-[#03040a] cursor-crosshair">
      {/* 深空背景层 */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a2e]/80 via-[#03040a] to-[#1a0a2e]/60" />
        {/* 银河旋臂 */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[160%] aspect-[2.2/1] opacity-40"
          style={{ background: 'radial-gradient(ellipse at center, rgba(124,58,237,0.18) 0%, rgba(6,182,212,0.10) 30%, transparent 70%)', transform: 'translate(-50%,-50%) rotate(-18deg)' }}
        />
        {/* 多层模糊光晕 */}
        <div className="absolute top-[20%] left-[15%] w-64 h-64 rounded-full blur-[100px] opacity-30" style={{ background: 'radial-gradient(circle, rgba(0,212,255,0.5), transparent)' }} />
        <div className="absolute bottom-[15%] right-[10%] w-72 h-72 rounded-full blur-[110px] opacity-25" style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.5), transparent)' }} />
        <div className="absolute top-[60%] left-[45%] w-56 h-56 rounded-full blur-[90px] opacity-20" style={{ background: 'radial-gradient(circle, rgba(236,72,153,0.4), transparent)' }} />
      </div>

      {/* Canvas 粒子网络背景（粒子间连线 + 鼠标引力吸引） */}
      <ParticleNetwork className="z-[1]" particleCount={120} connectionDist={160} mouseRadius={240} />

      {/* 顶部 HUD */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 md:p-6 pointer-events-none">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
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
        {/* 航线连线 */}
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
          {STAR_LINKS.map(([a, b], i) => {
            const na = STAR_NODES.find((n) => n.id === a)!;
            const nb = STAR_NODES.find((n) => n.id === b)!;
            const bothKnown = isDiscovered(a) && isDiscovered(b);
            const oneKnown = isDiscovered(a) || isDiscovered(b);
            return (
              <line
                key={i}
                x1={na.x} y1={na.y} x2={nb.x} y2={nb.y}
                stroke={bothKnown ? 'rgba(0,240,255,0.45)' : oneKnown ? 'rgba(167,139,250,0.25)' : 'rgba(255,255,255,0.05)'}
                strokeWidth={bothKnown ? 0.18 : 0.08}
                strokeDasharray={bothKnown ? '0' : '1.5,1.5'}
                vectorEffect="non-scaling-stroke"
              />
            );
          })}
        </svg>

        {/* 星球节点 */}
        {STAR_NODES.map((node) => {
          const known = isDiscovered(node.id);
          const meta = STAR_TYPE_META[node.type];
          const size = node.size * scale;
          return (
            <button
              key={node.id}
              type="button"
              onClick={() => setSelected(node)}
              className="absolute -translate-x-1/2 -translate-y-1/2 group z-10"
              style={{ left: `${node.x}%`, top: `${node.y}%` }}
            >
              {/* 外层光晕 */}
              <div
                className="absolute inset-0 rounded-full animate-pulse-glow"
                style={{
                  width: size * 2.6, height: size * 2.6,
                  left: -size * 1.3, top: -size * 1.3,
                  background: `radial-gradient(circle, ${known ? node.color : '#555'}40 0%, transparent 70%)`,
                }}
              />
              {/* 节点本体 */}
              <div
                className="relative flex items-center justify-center rounded-full border-2 transition-transform group-hover:scale-125"
                style={{
                  width: size, height: size,
                  borderColor: known ? node.color : 'rgba(255,255,255,0.2)',
                  background: known ? `${node.color}30` : 'rgba(20,20,40,0.7)',
                  boxShadow: known ? `0 0 ${size * 0.8}px ${node.color}60, inset 0 0 ${size * 0.3}px ${node.color}30` : 'none',
                }}
              >
                <span className="text-base md:text-lg drop-shadow-lg">{known ? meta.icon : <Lock className="w-4 h-4 text-white/40" />}</span>
              </div>
              {/* 名称标签 */}
              {known && (
                <div
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-1 whitespace-nowrap text-[10px] md:text-xs font-bold px-2 py-0.5 rounded bg-black/70 border"
                  style={{ color: node.color, borderColor: `${node.color}40` }}
                >
                  {node.name}
                </div>
              )}
            </button>
          );
        })}

        {/* 玩家飞船 */}
        <div className="absolute z-20 -translate-x-1/2 -translate-y-1/2" style={{ left: `${shipPos.x}%`, top: `${shipPos.y}%` }}>
          <div className={`text-2xl md:text-3xl drop-shadow-[0_0_8px_rgba(0,240,255,0.8)] ${warping ? 'animate-warp' : ''}`}>🚀</div>
          {warping && warpTarget && (
            <div className="absolute top-1/2 left-0 w-20 h-0.5 bg-gradient-to-r from-cyan-400 to-transparent -translate-y-1/2" />
          )}
          {warping && warpTarget && (
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-28 bg-black/80 border border-cyan-500/50 px-2 py-1">
              <div className="text-[9px] text-cyan-400 font-mono-num text-center">曲速 {warpProgress}%</div>
              <div className="w-full h-1 bg-white/10 mt-1 overflow-hidden">
                <div className="h-full bg-cyan-400 transition-all duration-100" style={{ width: `${warpProgress}%` }} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 宇宙广播滚动条 */}
      <div className="absolute bottom-20 md:bottom-24 left-0 right-0 z-20 px-4 pointer-events-none">
        <div className="max-w-6xl mx-auto">
          <div className="bg-black/60 border border-cyan-500/20 backdrop-blur-sm px-3 py-1.5 overflow-hidden">
            <span key={broadcastIdx} className="text-[10px] md:text-xs text-cyan-300/80 font-mono-num animate-fade-in">
              {broadcasts[broadcastIdx]}
            </span>
          </div>
        </div>
      </div>

      {/* 底部操作栏 */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-4 md:p-6 pointer-events-none">
        <div className="max-w-6xl mx-auto flex items-center justify-center gap-3 pointer-events-auto flex-wrap">
          <Button variant="outline" className="btn-mech border-purple-400/50 text-purple-400 hover:bg-purple-400/10" onClick={() => navigate('/ship-designer')}>
            <Wrench className="w-4 h-4 mr-1.5" /> 改装飞船
          </Button>
          <Button variant="outline" className="btn-mech border-cyan-400/50 text-cyan-400 hover:bg-cyan-400/10" onClick={() => navigate('/route')}>
            <Rocket className="w-4 h-4 mr-1.5" /> 预订航线
          </Button>
          <Button className="btn-mech bg-cyan-500/80 text-white hover:bg-cyan-500" onClick={() => { setShipTarget({ x: 50, y: 52 }); toast.info('🏠 返回母港'); }}>
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
                      <div className="text-[10px] text-white/40 uppercase">主要资源</div>
                      <div className="font-bold text-yellow-400">{selected.resource}</div>
                    </div>
                    <div className="p-2 bg-white/5 border border-white/10">
                      <div className="text-[10px] text-white/40 uppercase">所属势力</div>
                      <div className="font-bold text-purple-400">{selected.faction || '无'}</div>
                    </div>
                    <div className="p-2 bg-white/5 border border-white/10 col-span-2">
                      <div className="text-[10px] text-white/40 uppercase flex items-center gap-1"><Users className="w-3 h-3" /> 人口规模</div>
                      <div className="font-bold text-cyan-400">{selected.population || '未知'}</div>
                    </div>
                  </div>
                  <p className="text-xs text-white/60 leading-relaxed text-pretty">{selected.desc}</p>
                </>
              ) : (
                <>
                  <div className="p-4 bg-white/5 border border-white/10 text-center">
                    <Lock className="w-8 h-8 text-white/30 mx-auto mb-2" />
                    <div className="text-sm font-bold text-white/60">未知区域</div>
                    <div className="text-[11px] text-white/40 mt-1">需要曲速航行或扫描才能发现</div>
                  </div>
                  <p className="text-xs text-white/40 leading-relaxed italic text-pretty">「这片星域尚未被记录在你的星图中……」</p>
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
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-md bg-[#0a0a2e] border border-amber-500/30">
          <DialogHeader>
            <DialogTitle className="text-amber-400 flex items-center gap-2">
              <Sparkles className="w-5 h-5" /> {exploreEvent?.title}
            </DialogTitle>
          </DialogHeader>
          {exploreEvent && (
            <div className="space-y-3">
              <div className="text-4xl text-center">{exploreEvent.icon}</div>
              <p className="text-xs text-white/70 leading-relaxed text-pretty">{exploreEvent.body}</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 bg-green-500/10 border border-green-500/30">
                  <div className="text-[10px] text-green-400 uppercase">成功奖励</div>
                  <div className="font-bold text-green-400">{exploreEvent.rewardLabel}</div>
                </div>
                <div className="p-2 bg-red-500/10 border border-red-500/30">
                  <div className="text-[10px] text-red-400 uppercase">失败代价</div>
                  <div className="font-bold text-red-400">{exploreEvent.penaltyLabel}</div>
                </div>
              </div>
              <div className="text-center text-[11px] text-white/40">成功率 {Math.round(exploreEvent.successRate * 100)}%</div>
            </div>
          )}
          <DialogFooter>
            <Button className="w-full btn-mech bg-amber-500/80 text-white hover:bg-amber-500" onClick={resolveExploreEvent}>
              <Sparkles className="w-4 h-4 mr-1" /> 接受挑战
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 探索结果弹窗 */}
      <Dialog open={!!exploreResult} onOpenChange={(v) => !v && setExploreResult(null)}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-sm bg-[#0a0a2e] border border-cyan-500/30">
          <DialogHeader>
            <DialogTitle className={exploreResult?.success ? 'text-green-400' : 'text-red-400'}>
              {exploreResult?.success ? '✨ 探索成功！' : '⚠ 探索失败'}
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-4">
            <div className="text-5xl mb-3">{exploreResult?.success ? exploreResult.ev.icon : '💥'}</div>
            <p className="text-xs text-white/60">
              {exploreResult?.success ? exploreResult.ev.rewardLabel : exploreResult?.ev.penaltyLabel}
            </p>
          </div>
          <DialogFooter>
            <Button className="w-full btn-mech bg-cyan-500/80 text-white hover:bg-cyan-500" onClick={() => setExploreResult(null)}>继续探索</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
