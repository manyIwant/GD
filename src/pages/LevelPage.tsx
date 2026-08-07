import { useMemo } from 'react';
import { useGameStore } from '@/hooks/useGameStore';
import { useAuth } from '@/contexts/AuthContext';
import { HudPanel, DataItem, LocationHero, AlertBar } from '@/components/common/Hud';
import { LEVEL_TIERS, getLevelByXp, getNextLevel, getLevelProgress } from '@/data/levels';
import { ACHIEVEMENTS, ACHIEVEMENT_KEYS } from '@/data/achievements';
import { fmtLY } from '@/data/pricing';
import { Award, Lock, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LevelPage() {
  const { profile } = useAuth();
  const store = useGameStore();

  const level = useMemo(() => getLevelByXp(profile?.xp || 0), [profile?.xp]);
  const next = useMemo(() => getNextLevel(profile?.xp || 0), [profile?.xp]);
  const progress = useMemo(() => getLevelProgress(profile?.xp || 0), [profile?.xp]);
  const unlockedCodes = useMemo(() => new Set(store.achievements.map((a) => a.achievement_code)), [store.achievements]);

  return (
    <div className="px-4 md:px-8 py-6 max-w-4xl mx-auto">
      <LocationHero bg="bg-jump" name={`Lv.${level.level} ${level.name}`} desc={`${profile?.xp || 0} XP · 星际旅行者`} />

      {/* 等级进度 */}
      <HudPanel title="等级进度" className="mt-4 mb-4">
        <div className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-14 h-14 border-2 border-laser bg-laser/10 flex items-center justify-center text-3xl shrink-0">{level.icon}</div>
            <div className="flex-1 min-w-0">
              <div className="text-base font-bold text-foreground">{level.name}</div>
              <div className="text-xs text-muted-foreground">{level.perk}</div>
            </div>
          </div>
          <div className="h-2.5 bg-muted border border-border overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress.pct}%` }}
              transition={{ duration: 0.8 }}
              className="h-full bg-laser laser-line"
            />
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1 font-mono-num">
            <span>{progress.current}/{progress.next} XP</span>
            <span>{progress.pct.toFixed(1)}%</span>
          </div>
        </div>
      </HudPanel>

      {/* 等级段位列表 */}
      <HudPanel title="等级段位" className="mb-4">
        <div className="p-3 space-y-1.5">
          {LEVEL_TIERS.map((tier) => {
            const reached = (profile?.xp || 0) >= tier.minXp;
            const isCurrent = tier.level === level.level;
            return (
              <div
                key={tier.level}
                className={`flex items-center gap-3 p-2.5 border-l-4 ${
                  isCurrent ? 'border-laser bg-laser/10 neon-active' : reached ? 'border-green-500/50 bg-muted/20' : 'border-border bg-muted/10 opacity-60'
                }`}
              >
                <span className={`text-2xl ${reached ? '' : 'grayscale'}`}>{tier.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-foreground">Lv.{tier.level} {tier.name}</div>
                  <div className="text-[11px] text-muted-foreground">{tier.perk}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[10px] text-muted-foreground">需</div>
                  <div className="text-xs font-bold font-mono-num text-laser">{tier.minXp.toLocaleString()}</div>
                </div>
              </div>
            );
          })}
        </div>
      </HudPanel>

      {/* 成就奖章墙 */}
      <HudPanel title="成就奖章墙" className="mb-4">
        <div className="p-4">
          <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
            {ACHIEVEMENT_KEYS.map((code) => {
              const ach = ACHIEVEMENTS[code];
              const unlocked = unlockedCodes.has(code);
              return (
                <motion.div
                  key={code}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.4 }}
                  className={`relative aspect-square border flex flex-col items-center justify-center p-2 text-center ${
                    unlocked ? 'border-laser bg-laser/10 neon-active' : 'border-border bg-muted/20 grayscale'
                  }`}
                >
                  <div className="text-3xl mb-1">{unlocked ? ach.icon : '🔒'}</div>
                  <div className={`text-[10px] font-bold ${unlocked ? 'text-laser' : 'text-muted-foreground'} leading-tight`}>{ach.name}</div>
                  <div className="text-[9px] text-muted-foreground mt-0.5 leading-tight">{ach.desc}</div>
                  {unlocked && (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                      className="absolute -top-1 -right-1 w-3 h-3"
                    >
                      <div className="w-full h-full bg-laser laser-line" />
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </HudPanel>

      <AlertBar tone="info">
        <Zap className="w-4 h-4 inline mr-1" /> 通过完成航行、每日任务、宇宙事件小游戏获得 XP，提升等级可解锁更多飞船与目的地。
      </AlertBar>
    </div>
  );
}
