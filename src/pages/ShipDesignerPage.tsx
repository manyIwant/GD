import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '@/hooks/useGameStore';
import { HudPanel, AlertBar } from '@/components/common/Hud';
import { Button } from '@/components/ui/button';
import { fmtPrice } from '@/data/pricing';
import { SHIP_HULLS, SHIP_PARTS, PART_SLOTS, partsBySlot, TIER_COLOR, DEFAULT_CONFIG, getPart } from '@/data/shipParts';
import type { PartSlot, ShipPart } from '@/data/shipParts';
import { Check, Lock, Wrench, Rocket, Wallet, ArrowRight, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

export default function ShipDesignerPage() {
  const navigate = useNavigate();
  const store = useGameStore();
  const { profile } = store;
  const balance = profile?.balance || 0;

  // 已拥有的零件（购买后解锁）
  const [owned, setOwned] = useState<Set<string>>(() => {
    const init = new Set<string>();
    Object.values(DEFAULT_CONFIG).forEach((id) => init.add(id));
    return init;
  });
  const [hullId, setHullId] = useState<string>(SHIP_HULLS[0].id);
  const [config, setConfig] = useState<Record<PartSlot, string>>({ ...DEFAULT_CONFIG });
  const [activeSlot, setActiveSlot] = useState<PartSlot>('engine');
  const [buying, setBuying] = useState(false);

  const hull = SHIP_HULLS.find((h) => h.id === hullId)!;
  const slotParts = partsBySlot(activeSlot);
  const activeSlotMeta = PART_SLOTS.find((s) => s.slot === activeSlot)!;

  // 计算总花费（未拥有的零件 + 船体）
  const totalCost = useMemo(() => {
    let cost = hull.price;
    Object.values(config).forEach((pid) => {
      if (!owned.has(pid)) {
        const p = getPart(pid);
        if (p) cost += p.price;
      }
    });
    return cost;
  }, [hull, config, owned]);

  const canAfford = balance >= totalCost;

  const selectPart = (part: ShipPart) => {
    setConfig((c) => ({ ...c, [part.slot]: part.id }));
  };

  const handleAssemble = async () => {
    if (!canAfford) { toast.error('信用点不足，无法组装'); return; }
    setBuying(true);
    try {
      await store.saveShipConfig(config);
      // 扣除未拥有零件 + 船体的费用
      const newOwned = new Set(owned);
      Object.values(config).forEach((pid) => newOwned.add(pid));
      setOwned(newOwned);
      if (totalCost > 0) {
        await store.deductBalance(totalCost);
      }
      toast.success('🚀 飞船组装完成！', { description: `已花费 ${fmtPrice(totalCost)} 信用点` });
      navigate('/galaxy');
    } catch (e: any) {
      toast.error(e.message || '组装失败');
    } finally {
      setBuying(false);
    }
  };

  const resetConfig = () => {
    setConfig({ ...DEFAULT_CONFIG });
    setHullId(SHIP_HULLS[0].id);
    toast.info('已恢复默认配置');
  };

  return (
    <div className="px-4 md:px-8 py-6 max-w-6xl mx-auto">
      {/* 顶部 */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg md:text-2xl font-bold text-foreground flex items-center gap-2">
            <Wrench className="w-5 h-5 md:w-6 md:h-6 text-laser" /> 飞船设计工坊
          </h1>
          <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5">改装你的专属探索舰 · 每个零件都需付费购买</p>
        </div>
        <div className="flex items-center gap-2">
          <HudPanel>
            <div className="px-3 py-1.5 flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-laser" />
              <span className="text-xs font-bold text-laser font-mono-num">{fmtPrice(balance)}</span>
            </div>
          </HudPanel>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-4">
        {/* 左侧：飞船预览 + 船体选择 */}
        <div className="space-y-4">
          <HudPanel>
            <div className="p-4 text-center">
              <div className="text-7xl mb-2">{hull.emoji}</div>
              <div className="text-sm font-bold text-foreground">{hull.name}</div>
              <div className="text-[10px] text-muted-foreground mt-1 text-pretty">{hull.desc}</div>
              <div className="mt-3 text-xs">
                <span className="text-muted-foreground">船体价格 </span>
                <span className="font-bold text-laser font-mono-num">{fmtPrice(hull.price)}</span>
              </div>
            </div>
          </HudPanel>

          <HudPanel>
            <div className="p-3">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">选择船体本体</div>
              <div className="space-y-2">
                {SHIP_HULLS.map((h) => (
                  <button
                    key={h.id}
                    onClick={() => setHullId(h.id)}
                    className={`w-full flex items-center gap-2 p-2 border btn-mech text-left transition-colors ${
                      hullId === h.id ? 'border-laser bg-laser/10' : 'border-border hover:bg-muted/50'
                    }`}
                  >
                    <span className="text-2xl shrink-0">{h.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-foreground">{h.name}</div>
                      <div className="text-[10px] text-laser font-mono-num">{fmtPrice(h.price)}</div>
                    </div>
                    {hullId === h.id && <Check className="w-4 h-4 text-laser shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
          </HudPanel>
        </div>

        {/* 右侧：部位选择 + 零件列表 */}
        <div className="space-y-4 min-w-0">
          {/* 部位标签 */}
          <HudPanel>
            <div className="p-2">
              <div className="flex flex-wrap gap-1.5">
                {PART_SLOTS.map((s) => {
                  const current = getPart(config[s.slot]);
                  const isActive = activeSlot === s.slot;
                  return (
                    <button
                      key={s.slot}
                      onClick={() => setActiveSlot(s.slot)}
                      className={`flex items-center gap-1.5 px-3 py-2 border btn-mech text-xs transition-colors ${
                        isActive ? 'border-laser bg-laser/10 text-laser' : 'border-border text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <span>{s.icon}</span>
                      <span className="font-bold">{s.label}</span>
                      {current && (
                        <span className="text-[8px] px-1 py-px rounded" style={{ background: `${TIER_COLOR[current.tier]}22`, color: TIER_COLOR[current.tier] }}>
                          {current.tier}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </HudPanel>

          {/* 零件列表 */}
          <HudPanel>
            <div className="p-3">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                {activeSlotMeta.icon} {activeSlotMeta.label} · 选择零件
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {slotParts.map((part) => {
                  const isOwned = owned.has(part.id);
                  const isSelected = config[part.slot] === part.id;
                  const color = TIER_COLOR[part.tier];
                  return (
                    <button
                      key={part.id}
                      onClick={() => selectPart(part)}
                      className={`relative p-3 border btn-mech text-left transition-all ${
                        isSelected ? 'border-laser bg-laser/10' : 'border-border hover:bg-muted/50'
                      }`}
                    >
                      {isSelected && (
                        <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-laser rounded-full flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 text-primary-foreground" />
                        </span>
                      )}
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[9px] font-bold px-1.5 py-px rounded" style={{ background: `${color}22`, color }}>{part.tier}级</span>
                        <span className="text-xs font-bold text-foreground truncate">{part.name}</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground mb-1">{part.desc}</div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold" style={{ color }}>{part.stat}</span>
                        <span className="text-[10px] text-muted-foreground font-mono-num flex items-center gap-0.5">
                          {isOwned ? <span className="text-green-400">已拥有</span> : <><Lock className="w-2.5 h-2.5" />{fmtPrice(part.price)}</>}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </HudPanel>

          {/* 当前配置总览 + 组装 */}
          <HudPanel>
            <div className="p-3 space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {PART_SLOTS.map((s) => {
                  const p = getPart(config[s.slot]);
                  return (
                    <div key={s.slot} className="p-1.5 border border-border/60 bg-background/40">
                      <div className="text-[9px] text-muted-foreground">{s.icon} {s.label}</div>
                      <div className="text-[10px] font-bold text-foreground truncate">{p?.name || '-'}</div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between p-2 border border-laser/30 bg-laser/5">
                <div>
                  <div className="text-[10px] text-muted-foreground">组装总花费</div>
                  <div className="text-lg font-bold text-laser font-mono-num">{fmtPrice(totalCost)}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-muted-foreground">当前余额</div>
                  <div className={`text-sm font-bold font-mono-num ${canAfford ? 'text-foreground' : 'text-red-400'}`}>{fmtPrice(balance)}</div>
                </div>
              </div>

              {!canAfford && (
                <AlertBar tone="danger">信用点不足，请先充值或选择更便宜的零件。</AlertBar>
              )}

              <div className="flex gap-2">
                <Button variant="outline" className="btn-mech flex-1" onClick={resetConfig}>
                  <RotateCcw className="w-4 h-4 mr-1" /> 恢复默认
                </Button>
                <Button className="btn-mech bg-laser text-primary-foreground hover:bg-laser/90 flex-[2]" disabled={!canAfford || buying} onClick={handleAssemble}>
                  <Rocket className="w-4 h-4 mr-1" /> {buying ? '组装中…' : '确认组装并出发'}
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </HudPanel>
        </div>
      </div>
    </div>
  );
}