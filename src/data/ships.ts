// ===== 飞船收藏系统 =====
import type { ShipDef } from '@/types/types';

export const SHIPS: ShipDef[] = [
  {
    code: 'cnsa', name: '中国航天·长征跃迁舰', icon: '🇨🇳',
    desc: '经济休眠舱·辐射Lv4·可停靠·180天。可靠的国产跃迁舰，性价比之选。',
    unlockLevel: 1, buffType: 'discount', buffValue: 0, accent: '#dc2626',
  },
  {
    code: 'ark', name: '私营星际·方舟号', icon: '🏛',
    desc: '经济/标准·辐射Lv3·可停靠·200天。方舟号承载着流浪者的希望。',
    unlockLevel: 1, buffType: 'discount', buffValue: 0, accent: '#a78bfa',
  },
  {
    code: 'esa', name: '欧空局·雅典娜远航船', icon: '🇪🇺',
    desc: '科研观测舱·辐射Lv4·多段停靠·210天。以智慧女神命名的科研旗舰。',
    unlockLevel: 2, buffType: 'xp', buffValue: 0.15, accent: '#60a5fa',
  },
  {
    code: 'nasa', name: 'NASA·猎户座聚变星舰', icon: '🇺🇸',
    desc: '标准生态舱·辐射Lv5·可停靠·155天。聚变引擎驱动的旗舰，速度更快。',
    unlockLevel: 3, buffType: 'speed', buffValue: 1.15, accent: '#3b82f6',
  },
  {
    code: 'spacex', name: 'SpaceX·星舰超光速号', icon: '🚀',
    desc: '豪华生态圈·辐射Lv6·直航·120天。超光速实验舰，最快抵达。',
    unlockLevel: 5, buffType: 'speed', buffValue: 1.3, accent: '#f97316',
  },
];

export function getShip(code: string): ShipDef {
  return SHIPS.find((s) => s.code === code) || SHIPS[0];
}

export function isShipUnlocked(code: string, level: number, unlockedCodes: string[]): boolean {
  const ship = getShip(code);
  return unlockedCodes.includes(code) || level >= ship.unlockLevel;
}
