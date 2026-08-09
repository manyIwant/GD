import { useMemo, useState, useEffect, useCallback } from 'react';
import { useGameStore } from '@/hooks/useGameStore';
import { useAuth } from '@/contexts/AuthContext';
import { HudPanel, AlertBar } from '@/components/common/Hud';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SHIPS, getShip, isShipUnlocked } from '@/data/ships';
import { UPGRADE_ATTRS, MAX_UPGRADE_NODE, levelThreshold, expProgress } from '@/data/shipUpgrades';
import { fetchShipProgress, spendShipUpgrade } from '@/services/api';
import { toast } from 'sonner';
import { Ship, Lock, CheckCircle2, Zap, TrendingUp, Plus, Star, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';
import type { ShipProgressRow } from '@/types/types';

export default function ShipsPage() {
  const store = useGameStore();
  const { profile, refreshProfile } = useAuth();
  const selectedShip = profile?.selected_ship || 'cnsa';
  const level = profile?.level || 1;
  const unlockedCodes = useMemo(() => new Set(store.unlockedShips.map((s) => s.ship_code)), [store.unlockedShips]);
  const [progress, setProgress] = useState<ShipProgressRow[]>([]);
  const [selectedForUpgrade, setSelectedForUpgrade] = useState<string | null>(null);

  const loadProgress = useCallback(async () => {
    if (!profile) return;
    try {
      const r = await fetchShipProgress(profile.id);
      setProgress(r);
    } catch { /* ignore */ }
  }, [profile]);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  const progMap = useMemo(() => {
    const m = new Map<string, ShipProgressRow>();
    progress.forEach((p) => m.set(p.ship_code, p));
    return m;
  }, [progress]);

  const current = selectedForUpgrade ? progMap.get(selectedForUpgrade) : null;
  const currentShip = selectedForUpgrade ? getShip(selectedForUpgrade) : null;

  return (
    <div className="px-4 md:px-8 py-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Ship className="w-5 h-5 text-laser" /> 飞船军工厂
        </h1>
        <span className="text-xs text-muted-foreground">已收藏 {unlockedCodes.size + SHIPS.filter((s) => level >= s.unlockLevel).length}/{SHIPS.length}</span>
      </div>

      <AlertBar tone="info" className="mb-4">
        <TrendingUp className="w-4 h-4 inline mr-1" /> 乘坐某家公司的飞船完成航行，该公司飞船将累积经验并升级。升级后可获得属性点，自主选择火力、防御、速度、续航四条升级路线。
      </AlertBar>

      <div className="space-y-3">
        {SHIPS.map((ship) => {
          const unlocked = isShipUnlocked(ship.code, level, Array.from(unlockedCodes));
          const selected = selectedShip === ship.code;
          const prog = progMap.get(ship.code);
          const totalUpgrades = prog ? Object.values(prog.upgrades).reduce((a, b) => a + b, 0) : 0;
          return (
            <HudPanel key={ship.code}>
              <div className={`p-4 ${selected ? 'neon-active' : ''}`}>
                <div className="flex items-start gap-3">
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0.5 }}
                    animate={{ scale: 1, opacity: unlocked ? 1 : 0.4 }}
                    className="w-16 h-16 border-2 flex items-center justify-center text-4xl shrink-0"
                    style={{ borderColor: unlocked ? ship.accent : 'hsl(0 0% 30%)', background: unlocked ? `${ship.accent}15` : 'transparent' }}
                  >
                    {unlocked ? ship.icon : '🔒'}
                  </motion.div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-foreground">{ship.name}</span>
                      {selected && <CheckCircle2 className="w-4 h-4 text-laser" />}
                      {prog && (
                        <span className="text-[10px] px-2 py-0.5 border border-laser/50 bg-laser/10 text-laser">
                          Lv.{prog.level} · {prog.trips} 次
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">{ship.desc}</div>
                    {prog ? (
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                          <span>经验 {prog.exp}</span>
                          <span>{prog.level < 10 ? `下一级 ${levelThreshold(prog.level)}` : '已满级'}</span>
                        </div>
                        <Progress value={prog.level < 10 ? expProgress(prog.exp, prog.level).pct : 100} className="h-1.5" />
                        <div className="flex items-center gap-2 mt-1.5 text-[10px]">
                          <span className="text-laser flex items-center gap-0.5"><Star className="w-3 h-3" /> 属性点 {prog.upgrade_points}</span>
                          <span className="text-muted-foreground">已升级 {totalUpgrades} 节点</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-[10px] text-muted-foreground mt-2">尚未驾驶，完成航行即可累积经验</div>
                    )}
                  </div>
                  <div className="shrink-0 flex flex-col gap-1.5">
                    {unlocked ? (
                      <>
                        <Button
                          size="sm"
                          disabled={selected}
                          onClick={() => store.selectShip(ship.code)}
                          className="btn-mech bg-laser text-primary-foreground hover:bg-laser/90 disabled:opacity-50"
                        >
                          {selected ? '使用中' : '选用'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="btn-mech text-[11px] h-7"
                          onClick={() => setSelectedForUpgrade(ship.code)}
                        >
                          <Plus className="w-3 h-3 mr-0.5" /> 升级
                        </Button>
                      </>
                    ) : (
                      <div className="text-[10px] text-muted-foreground text-right">
                        <Lock className="w-3 h-3 inline mr-0.5" />
                        Lv.{ship.unlockLevel}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </HudPanel>
          );
        })}
      </div>

      {/* 属性升级弹窗（参考钢铁雄心4军工产业升级） */}
      <Dialog open={!!selectedForUpgrade} onOpenChange={(o) => !o && setSelectedForUpgrade(null)}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-2xl bg-card border-border max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <span className="text-xl">{currentShip?.icon}</span>
              {currentShip?.name} · 军工升级
            </DialogTitle>
          </DialogHeader>
          {current && currentShip ? (
            <UpgradeTree
              prog={current}
              onSpend={async (attr, node) => {
                try {
                  await spendShipUpgrade(current.ship_code, attr, node);
                  toast.success('升级成功！');
                  await loadProgress();
                } catch (e: unknown) {
                  const msg = e instanceof Error ? e.message : '升级失败';
                  toast.error(msg);
                }
              }}
              onClose={() => setSelectedForUpgrade(null)}
            />
          ) : (
            <div className="text-sm text-muted-foreground text-center py-8">暂无数据</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// 钢4 风格属性升级树组件
function UpgradeTree({ prog, onSpend, onClose }: { prog: ShipProgressRow; onSpend: (attr: string, node: number) => Promise<void>; onClose: () => void }) {
  const [busy, setBusy] = useState(false);
  const ep = expProgress(prog.exp, prog.level);

  const handleSpend = async (attr: string, node: number) => {
    if (busy) return;
    setBusy(true);
    try {
      await onSpend(attr, node);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* 经验与点数总览 */}
      <div className="p-3 border border-border bg-muted/20">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-laser" />
            <span className="text-sm font-bold text-foreground">等级 {prog.level}</span>
            <span className="text-xs text-muted-foreground">· {prog.trips} 次航行</span>
          </div>
          <div className="text-xs text-laser flex items-center gap-1">
            <Star className="w-3 h-3" /> 可用点数 {prog.upgrade_points}
          </div>
        </div>
        <Progress value={ep.pct} className="h-2 mb-1" />
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span>经验 {ep.current}</span>
          <span>{prog.level < 10 ? `下一级 ${ep.span}` : '已达上限'}</span>
        </div>
      </div>

      {/* 四条升级路线 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {UPGRADE_ATTRS.map((attr) => {
          const current = prog.upgrades[attr.key] || 0;
          return (
            <div key={attr.key} className="border border-border bg-muted/10 p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{attr.icon}</span>
                <span className="text-sm font-bold" style={{ color: attr.color }}>{attr.name}</span>
                <span className="text-[10px] text-muted-foreground ml-auto">{current}/{MAX_UPGRADE_NODE}</span>
              </div>
              <p className="text-[11px] text-muted-foreground mb-2 text-pretty">{attr.desc}</p>
              {/* 节点链 */}
              <div className="flex items-center gap-1">
                {Array.from({ length: MAX_UPGRADE_NODE }).map((_, i) => {
                  const node = i + 1;
                  const unlocked = node <= current;
                  const next = node === current + 1;
                  const canBuy = next && prog.upgrade_points > 0;
                  return (
                    <div key={node} className="flex items-center">
                      <button
                        type="button"
                        disabled={!canBuy || busy}
                        onClick={() => handleSpend(attr.key, node)}
                        className="relative w-8 h-8 border-2 flex items-center justify-center text-xs transition-all"
                        style={{
                          borderColor: unlocked ? attr.color : canBuy ? `${attr.color}aa` : 'hsl(0 0% 30%)',
                          background: unlocked ? `${attr.color}33` : canBuy ? `${attr.color}11` : 'transparent',
                          color: unlocked ? attr.color : canBuy ? attr.color : 'hsl(0 0% 50%)',
                          cursor: canBuy ? 'pointer' : 'default',
                        }}
                        title={unlocked ? `已解锁 ${attr.perNode}` : canBuy ? `点击解锁：${attr.perNode}` : '点数不足或需先解锁前置'}
                      >
                        {unlocked ? <CheckCircle2 className="w-4 h-4" /> : canBuy ? <Plus className="w-4 h-4" /> : node}
                      </button>
                      {i < MAX_UPGRADE_NODE - 1 && (
                        <div className="w-3 h-0.5" style={{ background: node < current ? attr.color : 'hsl(0 0% 30%)' }} />
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="text-[10px] text-muted-foreground mt-1.5">每级：{attr.perNode}</div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-end">
        <Button variant="outline" className="btn-mech" onClick={onClose}>关闭</Button>
      </div>
    </div>
  );
}
