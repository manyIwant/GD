// ===== 银河帝国风·宏大星系地图数据 =====

export type StarType = 'capital' | 'core' | 'colony' | 'station' | 'nebula' | 'blackhole' | 'pulsar' | 'home';
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
  faction?: string; // 所属势力/文明
  population?: string;
}

export const STAR_TYPE_META: Record<StarType, { label: string; icon: string }> = {
  capital: { label: '帝国首都', icon: '👑' },
  core: { label: '核心星系', icon: '⭐' },
  colony: { label: '殖民地', icon: '🏘️' },
  station: { label: '空间站', icon: '🛰️' },
  nebula: { label: '星云', icon: '🌌' },
  blackhole: { label: '黑洞', icon: '🕳️' },
  pulsar: { label: '脉冲星', icon: '💫' },
  home: { label: '母港', icon: '🏠' },
};

// 宏大银河星图节点（银河帝国风：螺旋分布、势力割据、文明星罗棋布）
export const STAR_NODES: StarNode[] = [
  // —— 银河核心区（帝国权力中心）——
  { id: 'home', name: '海口航天港', type: 'home', status: 'discovered', x: 50, y: 52, size: 26, danger: 1, resource: '补给', desc: '人类文明的母港，一切星际航行的起点。蓝色的地球在身后缓缓旋转，承载着七十亿人的目光。', color: '#22d3ee', faction: '地球联合体', population: '80亿' },
  { id: 'trantor', name: '川陀', type: 'capital', status: 'discovered', x: 30, y: 30, size: 34, danger: 2, resource: '政务·科技', desc: '银河帝国的首都星，整颗行星被金属穹顶覆盖，四百亿居民终年不见天日。帝国的权力在此流转，文明的脉搏在此跳动。', color: '#fbbf24', faction: '银河帝国', population: '400亿' },
  { id: 'terminus', name: '端点星', type: 'core', status: 'discovered', x: 72, y: 26, size: 24, danger: 2, resource: '百科全书', desc: '银河边缘的荒凉小星，端点基地的所在地。第一基地在此建立，以编纂《银河百科全书》为名，暗中积蓄着改变银河的力量。', color: '#60a5fa', faction: '第一基地', population: '1亿' },
  { id: 'coruscant', name: '科洛桑', type: 'core', status: 'discovered', x: 38, y: 18, size: 28, danger: 2, resource: '金融·贸易', desc: '银河金融中心，整颗星球就是一座永不熄灭的城市。万亿信用点在此流转，星际银行的塔楼直插云霄。', color: '#a78bfa', faction: '银河帝国', population: '120亿' },
  { id: 'sirius', name: '天狼星殖民地', type: 'colony', status: 'discovered', x: 62, y: 40, size: 22, danger: 3, resource: '反物质矿', desc: '沐浴在天狼星A耀眼蓝白光辉下的殖民地，反物质矿脉在地下幽幽发光。这里的居民皮肤泛着淡蓝。', color: '#38bdf8', faction: '地球联合体', population: '8亿' },
  { id: 'alpha', name: '半人马座α', type: 'colony', status: 'discovered', x: 20, y: 46, size: 22, danger: 3, resource: '微生物', desc: '三颗恒星交相辉映的星系，比邻星b上发现了原始微生物。紫红色的天空下，潮汐塑造着奇异的景观。', color: '#f472b6', faction: '地球联合体', population: '3亿' },

  // —— 内环殖民带 ——
  { id: 'mars', name: '火星·奥林匹斯港', type: 'colony', status: 'discovered', x: 44, y: 62, size: 22, danger: 2, resource: '铁·氘', desc: '太阳系最高峰奥林匹斯山脚下的红色殖民地。沙尘在稀薄大气中漫舞，两极冰盖与赤道峡谷构成壮丽对比。', color: '#ef4444', faction: '地球联合体', population: '5亿' },
  { id: 'luna', name: '月球·静海港', type: 'station', status: 'discovered', x: 54, y: 44, size: 18, danger: 1, resource: '氦-3', desc: '人类第一个永久地外殖民地，银灰月壤在无大气环境下反射柔和冷光。低重力让每一次跳跃都像在梦中漫步。', color: '#94a3b8', faction: '地球联合体', population: '2亿' },
  { id: 'ceres', name: '谷神星补给站', type: 'station', status: 'discovered', x: 40, y: 70, size: 18, danger: 2, resource: '冰·盐', desc: '小行星带的矮行星补给站，表面布满神秘亮点——地下卤水湖的冰盐沉积，在阳光下闪烁着神秘光芒。', color: '#e2e8f0', faction: '地球联合体', population: '5000万' },
  { id: 'jupiter', name: '木星·大红斑站', type: 'station', status: 'undiscovered', x: 28, y: 64, size: 24, danger: 4, resource: '氢·氦', desc: '悬浮在木星狂暴大气中的巨型浮空站，大红斑风暴在脚下永不停歇地翻涌，规模足以吞噬整颗地球。', color: '#f59e0b', faction: '地球联合体', population: '8000万' },
  { id: 'saturn', name: '土星·环带城', type: 'station', status: 'undiscovered', x: 16, y: 56, size: 26, danger: 3, resource: '冰·稀有气体', desc: '建造在土星壮丽光环上的城市，居民在冰晶环带间穿梭。从环上望去，土星是一颗悬在虚空中的金色巨球。', color: '#fcd34d', faction: '地球联合体', population: '1亿' },

  // —— 中环文明带 ——
  { id: 'barnard', name: '巴纳德星中转站', type: 'station', status: 'undiscovered', x: 80, y: 50, size: 20, danger: 2, resource: '中转·贸易', desc: '通往更远星域的门户，红矮星以极高自行速度划过天际。中转站悬浮在星系尘埃带中，是旅行者的温暖港湾。', color: '#fb7185', faction: '自由商盟', population: '6000万' },
  { id: 'ross128', name: '罗斯128殖民地', type: 'colony', status: 'undiscovered', x: 86, y: 38, size: 20, danger: 2, resource: '宜居土地', desc: '围绕平静红矮星运行的宜居殖民地，温和气候与稳定环境让它成为深空移民的理想家园。', color: '#f9a8d4', faction: '自由商盟', population: '4亿' },
  { id: 'gliese', name: '格利泽581宜居站', type: 'station', status: 'undiscovered', x: 84, y: 64, size: 20, danger: 3, resource: '宜居带研究', desc: '位于宜居带黄金位置的空间站，围绕红矮星运行。这里是研究系外宜居性的前沿基地。', color: '#c084fc', faction: '自由商盟', population: '3000万' },
  { id: 'proxima', name: '比邻星·三体世界', type: 'colony', status: 'undiscovered', x: 14, y: 40, size: 24, danger: 5, resource: '文明遗迹', desc: '曾孕育高度发达三体文明的星球，如今只剩断壁残垣。三颗恒星的无序运动造就混沌天空，文明在乱纪元中湮灭。', color: '#f87171', faction: '已湮灭文明', population: '0' },
  { id: 'b612', name: 'B-612·小王子之星', type: 'colony', status: 'undiscovered', x: 90, y: 24, size: 16, danger: 1, resource: '玫瑰·火山', desc: '一颗比房子稍大的小行星，小王子曾在此守护他唯一的玫瑰。这里的一天可以看44次日落。', color: '#fde68a', faction: '无', population: '1' },

  // —— 外环·银河边缘 ——
  { id: 'andromeda', name: '仙女座M31', type: 'core', status: 'undiscovered', x: 10, y: 20, size: 30, danger: 4, resource: '河外文明', desc: '本星系群中最大的星系，距离地球254万光年。跨越星系际虚空的旅程本身，就是一场关于孤独与宏大的朝圣。', color: '#818cf8', faction: '河外文明', population: '未知' },
  { id: 'lmc', name: '大麦哲伦云前哨', type: 'station', status: 'undiscovered', x: 8, y: 76, size: 22, danger: 4, resource: '超新星遗迹', desc: '银河系的卫星星系，距离16.3万光年。这片河外前哨是人类探索宇宙的最远疆界，蜘蛛星云在此绚烂绽放。', color: '#67e8f9', faction: '探索者联盟', population: '2000万' },
  { id: 'omphalos', name: '翁法罗斯·永恒之地', type: 'nebula', status: 'undiscovered', x: 92, y: 80, size: 24, danger: 4, resource: '虚拟演算', desc: '忆庭之镜创造的虚拟演算世界，黄金裔文明在此湮灭。时间被冻结在永恒的黄昏，金色沙尘与破碎镜面构成超现实景观。', color: '#fcd34d', faction: '已湮灭文明', population: '0' },

  // —— 奇观天体 ——
  { id: 'sagittarius', name: '人马座A*黑洞', type: 'blackhole', status: 'undiscovered', x: 48, y: 14, size: 30, danger: 5, resource: '时空奇点', desc: '银河系中心的超大质量黑洞，四百万倍太阳质量。事件视界吞噬一切，连光也无法逃脱。在它面前，文明渺小如尘埃。', color: '#1e1b4b', faction: '无', population: '0' },
  { id: 'crab', name: '蟹状星云', type: 'nebula', status: 'undiscovered', x: 66, y: 78, size: 24, danger: 3, resource: '中子星·重元素', desc: '一颗超新星爆发的壮丽遗迹，中心是一颗高速自转的脉冲星。绚烂的气体丝带在虚空中舒展，美得令人窒息。', color: '#22d3ee', faction: '无', population: '0' },
  { id: 'orion', name: '猎户座大星云', type: 'nebula', status: 'undiscovered', x: 24, y: 80, size: 26, danger: 2, resource: '恒星摇篮', desc: '银河系中最壮观的恒星诞生地，无数新生的恒星在气体云中点燃。这里是宇宙的产房，生命之源。', color: '#c084fc', faction: '无', population: '0' },
  { id: 'pulsar1', name: 'PSR·灯塔脉冲星', type: 'pulsar', status: 'undiscovered', x: 58, y: 86, size: 18, danger: 4, resource: '辐射能', desc: '一颗每秒自转数百次的脉冲星，两束辐射如灯塔般扫过宇宙。它的节拍精准得像宇宙的心跳。', color: '#67e8f9', faction: '无', population: '0' },
  { id: 'vega', name: '织女星·天琴座', type: 'core', status: 'undiscovered', x: 76, y: 12, size: 22, danger: 2, resource: '戴森云', desc: '银河中最明亮的恒星之一，围绕它建造的戴森云收集着恒星的全部能量。这里是高阶文明的能源心脏。', color: '#93c5fd', faction: '高阶文明', population: '未知' },
];

