// ===== 高德星际 类型定义 =====

export type OrderStatus = 'pending' | 'flying' | 'done' | 'cancelled';
export type TaskStatus = 'in_progress' | 'completed' | 'claimed';
export type UserRole = 'user' | 'admin';

// 数据库行类型
export interface Profile {
  id: string;
  email: string | null;
  phone: string | null;
  role: UserRole;
  username: string | null;
  avatar_url: string | null;
  balance: number;
  xp: number;
  level: number;
  light_years_traveled: number;
  orders_completed: number;
  achievements_count: number;
  selected_ship: string;
  last_sign_in_date: string | null;
  sign_in_streak: number;
  created_at: string;
}

export interface OrderRow {
  id: string;
  user_id: string;
  order_number: string;
  origin: string;
  destination: string;
  plan_code: string;
  plan_name: string;
  icon: string | null;
  cabin: string;
  price: number;
  status: OrderStatus;
  departure_time: string;
  arrival_time: string;
  waypoints: Waypoint[];
  rad: string | null;
  ticket_number: string | null;
  purchases: Purchase[];
  ship_code: string;
  light_years: number;
  created_at: string;
}

export interface AchievementRow {
  id: string;
  user_id: string;
  achievement_code: string;
  unlocked_at: string;
}

export interface DailyTaskRow {
  id: string;
  user_id: string;
  task_date: string;
  task_code: string;
  task_desc: string;
  target_value: number;
  current_value: number;
  reward_xp: number;
  reward_balance: number;
  status: TaskStatus;
  created_at: string;
}

export interface FlightLogRow {
  id: string;
  user_id: string;
  order_id: string | null;
  destination: string;
  ship_name: string;
  light_years: number;
  arrived_at: string;
  postcard_data: PostcardData;
}

export interface UnlockedShipRow {
  id: string;
  user_id: string;
  ship_code: string;
  unlocked_at: string;
}

// 游戏数据类型
export interface Plan {
  n: string; // 名称
  p: number; // 价格（数字）
  c: string; // 舱位
  r: string; // 辐射防护
  d: number; // 天数
  i: string; // 图标
}

export interface Waypoint {
  n: string; // 名称
  t: string; // 类型
  d: string; // 描述
  bg: string; // 背景css类
  g: string; // 重力
  a: string; // 大气
  dl: string; // 日长
  nt: string; // 原住民
}

export interface Purchase {
  item: string;
  price: string;
}

export interface PostcardData {
  origin?: string;
  destination?: string;
  cabin?: string;
  price?: number;
  plan_code?: string;
}

export interface EraData {
  id: string;
  name: string;
  year: string;
  color: string;
  icon: string;
  desc: string;
  scene: string;
}

export interface AchievementDef {
  id: string;
  name: string;
  desc: string;
  icon: string;
}

export interface ShipDef {
  code: string;
  name: string;
  icon: string;
  desc: string;
  unlockLevel: number;
  buffType: 'speed' | 'discount' | 'xp';
  buffValue: number; // 速度倍率/折扣比例/xp加成比例
  accent: string; // 主题色
}

export interface LevelTier {
  level: number;
  name: string;
  minXp: number;
  icon: string;
  perk: string;
}

export interface CosmicEvent {
  title: string;
  body: string;
  cond: (p: number) => boolean;
  choices?: EventChoice[];
}

export interface EventChoice {
  label: string;
  type: 'game' | 'reward' | 'risk';
  desc: string;
  rewardXp?: number;
  rewardBalance?: number;
  riskBalance?: number;
}

export interface LeaderboardEntry {
  id: string;
  username: string | null;
  avatar_url: string | null;
  level: number;
  xp: number;
  light_years_traveled: number;
  orders_completed: number;
  achievements_count: number;
  rank: number;
}

export interface DestinationDetail {
  wp: Waypoint;
  pi: string; // 物资指数
  ox: string; // 氧气
  im: string; // 进口
  sp: string; // 观光
  tp: string; // 提示
}
