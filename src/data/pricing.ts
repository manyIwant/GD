// ===== 真实天文数据：目的地光年距离（来源：NASA / IAU 观测数据） =====
// 1 光年 ≈ 9.461 万亿千米；1 天文单位（AU）≈ 1.496 亿千米；1 光年 ≈ 63,241 AU
export interface Destination {
  key: string; // 匹配关键字
  name: string; // 规范名称
  ly: number; // 真实光年距离（距地球）
  au: number; // 真实天文单位距离（太阳系内更直观）
  emoji: string;
  color: string;
  desc: string;
}

export const DESTINATIONS: Destination[] = [
  { key: '月球', name: '月球静海中转港', ly: 0.000000041, au: 0.0026, emoji: '🌕', color: '#cbd5e1', desc: '地球唯一的天然卫星，平均距离 384,400 千米。' },
  { key: '谷神星', name: '谷神星补给站', ly: 0.0000437, au: 2.77, emoji: '🌑', color: '#a3a3a3', desc: '小行星带最大天体，距日约 4.14 亿千米。' },
  { key: '火星', name: '火星奥林匹斯港', ly: 0.0000244, au: 1.52, emoji: '🔴', color: '#ef4444', desc: '太阳系第二近的行星，距地球最近约 5,460 万千米。' },
  { key: '木星', name: '木星轨道站', ly: 0.000069, au: 5.2, emoji: '🟠', color: '#f59e0b', desc: '太阳系最大行星，距日约 7.78 亿千米。' },
  { key: '太阳系', name: '太阳系跃迁枢纽', ly: 0.0016, au: 101, emoji: '☀️', color: '#fbbf24', desc: '日球层顶附近，距日约 150 亿千米，星际空间起点。' },
  { key: '比邻星', name: '比邻星·三体世界', ly: 4.24, au: 268000, emoji: '⭐', color: '#f87171', desc: '距太阳最近的恒星（4.24 光年），红矮星。' },
  { key: '三体', name: '比邻星·三体世界', ly: 4.24, au: 268000, emoji: '⭐', color: '#f87171', desc: '三体世界位于半人马座 α 三星系统中的比邻星。' },
  { key: '半人马', name: '半人马座α星', ly: 4.37, au: 276000, emoji: '🌟', color: '#fde047', desc: '距太阳最近的恒星系统（4.37 光年）。' },
  { key: '巴纳德', name: '巴纳德星中转站', ly: 5.96, au: 377000, emoji: '💫', color: '#fb923c', desc: '距太阳 5.96 光年的红矮星。' },
  { key: '天狼星', name: '天狼星殖民地', ly: 8.6, au: 544000, emoji: '✨', color: '#93c5fd', desc: '夜空中最亮的恒星，距地球 8.6 光年。' },
  { key: '罗斯128', name: '罗斯128殖民地', ly: 11.0, au: 696000, emoji: '🌠', color: '#c4b5fd', desc: '距地球 11 光年的红矮星。' },
  { key: '格利泽', name: '格利泽581宜居站', ly: 20.4, au: 1290000, emoji: '🔮', color: '#a5b4fc', desc: '距地球 20.4 光年，拥有宜居带行星。' },
  { key: '大麦哲伦', name: '大麦哲伦云前哨', ly: 163000, au: 1.03e10, emoji: '🌌', color: '#67e8f9', desc: '银河系的卫星星系，距地球约 16.3 万光年。' },
  { key: '仙女', name: '仙女座M31', ly: 2537000, au: 1.6e11, emoji: '🌠', color: '#7dd3fc', desc: '本星系群最大星系，距地球约 254 万光年。' },
];

export function findDestination(dest: string): Destination | null {
  for (const d of DESTINATIONS) {
    if (dest.includes(d.key)) return d;
  }
  return null;
}

export function getLightYears(dest: string): number {
  const d = findDestination(dest);
  return d ? d.ly : 0;
}

// ===== 距离票价计算（专门函数，基于真实距离） =====
// 太阳系内按天文单位计价，星际按光年计价，深空对数压缩
const BASE_FARE = 30000; // 起步价（信用点）
const AU_RATE = 8000; // 每天文单位（太阳系内）
const LY_RATE = 220000; // 每光年（星际）
const DEEP_SPACE_LY = 100; // 深空阈值（光年）