// 星系间航线连接（构成银河网络）
export const STAR_LINKS: [string, string][] = [
  ['home', 'luna'], ['home', 'mars'], ['home', 'sirius'], ['home', 'alpha'],
  ['luna', 'mars'], ['mars', 'ceres'], ['ceres', 'jupiter'], ['jupiter', 'saturn'],
  ['saturn', 'alpha'], ['alpha', 'proxima'], ['alpha', 'trantor'],
  ['trantor', 'coruscant'], ['trantor', 'sirius'], ['coruscant', 'terminus'],
  ['sirius', 'terminus'], ['terminus', 'b612'], ['terminus', 'barnard'],
  ['barnard', 'ross128'], ['barnard', 'gliese'], ['ross128', 'gliese'],
  ['gliese', 'omphalos'], ['b612', 'vega'], ['vega', 'andromeda'],
  ['sirius', 'vega'], ['coruscant', 'sagittarius'], ['sagittarius', 'vega'],
  ['mars', 'crab'], ['crab', 'pulsar1'], ['pulsar1', 'omphalos'],
  ['ceres', 'orion'], ['orion', 'saturn'], ['orion', 'proxima'],
  ['proxima', 'andromeda'], ['lmc', 'omphalos'], ['lmc', 'andromeda'],
  ['trantor', 'sagittarius'], ['home', 'trantor'],
];
