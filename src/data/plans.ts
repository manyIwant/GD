// ===== 星际飞船方案数据 =====
import type { Plan } from '@/types/types';

export const PLANS: Record<string, Plan> = {
  cnsa: { n: '中国航天·长征跃迁舰', p: 1280000, c: '经济休眠舱', r: 'Lv4', d: 180, i: '🇨🇳' },
  nasa: { n: 'NASA·猎户座聚变星舰', p: 2560000, c: '标准生态舱', r: 'Lv5', d: 155, i: '🇺🇸' },
  spacex: { n: 'SpaceX·星舰超光速号', p: 5800000, c: '豪华生态圈', r: 'Lv6', d: 120, i: '🚀' },
  esa: { n: '欧空局·雅典娜远航船', p: 1980000, c: '科研观测舱', r: 'Lv4', d: 210, i: '🇪🇺' },
  ark: { n: '私营星际·方舟号', p: 860000, c: '经济休眠舱', r: 'Lv3', d: 200, i: '🏛' },
};

export const PLAN_KEYS = ['cnsa', 'nasa', 'spacex', 'esa', 'ark'] as const;

export function getPlan(code: string): Plan {
  return PLANS[code] || PLANS.cnsa;
}