export function calcDistanceFare(ly: number): number {
  if (ly < 0.01) {
    const au = ly / 0.0000158; // 1 光年 ≈ 63,241 天文单位
    return Math.round(BASE_FARE + au * AU_RATE);
  }
  if (ly < DEEP_SPACE_LY) {
    return Math.round(BASE_FARE + ly * LY_RATE);
  }
  // 深空：对数压缩，避免河外航线天价
  return Math.round(BASE_FARE + DEEP_SPACE_LY * LY_RATE * (1 + Math.log10(ly / DEEP_SPACE_LY)));
}

// 飞船方案票价系数（不同品牌 / 舱位定价不同）
export const PLAN_FARE_MULT: Record<string, number> = {
  cnsa: 1.0, ark: 0.85, esa: 1.1, nasa: 1.35, spacex: 1.8,
};

export function calcPrice(planKey: string, destination: string, shipDiscount: number = 0): number {
  const dest = findDestination(destination);
  const ly = dest ? dest.ly : 0.001;
  const mult = PLAN_FARE_MULT[planKey] || 1.0;
  const fare = calcDistanceFare(ly) * mult;
  const discounted = Math.round(fare * (1 - shipDiscount));
  return Math.max(1000, discounted);
}

// ===== 机上预订服务（单项计费） =====
export interface OnboardService {
  id: string;
  name: string;
  price: number;
  emoji: string;
  desc: string;
}

export const ONBOARD_SERVICES: OnboardService[] = [
  { id: 'breakfast', name: '星际早餐', price: 50, emoji: '🍳', desc: '低重力特制营养早餐，含新鲜合成蛋白质。' },
  { id: 'lunch', name: '星际午餐', price: 80, emoji: '🍱', desc: '主厨料理，搭配舱内自种蔬菜沙拉。' },
  { id: 'dinner', name: '星际晚餐', price: 80, emoji: '🍽️', desc: '正式晚宴套餐，含星空主题甜点。' },
  { id: 'skydive', name: '轨道跳伞装置', price: 500, emoji: '🪂', desc: '从飞船气闸跃入行星大气层，体验极限自由落体。' },
  { id: 'spa', name: '零重力SPA', price: 300, emoji: '🛁', desc: '失重环境下的全身放松与水疗按摩。' },
  { id: 'wifi', name: '量子通讯包', price: 120, emoji: '📡', desc: '超光速量子纠缠通讯，实时联系地球家人。' },
];

export function getServiceTotal(ids: string[]): number {
  return ONBOARD_SERVICES.filter((s) => ids.includes(s.id)).reduce((sum, s) => sum + s.price, 0);
}

export function fmtPrice(n: number): string {
  if (n >= 100000000) return '¥' + (n / 100000000).toFixed(1) + '亿';
  if (n >= 10000) return '¥' + (n / 10000).toFixed(0) + '万';
  return '¥' + n.toLocaleString();
}

export function fmtLY(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1) return n.toFixed(2);
  return n.toFixed(8);
}

// 通讯延迟（年）
export function getCommDelay(dest: string): { num: string; loc: string } {
  const map: Record<string, { num: string; loc: string }> = {
    '火星': { num: '3—22分钟', loc: '火星' },
    '月球': { num: '1.3秒', loc: '月球' },
    '谷神星': { num: '15—40分钟', loc: '谷神星' },
    '太阳系': { num: '6—8小时', loc: '太阳系边缘' },
    '跃迁': { num: '6—8小时', loc: '太阳系边缘' },
    '半人马': { num: '4.37', loc: '半人马座α星' },
    '天狼星': { num: '8.6', loc: '天狼星' },
    '巴纳德': { num: '6', loc: '巴纳德星' },
    '罗斯128': { num: '11', loc: '罗斯128' },
    '格利泽': { num: '20', loc: '格利泽581' },
    '大麦哲伦': { num: '16.3万', loc: '大麦哲伦云' },
    '仙女座': { num: '254万', loc: '仙女座M31' },
    'M31': { num: '254万', loc: '仙女座M31' },
    '比邻星': { num: '4.24', loc: '比邻星' },
    '三体': { num: '4.24', loc: '比邻星' },
    '翁法罗斯': { num: '未知', loc: '忆庭之镜通道' },
    'B621': { num: '—', loc: '用心聆听即可' },
    'B612': { num: '—', loc: '用心聆听即可' },
    '小王子': { num: '—', loc: '用心聆听即可' },
  };
  for (const k in map) {
    if (dest.includes(k)) return map[k];
  }
  return { num: '数十至数百万', loc: '深空' };
}
