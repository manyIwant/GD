// ===== 动态定价 =====
export const PRICE_PER_LY: Record<string, number> = {
  cnsa: 290000, nasa: 580000, spacex: 1320000, esa: 450000, ark: 196000,
};

export const LY_PRICE: Record<string, number> = {
  '月球': 0.00004, '火星': 0.00048, '谷神星': 0.0008, '太阳系': 0.005, '跃迁': 0.005,
  '半人马': 4.37, '天狼星': 8.6, '巴纳德': 6, '罗斯128': 11, '格利泽': 20,
  '大麦哲伦': 163000, '仙女座': 2537000, '比邻星': 4.24, '三体': 4.24, '翁法罗斯': 999999,
};

// 累计光年计算（用于显示）
export const LY_MAP: Record<string, number> = {
  '月球': 0.00000004, '火星': 0.000024, '谷神星': 0.00004, '太阳系': 0.00048, '跃迁': 0.00048,
  '半人马': 4.37, '天狼星': 8.6, '巴纳德': 6, '罗斯128': 11, '格利泽': 20,
  '大麦哲伦': 163000, '仙女座': 2537000, '比邻星': 4.24, '三体': 4.24,
};

export function calcPrice(planKey: string, destination: string, shipDiscount: number = 0): number {
  const perLY = PRICE_PER_LY[planKey] || 290000;
  let ly = 1;
  for (const k in LY_PRICE) {
    if (destination.includes(k)) { ly = LY_PRICE[k]; break; }
  }
  let base = Math.round(perLY * Math.max(ly, 0.001));
  if (base < 1000) base = 1000;
  if (base > 999999999) base = 999999999;
  base = Math.round(base * (1 - shipDiscount));
  return base;
}

export function fmtPrice(n: number): string {
  if (n >= 100000000) return '¥' + (n / 100000000).toFixed(1) + '亿';
  if (n >= 10000) return '¥' + (n / 10000).toFixed(0) + '万';
  return '¥' + n.toLocaleString();
}

export function getLightYears(dest: string): number {
  for (const k in LY_MAP) {
    if (dest.includes(k)) return LY_MAP[k];
  }
  return 0;
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
