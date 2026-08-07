import { useMemo } from 'react';
import { useGameStore } from '@/hooks/useGameStore';
import { useAuth } from '@/contexts/AuthContext';
import { HudPanel, AlertBar } from '@/components/common/Hud';
import { Button } from '@/components/ui/button';
import { SHIPS, getShip, isShipUnlocked } from '@/data/ships';
import { toast } from 'sonner';
import { Ship, Lock, CheckCircle2, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ShipsPage() {
  const store = useGameStore();
  const { profile } = useAuth();
  const selectedShip = profile?.selected_ship || 'cnsa';
  const level = profile?.level || 1;
  const unlockedCodes = useMemo(() => new Set(store.unlockedShips.map((s) => s.ship_code)), [store.unlockedShips]);

  return (
    <div className="px-4 md:px-8 py-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Ship className="w-5 h-5 text-laser" /> 飞船收藏
        </h1>
        <span className="text-xs text-muted-foreground">已收藏 {unlockedCodes.size + SHIPS.filter((s) => level >= s.unlockLevel).length}/{SHIPS.length}</span>
      </div>

      <AlertBar tone="info" className="mb-4">
        <Zap className="w-4 h-4 inline mr-1" /> 不同飞船拥有不同 BUFF：速度加成（缩短航行）、信用点折扣、XP 加成。升级解锁更多飞船。
      </AlertBar>

      <div className="space-y-3">
        {SHIPS.map((ship) => {
          const unlocked = isShipUnlocked(ship.code, level, Array.from(unlockedCodes));
          const selected = selectedShip === ship.code;
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
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-foreground">{ship.name}</span>
                      {selected && <CheckCircle2 className="w-4 h-4 text-laser" />}
                    </div>
                    <div className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">{ship.desc}</div>
                    <div className="flex flex-wrap gap-2 mt-2 text-[10px]">
                      <span className="px-2 py-0.5 border border-border bg-muted/30" style={{ color: ship.accent }}>
                        解锁条件：Lv.{ship.unlockLevel}
                      </span>
                      {ship.buffType !== 'discount' && ship.buffValue > 0 && (
                        <span className="px-2 py-0.5 border border-green-500/50 bg-green-950/20 text-green-400">
                          {ship.buffType === 'speed' ? `⚡ 速度+${Math.round((ship.buffValue - 1) * 100)}%` : `✨ XP+${Math.round(ship.buffValue * 100)}%`}
                        </span>
                      )}
                      {ship.buffType === 'discount' && (
                        <span className="px-2 py-0.5 border border-border bg-muted/30 text-muted-foreground">标准定价</span>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0">
                    {unlocked ? (
                      <Button
                        size="sm"
                        disabled={selected}
                        onClick={() => store.selectShip(ship.code)}
                        className="btn-mech bg-laser text-primary-foreground hover:bg-laser/90 disabled:opacity-50"
                      >
                        {selected ? '使用中' : '选用'}
                      </Button>
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
    </div>
  );
}
