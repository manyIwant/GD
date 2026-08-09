// ===== 星际成就定义 =====
import type { AchievementDef } from '@/types/types';

export const ACHIEVEMENTS: Record<string, AchievementDef> = {
  firstOrder: { id: 'firstOrder', name: '初入星海', desc: '完成第一次星际订票', icon: '🚀' },
  moonTrip: { id: 'moonTrip', name: '月球漫步', desc: '抵达月球静海中转港', icon: '🌙' },
  marsTrip: { id: 'marsTrip', name: '红色星球', desc: '抵达火星奥林匹斯港', icon: '🔴' },
  deepSleep: { id: 'deepSleep', name: '深度沉眠', desc: '使用深度休眠模式', icon: '🧊' },
  nextStop: { id: 'nextStop', name: '走马观花', desc: '使用浅度休眠至下一站', icon: '🌙' },
  omphalos: { id: 'omphalos', name: '永恒之地的访客', desc: '发现翁法罗斯', icon: '🏛' },
  trisolaris: { id: 'trisolaris', name: '不要回答', desc: '抵达三体世界', icon: '🔴' },
  b612: { id: 'b612', name: '玫瑰与狐狸', desc: '发现B-612小行星', icon: '🌹' },
  andromeda: { id: 'andromeda', name: '河外边疆', desc: '抵达仙女座星系', icon: '🌀' },
};

export const ACHIEVEMENT_KEYS = Object.keys(ACHIEVEMENTS);

// 根据目的地解锁对应成就
export function getAchievementsForDestination(dest: string): string[] {
  const result: string[] = [];
  if (dest.includes('月球')) result.push('moonTrip');
  if (dest.includes('火星')) result.push('marsTrip');
  if (dest.includes('翁法罗斯')) result.push('omphalos');
  if (dest.includes('比邻星') || dest.includes('三体')) result.push('trisolaris');
  if (dest.includes('B612') || dest.includes('小王子')) result.push('b612');
  if (dest.includes('仙女座')) result.push('andromeda');
  return result;
}
