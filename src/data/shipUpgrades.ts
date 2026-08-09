// ===== 飞船公司属性升级树（参考钢铁雄心4军工产业升级） =====
import type { UpgradeAttrDef } from '@/types/types';

// 四条升级路线，每条 5 个节点（maxLevel）
export const MAX_UPGRADE_NODE = 5;

export const UPGRADE_ATTRS: UpgradeAttrDef[] = [
  {
    key: 'firepower',
    name: '火力',
    icon: '💥',
    desc: '强化武器系统，提升宇宙事件小游戏中的胜率与奖励。',
    perNode: '事件奖励 +15%',
    color: '#ef4444',
  },
  {
    key: 'defense',
    name: '防御力',
    icon: '🛡️',
    desc: '加固护盾装甲，降低航行中遭遇危险的概率。',
    perNode: '危险概率 -12%',
    color: '#3b82f6',
  },
  {
    key: 'speed',
    name: '速度',
    icon: '⚡',
    desc: '升级曲速引擎，缩短航行所需时间。',
    perNode: '航行时间 -8%',
    color: '#22c55e',
  },
  {
    key: 'endurance',
    name: '续航',
    icon: '🔋',
    desc: '扩充能源储备，降低燃料消耗并提升远航稳定性。',
    perNode: '燃料消耗 -10%',
    color: '#eab308',
  },
];

export function getAttr(key: string): UpgradeAttrDef | undefined {
  return UPGRADE_ATTRS.find((a) => a.key === key);
}

// 每级所需经验（累计），与数据库 ship_level_threshold 一致
export function levelThreshold(level: number): number {
  return Math.round((100 * level * (level + 1)) / 2);
}

// 当前等级经验进度
export function expProgress(exp: number, level: number): { current: number; needed: number; span: number; pct: number } {
  const base = level >= 2 ? levelThreshold(level - 1) : 0;
  const needed = levelThreshold(level);
  const current = exp - base;
  const span = needed - base;
  return { current, needed, span, pct: span > 0 ? Math.min(100, Math.round((current / span) * 100)) : 100 };
}

// 计算飞船属性加成（用于航行/事件）
export function shipBonus(upgrades: Record<string, number>): {
  speedMult: number;
  dangerReduction: number;
  eventRewardMult: number;
  fuelReduction: number;
} {
  const fp = upgrades.firepower || 0;
  const df = upgrades.defense || 0;
  const sp = upgrades.speed || 0;
  const en = upgrades.endurance || 0;
  return {
    speedMult: 1 - sp * 0.08,
    dangerReduction: df * 0.12,
    eventRewardMult: 1 + fp * 0.15,
    fuelReduction: en * 0.10,
  };
}