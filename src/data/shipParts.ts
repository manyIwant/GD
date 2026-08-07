// ===== 飞船设计器：零件数据（改枪式多部位改装） =====

export type PartSlot = 'engine' | 'shield' | 'weapon' | 'nav' | 'cargo' | 'paint';

export interface ShipPart {
  id: string;
  slot: PartSlot;
  name: string;
  price: number;
  stat: string; // 属性展示
  desc: string;
  tier: 'S' | 'A' | 'B' | 'C';
}

export interface ShipHull {
  id: string;
  name: string;
  price: number;
  desc: string;
  slots: number; // 可安装部位数
  emoji: string;
}

export const PART_SLOTS: { slot: PartSlot; label: string; icon: string }[] = [
  { slot: 'engine', label: '引擎', icon: '🚀' },
  { slot: 'shield', label: '护盾', icon: '🛡️' },
  { slot: 'weapon', label: '武器', icon: '🔫' },
  { slot: 'nav', label: '导航', icon: '🧭' },
  { slot: 'cargo', label: '货舱', icon: '📦' },
  { slot: 'paint', label: '涂装', icon: '🎨' },
];

export const SHIP_HULLS: ShipHull[] = [
  { id: 'hull-scout', name: '侦察型·游隼', price: 500000, desc: '轻型高机动船体，适合快速探索。', slots: 6, emoji: '🛩️' },
  { id: 'hull-cruiser', name: '巡洋型·星鲨', price: 2000000, desc: '均衡型船体，攻防兼备的万金油。', slots: 6, emoji: '🛸' },
  { id: 'hull-dread', name: '无畏型·泰坦', price: 8000000, desc: '重型旗舰船体，承载最强火力与护盾。', slots: 6, emoji: '🚀' },
];

export const SHIP_PARTS: ShipPart[] = [
  // 引擎
  { id: 'eng-1', slot: 'engine', name: '离子推进器', price: 100000, stat: '速度 +5%', desc: '基础离子引擎，稳定可靠。', tier: 'C' },
  { id: 'eng-2', slot: 'engine', name: '等离子引擎', price: 500000, stat: '速度 +15%', desc: '高能等离子推进，突破常规速度。', tier: 'B' },
  { id: 'eng-3', slot: 'engine', name: '曲速核心', price: 2000000, stat: '速度 +30%', desc: '压缩时空的曲速引擎，接近光速。', tier: 'A' },
  { id: 'eng-4', slot: 'engine', name: '量子跃迁引擎', price: 8000000, stat: '速度 +50%', desc: '量子隧穿驱动，瞬时跨越星域。', tier: 'S' },
  // 护盾
  { id: 'shd-1', slot: 'shield', name: '能量护盾 I', price: 100000, stat: '护盾 +100', desc: '基础偏导能量护盾。', tier: 'C' },
  { id: 'shd-2', slot: 'shield', name: '相位护盾', price: 500000, stat: '护盾 +300', desc: '相位偏移护盾，抵御多种攻击。', tier: 'B' },
  { id: 'shd-3', slot: 'shield', name: '自适应护盾', price: 2000000, stat: '护盾 +600', desc: '自适应学习护盾，越打越强。', tier: 'A' },
  { id: 'shd-4', slot: 'shield', name: '奇点护盾', price: 8000000, stat: '护盾 +1000', desc: '微型黑洞护盾，吞噬一切来袭。', tier: 'S' },
  // 武器
  { id: 'wpn-1', slot: 'weapon', name: '激光炮', price: 100000, stat: '火力 +10', desc: '标准激光武器，精准高效。', tier: 'C' },
  { id: 'wpn-2', slot: 'weapon', name: '等离子炮', price: 500000, stat: '火力 +30', desc: '高能等离子束，熔穿装甲。', tier: 'B' },
  { id: 'wpn-3', slot: 'weapon', name: '反物质炮', price: 2000000, stat: '火力 +60', desc: '反物质湮灭武器，毁灭性打击。', tier: 'A' },
  { id: 'wpn-4', slot: 'weapon', name: '量子崩坏炮', price: 8000000, stat: '火力 +100', desc: '瓦解量子结构的终极武器。', tier: 'S' },
  // 导航
  { id: 'nav-1', slot: 'nav', name: '基础导航仪', price: 100000, stat: '探测 +1', desc: '基础星图导航系统。', tier: 'C' },
  { id: 'nav-2', slot: 'nav', name: '量子雷达', price: 500000, stat: '探测 +3', desc: '量子纠缠雷达，透视星云。', tier: 'B' },
  { id: 'nav-3', slot: 'nav', name: '深空传感器', price: 2000000, stat: '探测 +5', desc: '深空多频段传感器阵列。', tier: 'A' },
  { id: 'nav-4', slot: 'nav', name: '全知之眼', price: 8000000, stat: '探测 +8', desc: '全维度感知系统，洞悉一切。', tier: 'S' },
  // 货舱
  { id: 'crg-1', slot: 'cargo', name: '标准货舱', price: 100000, stat: '容量 +10', desc: '基础货物储存空间。', tier: 'C' },
  { id: 'crg-2', slot: 'cargo', name: '压缩货舱', price: 500000, stat: '容量 +30', desc: '空间压缩技术，容量翻倍。', tier: 'B' },
  { id: 'crg-3', slot: 'cargo', name: '维度货舱', price: 2000000, stat: '容量 +60', desc: '折叠维度的储物空间。', tier: 'A' },
  { id: 'crg-4', slot: 'cargo', name: '奇点货舱', price: 8000000, stat: '容量 +100', desc: '近乎无限的储物维度。', tier: 'S' },
  // 涂装
  { id: 'pnt-1', slot: 'paint', name: '钛金灰', price: 50000, stat: '外观', desc: '低调的金属灰色涂装。', tier: 'C' },
  { id: 'pnt-2', slot: 'paint', name: '激光红', price: 200000, stat: '外观', desc: '炫目的激光红色涂装。', tier: 'B' },
  { id: 'pnt-3', slot: 'paint', name: '星云紫', price: 800000, stat: '外观', desc: '梦幻的星云紫色涂装。', tier: 'A' },
  { id: 'pnt-4', slot: 'paint', name: '虚空黑金', price: 3000000, stat: '外观', desc: '尊贵的虚空黑金涂装。', tier: 'S' },
];

export function partsBySlot(slot: PartSlot): ShipPart[] {
  return SHIP_PARTS.filter((p) => p.slot === slot);
}

export const TIER_COLOR: Record<string, string> = {
  S: '#f472b6',
  A: '#fbbf24',
  B: '#60a5fa',
  C: '#94a3b8',
};

// 默认配置（免费基础件）
export const DEFAULT_CONFIG: Record<PartSlot, string> = {
  engine: 'eng-1',
  shield: 'shd-1',
  weapon: 'wpn-1',
  nav: 'nav-1',
  cargo: 'crg-1',
  paint: 'pnt-1',
};

export function getPart(id: string): ShipPart | undefined {
  return SHIP_PARTS.find((p) => p.id === id);
}