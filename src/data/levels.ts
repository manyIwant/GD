// ===== 星际旅行者等级系统 =====
import type { LevelTier } from '@/types/types';

export const LEVEL_TIERS: LevelTier[] = [
  { level: 1, name: '见习宇航员', minXp: 0, icon: '🥚', perk: '解锁基础飞船·长征跃迁舰' },
  { level: 2, name: '初级领航员', minXp: 1000, icon: '🌱', perk: '解锁雅典娜远航船·XP+15%' },
  { level: 3, name: '星际驾驶员', minXp: 3000, icon: '🛰', perk: '解锁猎户座聚变星舰·速度+15%' },
  { level: 4, name: '深空探险家', minXp: 6000, icon: '🌟', perk: '隐藏目的地折扣·三体航线开放' },
  { level: 5, name: '银河传说', minXp: 10000, icon: '🌌', perk: '解锁超光速号·速度+30%' },
  { level: 6, name: '宇宙编织者', minXp: 20000, icon: '✨', perk: '全目的地8折·尊贵身份' },
];

export function getLevelByXp(xp: number): LevelTier {
  let result = LEVEL_TIERS[0];
  for (const tier of LEVEL_TIERS) {
    if (xp >= tier.minXp) result = tier;
  }
  return result;
}

export function getNextLevel(xp: number): LevelTier | null {
  const current = getLevelByXp(xp);
  const idx = LEVEL_TIERS.findIndex((t) => t.level === current.level);
  return idx < LEVEL_TIERS.length - 1 ? LEVEL_TIERS[idx + 1] : null;
}

export function getLevelProgress(xp: number): { current: number; next: number; pct: number } {
  const tier = getLevelByXp(xp);
  const next = getNextLevel(xp);
  if (!next) return { current: xp, next: xp, pct: 100 };
  const span = next.minXp - tier.minXp;
  const into = xp - tier.minXp;
  return { current: into, next: span, pct: Math.min(100, (into / span) * 100) };
}
