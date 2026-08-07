// ===== 星球/航点数据 =====
import type { Waypoint } from '@/types/types';

export const WPS: Waypoint[] = [
  { n: '地球·海口航天港', t: 'earth', d: '出发点', bg: 'bg-earth', g: '1.00G', a: 'N₂-O₂', dl: '24h', nt: '人类文明母星' },
  { n: '月球静海中转港', t: 'moon', d: '384,400km·8h', bg: 'bg-moon', g: '0.16G', a: '真空', dl: '27.3天', nt: '无' },
  { n: '火星奥林匹斯港', t: 'mars', d: '225M km·3d', bg: 'bg-mars', g: '0.38G', a: 'CO₂', dl: '24.6h', nt: '无' },
  { n: '太阳系跃迁枢纽', t: 'jump', d: '4.5B km·12d', bg: 'bg-jump', g: '0.8G', a: '人工', dl: '24h', nt: '无' },
  { n: '半人马座α星', t: 'centauri', d: '4.37ly·45d', bg: 'bg-centauri', g: '1.12G', a: 'N₂-O₂', dl: '28h', nt: '原始微生物' },
  { n: '仙女座M31', t: 'andromeda', d: '2.537M ly·180d', bg: 'bg-andromeda', g: '0.92G', a: 'N₂-O₂', dl: '36h', nt: '无' },
];

// 扩展航点（目的地页/路线匹配用）
export const EXTRA_WPS: Record<string, Waypoint> = {
  barnard: { n: '巴纳德星中转站', t: 'jump', d: '6光年·星际中转', bg: 'bg-barnard', g: '0.7G', a: '人工', dl: '25h', nt: '无' },
  ross128: { n: '罗斯128殖民地', t: 'jump', d: '11光年·红矮星殖民地', bg: 'bg-ross', g: '0.85G', a: '人工·N₂-O₂', dl: '22h', nt: '无' },
  gliese581: { n: '格利泽581宜居站', t: 'jump', d: '20光年·宜居带空间站', bg: 'bg-gliese', g: '0.95G', a: 'N₂-O₂', dl: '26h', nt: '无' },
  sirius: { n: '天狼星殖民地', t: 'jump', d: '8.6光年·亮星殖民地', bg: 'bg-sirius', g: '1.05G', a: 'N₂-O₂', dl: '30h', nt: '无' },
  lmc: { n: '大麦哲伦云前哨', t: 'jump', d: '16.3万光年·河外前哨', bg: 'bg-jump', g: '0.85G', a: '稀薄', dl: '22h', nt: '原始细菌' },
  ceres: { n: '谷神星补给站', t: 'jump', d: '小行星带·补给站', bg: 'bg-ceres', g: '0.03G', a: '真空', dl: '9h', nt: '无' },
  omphalos: { n: '翁法罗斯·永恒之地', t: 'omphalos', d: '忆庭之镜·虚拟演算世界', bg: 'bg-omphalos', g: '0.95G', a: '稀薄·含沙尘', dl: '32h', nt: '黄金裔(已湮灭)' },
  proxima: { n: '比邻星·三体世界', t: 'proxima', d: '半人马座α·红矮星·三体星系', bg: 'bg-proxima', g: '1.12G', a: 'N₂·含硫', dl: '??h·混沌', nt: '三体文明(已灭绝)' },
  b612: { n: 'B-612·小王子之星', t: 'b612', d: '小行星·比一座房子稍大', bg: 'bg-b621', g: '0.01G', a: '极稀薄', dl: '很短·可看44次日落', nt: '1朵玫瑰·3座火山' },
};

