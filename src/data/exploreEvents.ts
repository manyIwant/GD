// ===== 银河星图：探索宇宙事件 =====

export type ExploreRewardType = 'credit' | 'xp' | 'memento' | 'achievement';
export type ExplorePenaltyType = 'part' | 'credit';

export interface ExploreEvent {
  id: string;
  title: string;
  body: string;
  icon: string;
  rewardType: ExploreRewardType;
  rewardValue: number; // 信用点/XP 数值；纪念品/成就时为索引
  rewardLabel: string;
  penaltyType: ExplorePenaltyType;
  penaltyValue: number; // 损失信用点
  penaltyLabel: string;
  successRate: number; // 0-1
}

// 神秘纪念品
export const MEMENTOS = [
  { name: '远古星图碎片', desc: '一块刻有未知星图的古老碎片，指向某个被遗忘的星域。', emoji: '📜' },
  { name: '量子玫瑰', desc: '同时存在于两种状态的奇异花朵，永不凋零。', emoji: '🌹' },
  { name: '虚空之眼', desc: '一颗能映照出平行宇宙的神秘宝石。', emoji: '🔮' },
  { name: '时间沙漏', desc: '沙子逆流而上的沙漏，据说能窥见未来。', emoji: '⏳' },
  { name: '星骸碎片', desc: '一颗超新星爆发的遗骸，蕴含微弱的生命能量。', emoji: '💎' },
  { name: '幽灵信号卡', desc: '记录着一段无法解码的古老广播的存储卡。', emoji: '📡' },
];

// 可解锁的探索成就
export const EXPLORE_ACHIEVEMENTS = [
  { name: '深空拓荒者', desc: '在银河星图中探索了第一个未知星域。' },
  { name: '星图收藏家', desc: '收集了第一件神秘纪念品。' },
  { name: '银河制图师', desc: '探索了银河星图中一半以上的星域。' },
];

export const EXPLORE_EVENTS: ExploreEvent[] = [
  {
    id: 'ev-derelict',
    title: '废弃飞船残骸',
    body: '你发现了一艘漂浮在虚空中的废弃飞船，船体布满弹孔。扫描显示内部仍有微弱能量反应，或许藏着宝藏——也可能是陷阱。',
    icon: '🛸',
    rewardType: 'credit',
    rewardValue: 2000000,
    rewardLabel: '200万信用点',
    penaltyType: 'part',
    penaltyValue: 500000,
    penaltyLabel: '损失一个已装备零件',
    successRate: 0.6,
  },
  {
    id: 'ev-merchant',
    title: '星际商队',
    body: '一支星际商队向你发来交易信号。他们声称有一批稀有纪念品，只送给有缘的探索者。但商队的来历……有些可疑。',
    icon: '💰',
    rewardType: 'memento',
    rewardValue: 0,
    rewardLabel: '一件神秘纪念品',
    penaltyType: 'credit',
    penaltyValue: 800000,
    penaltyLabel: '损失80万信用点',
    successRate: 0.55,
  },
  {
    id: 'ev-cache',
    title: '隐藏资源舱',
    body: '导航系统探测到附近有一个被加密的隐藏资源舱。破解它需要消耗飞船算力，但里面的信用点储备可能非常可观。',
    icon: '📦',
    rewardType: 'credit',
    rewardValue: 5000000,
    rewardLabel: '500万信用点',
    penaltyType: 'credit',
    penaltyValue: 1000000,
    penaltyLabel: '损失100万信用点',
    successRate: 0.5,
  },
  {
    id: 'ev-ancient',
    title: '远古文明遗迹',
    body: '你发现了一座沉睡了亿万年的远古文明遗迹。遗迹中似乎封存着某种力量，触碰它可能获得无上的馈赠，也可能招致未知的反噬。',
    icon: '🏛️',
    rewardType: 'achievement',
    rewardValue: 0,
    rewardLabel: '解锁隐藏成就',
    penaltyType: 'part',
    penaltyValue: 1000000,
    penaltyLabel: '损失一个已装备零件',
    successRate: 0.45,
  },
  {
    id: 'ev-mystery',
    title: '神秘信号源',
    body: '一段来自未知维度的神秘信号正在呼唤你。回应它，你可能会获得超越常理的馈赠；但有些信号，本不该被回应……',
    icon: '🌀',
    rewardType: 'memento',
    rewardValue: 0,
    rewardLabel: '一件稀有纪念品',
    penaltyType: 'credit',
    penaltyValue: 1500000,
    penaltyLabel: '损失150万信用点',
    successRate: 0.4,
  },
];

export function pickExploreEvent(): ExploreEvent {
  return EXPLORE_EVENTS[Math.floor(Math.random() * EXPLORE_EVENTS.length)];
}