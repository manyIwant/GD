// ===== 每日任务模板 =====
export interface TaskTemplate {
  code: string;
  desc: string;
  target: number;
  rewardXp: number;
  rewardBalance: number;
}

export const TASK_TEMPLATES: TaskTemplate[] = [
  { code: 'book_flight', desc: '预订任意航班', target: 1, rewardXp: 50, rewardBalance: 500 },
  { code: 'book_mars', desc: '预订飞往火星的航班', target: 1, rewardXp: 80, rewardBalance: 800 },
  { code: 'complete_flight', desc: '完成一次星际航行', target: 1, rewardXp: 150, rewardBalance: 1500 },
  { code: 'sign_in', desc: '完成每日签到', target: 1, rewardXp: 50, rewardBalance: 200 },
  { code: 'recharge', desc: '充值信用点', target: 1, rewardXp: 60, rewardBalance: 600 },
  { code: 'view_dest', desc: '浏览3个目的地详情', target: 3, rewardXp: 40, rewardBalance: 400 },
];