// 地名→节点名映射
export const LOC_MAP: Record<string, string> = {
  '地球': '地球·海口航天港', '海口': '地球·海口航天港', '地球（亚洲·海口）': '地球·海口航天港',
  '月球': '月球静海中转港', '月球静海中转港': '月球静海中转港',
  '火星': '火星奥林匹斯港', '火星奥林匹斯港': '火星奥林匹斯港',
  '谷神星': '谷神星补给站', '谷神星补给站': '谷神星补给站',
  '太阳系': '太阳系跃迁枢纽', '太阳系跃迁枢纽': '太阳系跃迁枢纽',
  '半人马座': '半人马座α星', '半人马座α星': '半人马座α星',
  '天狼星': '天狼星殖民地', '天狼星殖民地': '天狼星殖民地',
  '大麦哲伦': '大麦哲伦云前哨', '大麦哲伦云前哨': '大麦哲伦云前哨',
  '仙女座': '仙女座M31', '仙女座M31': '仙女座M31',
  '巴纳德': '巴纳德星中转站', '巴纳德星中转站': '巴纳德星中转站',
  '罗斯128': '罗斯128殖民地', '罗斯128殖民地': '罗斯128殖民地',
  '格利泽581': '格利泽581宜居站', '格利泽581宜居站': '格利泽581宜居站',
  '翁法罗斯': '翁法罗斯·永恒之地', '翁法罗斯·永恒之地': '翁法罗斯·永恒之地',
  '三体': '比邻星·三体世界', '三体星': '比邻星·三体世界', '比邻星': '比邻星·三体世界', '比邻星·三体世界': '比邻星·三体世界',
  'B621': 'B-612·小王子之星', 'B621星云': 'B-612·小王子之星', 'b621': 'B-612·小王子之星', 'B-612': 'B-612·小王子之星', 'B612': 'B-612·小王子之星', '小王子': 'B-612·小王子之星',
};

// 查找航点
export function findWaypoint(name: string): Waypoint {
  const matched = (() => {
    for (const k in LOC_MAP) {
      if (name.includes(k) || k.includes(name)) return LOC_MAP[k];
    }
    return name;
  })();
  for (const w of WPS) if (w.n === matched) return w;
  if (matched.includes('巴纳德')) return EXTRA_WPS.barnard;
  if (matched.includes('罗斯128')) return EXTRA_WPS.ross128;
  if (matched.includes('格利泽')) return EXTRA_WPS.gliese581;
  if (matched.includes('天狼星')) return EXTRA_WPS.sirius;
  if (matched.includes('大麦哲伦')) return EXTRA_WPS.lmc;
  if (matched.includes('谷神星')) return EXTRA_WPS.ceres;
  if (matched.includes('翁法罗斯')) return EXTRA_WPS.omphalos;
  if (matched.includes('比邻星') || matched.includes('三体')) return EXTRA_WPS.proxima;
  if (matched.includes('B621') || matched.includes('b621') || matched.includes('B612') || matched.includes('小王子')) return EXTRA_WPS.b612;
  return { n: matched, t: 'jump', d: '自定义节点', bg: 'bg-jump', g: '?', a: '?', dl: '?', nt: '?' };
}

// 根据起终点+中转动态生成路线
export function buildWP(origin: string, transits: string[], dest: string): Waypoint[] {
  const nodes: Waypoint[] = [];
  const seen: Record<string, boolean> = {};
  const add = (s: string) => {
    const node = findWaypoint(s);
    if (!seen[node.n]) { seen[node.n] = true; nodes.push(node); }
  };
  add(origin || '地球（亚洲·海口）');
  transits.forEach((t) => { if (t.trim()) add(t.trim()); });
  if (dest) add(dest);
  return nodes.length >= 2 ? nodes : WPS;
}

// 候选地点
export const CANDIDATES = [
  '地球（亚洲·海口）', '月球静海中转港', '火星奥林匹斯港', '谷神星补给站', '太阳系跃迁枢纽',
  '半人马座α星', '天狼星殖民地', '大麦哲伦云前哨', '仙女座M31', '巴纳德星中转站', '罗斯128殖民地', '格利泽581宜居站',
];
