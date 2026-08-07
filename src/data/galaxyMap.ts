// ===== 银河星图：星球节点数据 =====
export type StarType = 'explored' | 'unknown' | 'resource' | 'danger' | 'home';
export type StarStatus = 'discovered' | 'undiscovered';

export interface StarNode {
  id: string;
  name: string;
  type: StarType;
  status: StarStatus;
  x: number; // 百分比坐标 0-100
  y: number;
  size: number; // 节点半径
  danger: number; // 危险等级 1-5
  resource: string;
  desc: string;
  color: string; // 发光色
}

export const STAR_TYPE_META: Record<StarType, { label: string; icon: string; color: string }> = {
  home: { label: '母港', icon: '🏠', color: '#00f0ff' },
  explored: { label: '已探索', icon: '🌍', color: '#4ade80' },
  unknown: { label: '未知区域', icon: '❓', color: '#a78bfa' },
  resource: { label: '资源星域', icon: '💎', color: '#fbbf24' },
  danger: { label: '危险星域', icon: '⚠️', color: '#f87171' },
};

export const STAR_NODES: StarNode[] = [
  { id: 'home', name: '地球·母港', type: 'home', status: 'discovered', x: 50, y: 50, size: 22, danger: 0, resource: '人类文明', desc: '你的出发地，太阳系第三行星。一切星际旅程的起点。', color: '#00f0ff' },
  { id: 'moon', name: '月球前哨站', type: 'explored', status: 'discovered', x: 38, y: 42, size: 14, danger: 1, resource: '氦-3', desc: '人类第一个永久殖民地，氦-3开采基地。', color: '#4ade80' },
  { id: 'mars', name: '火星·新亚', type: 'explored', status: 'discovered', x: 64, y: 38, size: 16, danger: 2, resource: '铁矿石', desc: '红色星球上的第一座穹顶城市。', color: '#4ade80' },
  { id: 'belt', name: '小行星带', type: 'resource', status: 'discovered', x: 30, y: 60, size: 15, danger: 3, resource: '稀有金属', desc: '漂浮的矿石宝库，也是海盗出没之地。', color: '#fbbf24' },
  { id: 'jupiter', name: '木卫二', type: 'unknown', status: 'undiscovered', x: 72, y: 62, size: 17, danger: 3, resource: '???', desc: '冰层之下疑似存在液态海洋。信号未知。', color: '#a78bfa' },
  { id: 'kuiper', name: '柯伊伯带', type: 'danger', status: 'undiscovered', x: 20, y: 28, size: 16, danger: 5, resource: '暗物质', desc: '太阳系边缘的黑暗地带，辐射极高。', color: '#f87171' },
  { id: 'proxima', name: '比邻星b', type: 'unknown', status: 'undiscovered', x: 80, y: 30, size: 18, danger: 4, resource: '???', desc: '最近的系外宜居行星，大气成分待测。', color: '#a78bfa' },
  { id: 'sirius', name: '天狼星系', type: 'resource', status: 'undiscovered', x: 18, y: 72, size: 17, danger: 4, resource: '反物质', desc: '双星系统，蕴含罕见的反物质矿脉。', color: '#fbbf24' },
  { id: 'trappist', name: 'TRAPPIST-1', type: 'unknown', status: 'undiscovered', x: 85, y: 75, size: 19, danger: 3, resource: '???', desc: '七颗类地行星环绕的矮星系统。', color: '#a78bfa' },
  { id: 'vega', name: '织女星域', type: 'danger', status: 'undiscovered', x: 55, y: 18, size: 16, danger: 5, resource: '量子晶核', desc: '高温恒星系，量子风暴频发。', color: '#f87171' },
];

// 星球之间的航线连接（用于绘制连线）
export const STAR_LINKS: [string, string][] = [
  ['home', 'moon'],
  ['home', 'mars'],
  ['home', 'belt'],
  ['moon', 'kuiper'],
  ['mars', 'jupiter'],
  ['belt', 'sirius'],
  ['jupiter', 'proxima'],
  ['proxima', 'trappist'],
  ['sirius', 'trappist'],
  ['kuiper', 'vega'],
];