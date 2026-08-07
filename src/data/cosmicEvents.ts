// ===== 随机宇宙事件数据 =====
import type { CosmicEvent } from '@/types/types';

export type EventChoiceType = 'game' | 'reward' | 'risk';

export interface EventChoice {
  label: string;
  type: EventChoiceType;
  desc: string;
  rewardXp?: number;
  rewardBalance?: number;
  riskBalance?: number; // 失败/风险扣除
}

export const COSMIC_EVENTS: CosmicEvent[] = [
  {
    title: '📡 收到陌生讯号',
    body: '飞船通讯阵列接收到一段无法解码的脉冲信号。来源未知。信号中包含一种重复模式——每22分钟重复一次，与任何已知天体周期都不匹配。舰长建议：继续航行，不要在日志中记录此事。',
    cond: (p) => p > 10 && p < 40,
    choices: [
      { label: '尝试解码', type: 'game', desc: '破解这段神秘信号，可能获得稀有数据奖励', rewardXp: 60, rewardBalance: 600 },
      { label: '记录并忽略', type: 'reward', desc: '在日志中留下一笔，获得少量经验', rewardXp: 20 },
    ],
  },
  {
    title: '🌟 观测到超新星爆发',
    body: '银河系旋臂方向检测到一次II型超新星爆发。距离约12万光年。飞船防护系统正在自动调整辐射屏蔽。你透过舷窗看到的光——是那颗恒星在12万年前死去的最后一瞥。',
    cond: (p) => p > 30 && p < 70,
    choices: [
      { label: '采集辐射样本', type: 'game', desc: '校准量子序列采集稀有辐射样本', rewardXp: 80, rewardBalance: 1000 },
      { label: '调整屏蔽继续', type: 'reward', desc: '稳妥起见，获得少量经验', rewardXp: 25 },
    ],
  },
  {
    title: '🌀 时空褶皱预警',
    body: '前方航线检测到轻微时空褶皱——跃迁引擎能量波动约3.7%。飞船AI建议：降低0.02c巡航速度以避开扰动区域。预计到达时间将延迟约2小时。',
    cond: (p) => p > 50,
    choices: [
      { label: '强行穿越褶皱', type: 'risk', desc: '高风险高回报：成功获得大量经验，失败损失信用点', rewardXp: 120, riskBalance: 1500 },
      { label: '绕行避险', type: 'reward', desc: '安全绕行，获得少量经验', rewardXp: 30 },
    ],
  },
  {
    title: '👁 未知物体掠过',
    body: '一个金属光泽的物体从3点钟方向高速掠过飞船。直径约2米，梭形，表面无任何推进器痕迹。它没有响应任何通讯尝试。舰长的个人日志写着一行：「我不认为那是机器。」',
    cond: (p) => p > 20 && p < 80,
    choices: [
      { label: '追踪并躲避', type: 'game', desc: '操控飞船躲避未知物体的引力碎片', rewardXp: 70, rewardBalance: 800 },
      { label: '保持距离观察', type: 'reward', desc: '记录这一发现，获得少量经验', rewardXp: 25 },
    ],
  },
  {
    title: '💤 集体梦境',
    body: '休眠舱监控显示——所有处于休眠状态的乘客在同一时间进入了REM睡眠。他们的脑波模式高度相似，仿佛在做同一个梦。梦境内容无法获取。醒来后，没有人记得梦见了什么。',
    cond: (p) => p > 40,
    choices: [
      { label: '记录脑波数据', type: 'reward', desc: '这段数据极具科研价值，获得经验与信用点', rewardXp: 50, rewardBalance: 500 },
    ],
  },
];

export function pickCosmicEvent(progress: number, isHibernating: boolean): CosmicEvent | null {
  const candidates = COSMIC_EVENTS.filter((e) => {
    if (e.title.includes('集体梦境') && !isHibernating) return false;
    return e.cond(progress);
  });
  if (candidates.length === 0) return null;
  if (Math.random() < 0.6) return null; // 40% 触发概率（在检测窗口内）
  return candidates[Math.floor(Math.random() * candidates.length)];
}

// ===== 宇宙事件小游戏类型 =====
export type MiniGameType = 'decode' | 'dodge' | 'sequence';

export interface MiniGameDef {
  type: MiniGameType;
  title: string;
  desc: string;
}

export const MINI_GAMES: MiniGameDef[] = [
  { type: 'decode', title: '解码神秘信号', desc: '按正确顺序点击闪烁的字符，破解来自虚空的讯号。' },
  { type: 'dodge', title: '躲避流星群', desc: '左右移动飞船，避开高速袭来的流星碎片。' },
  { type: 'sequence', title: '量子序列校准', desc: '记住并复现仪器面板上的灯光闪烁顺序。' },
];

export function pickMiniGame(): MiniGameDef {
  return MINI_GAMES[Math.floor(Math.random() * MINI_GAMES.length)];
}
