// ===== Supabase API 层 =====
import { supabase } from '@/db/supabase';
import type {
  Profile, OrderRow, AchievementRow, DailyTaskRow, FlightLogRow, UnlockedShipRow, LeaderboardEntry,
  ShipProgressRow, SpinRecordRow, PublicProfile, RiskItem, AdminUserDetail,
} from '@/types/types';

// ===== Auth =====
export async function signUp(username: string, password: string) {
  const email = `${username}@miaoda.com`;
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function signIn(username: string, password: string) {
  const email = `${username}@miaoda.com`;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  await supabase.auth.signOut();
}

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

// ===== Profile =====
export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data as Profile | null;
}

export async function updateProfile(userId: string, patch: Partial<Profile>): Promise<void> {
  const { error } = await supabase.from('profiles').update(patch).eq('id', userId);
  if (error) throw error;
}

export async function updateBalance(userId: string, amount: number): Promise<void> {
  const { error } = await supabase.rpc('inc_balance', {
    p_user_id: userId,
    p_amount: amount,
  });
  if (error) {
    // fallback：直接 update
    const profile = await fetchProfile(userId);
    if (profile) {
      await updateProfile(userId, { balance: profile.balance + amount });
    }
    return;
  }
}

// 充值
export async function recharge(userId: string, amount: number): Promise<void> {
  // 任务进度
  await incTaskProgress(userId, 'recharge', 1);
  await updateBalance(userId, amount);
}

// 增加经验值
export async function addXp(userId: string, amount: number): Promise<void> {
  const { error } = await supabase.rpc('inc_xp', { p_user_id: userId, p_amount: amount });
  if (error) {
    const profile = await fetchProfile(userId);
    if (profile) await updateProfile(userId, { xp: (profile.xp || 0) + amount });
  }
}

// 扣除信用点（事件惩罚等）
export async function deductBalance(userId: string, amount: number): Promise<void> {
  await updateBalance(userId, -amount);
}

// 保存个人飞船配置
export async function saveShipConfig(userId: string, config: Record<string, string>): Promise<void> {
  const { error } = await supabase.rpc('save_ship_config', { p_config: config });
  if (error) throw error;
}

// 添加纪念品
export async function addMemento(userId: string, name: string, desc: string, emoji: string): Promise<void> {
  const { error } = await supabase.rpc('add_memento', { p_name: name, p_desc: desc, p_emoji: emoji });
  if (error) throw error;
}

// 解锁探索成就
export async function unlockExploreAchievement(userId: string, name: string): Promise<void> {
  const { error } = await supabase.rpc('unlock_explore_achievement', { p_name: name });
  if (error) throw error;
}

// ===== Orders =====
export async function fetchOrders(userId: string): Promise<OrderRow[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return Array.isArray(data) ? (data as OrderRow[]) : [];
}

export async function createOrder(order: Omit<OrderRow, 'id' | 'order_number' | 'created_at'>): Promise<OrderRow | null> {
  const { data, error } = await supabase
    .from('orders')
    .insert(order)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data as OrderRow | null;
}

export async function updateOrderStatus(orderId: string, status: OrderRow['status']): Promise<void> {
  const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);
  if (error) throw error;
}

export async function updateOrder(orderId: string, patch: Partial<OrderRow>): Promise<void> {
  const { error } = await supabase.from('orders').update(patch).eq('id', orderId);
  if (error) throw error;
}

export async function deleteOrder(orderId: string): Promise<void> {
  const { error } = await supabase.from('orders').delete().eq('id', orderId);
  if (error) throw error;
}

// 完成订单（RPC，原子操作：扣状态+加XP+加光年+生成明信片+任务进度）
export async function completeOrder(orderId: string) {
  const { data, error } = await supabase.rpc('complete_order', { p_order_id: orderId });
  if (error) throw error;
  return data;
}

// ===== Achievements =====
export async function fetchAchievements(userId: string): Promise<AchievementRow[]> {
  const { data, error } = await supabase
    .from('achievements')
    .select('*')
    .eq('user_id', userId)
    .order('unlocked_at', { ascending: false });
  if (error) throw error;
  return Array.isArray(data) ? (data as AchievementRow[]) : [];
}

export async function unlockAchievement(code: string) {
  const { data, error } = await supabase.rpc('unlock_achievement', { p_code: code });
  if (error) throw error;
  return data;
}

// ===== Daily Tasks =====
export async function fetchDailyTasks(userId: string): Promise<DailyTaskRow[]> {
  const today = new Date().toISOString().slice(0, 10);
  // 确保当天任务已生成（新用户当天也能看到任务）
  await supabase.rpc('ensure_daily_tasks');
  const { data, error } = await supabase
    .from('daily_tasks')
    .select('*')
    .eq('user_id', userId)
    .eq('task_date', today)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return Array.isArray(data) ? (data as DailyTaskRow[]) : [];
}

export async function claimDailyTask(taskId: string) {
  const { data, error } = await supabase.rpc('claim_daily_task', { p_task_id: taskId });
  if (error) throw error;
  return data;
}

export async function incTaskProgress(userId: string, taskCode: string, increment: number = 1): Promise<void> {
  // 客户端直接更新（RLS允许用户更新自己的任务）
  const today = new Date().toISOString().slice(0, 10);
  const { data: tasks } = await supabase
    .from('daily_tasks')
    .select('*')
    .eq('user_id', userId)
    .eq('task_date', today)
    .eq('task_code', taskCode)
    .eq('status', 'in_progress');
  if (tasks && tasks.length > 0) {
    const t = tasks[0] as DailyTaskRow;
    const newVal = Math.min(t.current_value + increment, t.target_value);
    const newStatus = newVal >= t.target_value ? 'completed' : 'in_progress';
    await supabase.from('daily_tasks').update({ current_value: newVal, status: newStatus }).eq('id', t.id);
  }
}

// ===== Daily Sign-in =====
export async function dailySignIn() {
  const { data, error } = await supabase.rpc('daily_sign_in');
  if (error) throw error;
  return data;
}

// ===== Flight Logs（星际明信片）=====
export async function fetchFlightLogs(userId: string): Promise<FlightLogRow[]> {
  const { data, error } = await supabase
    .from('flight_logs')
    .select('*')
    .eq('user_id', userId)
    .order('arrived_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return Array.isArray(data) ? (data as FlightLogRow[]) : [];
}

// ===== Unlocked Ships =====
export async function fetchUnlockedShips(userId: string): Promise<UnlockedShipRow[]> {
  const { data, error } = await supabase
    .from('unlocked_ships')
    .select('*')
    .eq('user_id', userId)
    .order('unlocked_at', { ascending: true });
  if (error) throw error;
  return Array.isArray(data) ? (data as UnlockedShipRow[]) : [];
}

export async function unlockShip(code: string) {
  const { data, error } = await supabase.rpc('unlock_ship', { p_code: code });
  if (error) throw error;
  return data;
}

export async function selectShip(userId: string, code: string): Promise<void> {
  await updateProfile(userId, { selected_ship: code });
}

// ===== Leaderboard =====
export async function fetchLeaderboard(category: 'light_years' | 'orders' | 'achievements' | 'xp', limit: number = 50): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase.rpc('get_leaderboard', {
    p_category: category,
    p_limit: limit,
  });
  if (error) throw error;
  return Array.isArray(data) ? (data as LeaderboardEntry[]) : [];
}

// 获取用户排名
export async function fetchUserRank(userId: string, category: 'light_years' | 'orders' | 'achievements' | 'xp'): Promise<number | null> {
  const all = await fetchLeaderboard(category, 1000);
  const entry = all.find((e) => e.id === userId);
  return entry ? entry.rank : null;
}

// ===== 飞船公司经验与属性升级 =====
export async function fetchShipProgress(userId: string): Promise<ShipProgressRow[]> {
  const { data, error } = await supabase.from('ship_progress').select('*').eq('user_id', userId).order('updated_at', { ascending: false });
  if (error) throw error;
  return Array.isArray(data) ? (data as ShipProgressRow[]) : [];
}

export async function spendShipUpgrade(shipCode: string, attr: string, node: number): Promise<{ attr: string; node: number; upgrade_points: number }> {
  const { data, error } = await supabase.rpc('spend_ship_upgrade', { p_ship_code: shipCode, p_attr: attr, p_node: node });
  if (error) throw error;
  return data as { attr: string; node: number; upgrade_points: number };
}

// ===== 转盘抽奖 =====
export async function spinWheel(cost: number): Promise<{ type: string; value: number; label: string; icon: string }> {
  const { data, error } = await supabase.rpc('spin_wheel', { p_cost: cost });
  if (error) throw error;
  return data as { type: string; value: number; label: string; icon: string };
}

export async function fetchSpinRecords(userId: string, limit: number = 10): Promise<SpinRecordRow[]> {
  const { data, error } = await supabase.from('spin_records').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(limit);
  if (error) throw error;
  return Array.isArray(data) ? (data as SpinRecordRow[]) : [];
}

// ===== 封号申诉 / 公开资料 / 风控 =====
export async function appealUnban(answers: { id: number; answer: boolean }[]): Promise<{ success: boolean; remaining: number }> {
  const { data, error } = await supabase.rpc('appeal_unban', { p_answers: answers });
  if (error) throw error;
  return data as { success: boolean; remaining: number };
}

export async function getPublicProfile(userId: string): Promise<PublicProfile | null> {
  const { data, error } = await supabase.rpc('get_public_profile', { p_user_id: userId });
  if (error) throw error;
  return (data as PublicProfile) || null;
}

export async function getRiskReport(): Promise<RiskItem[]> {
  const { data, error } = await supabase.rpc('get_risk_report');
  if (error) throw error;
  return Array.isArray(data) ? (data as RiskItem[]) : [];
}

export async function setPrivacy(userId: string, isPrivate: boolean): Promise<void> {
  const { error } = await supabase.from('profiles').update({ is_private: isPrivate }).eq('id', userId);
  if (error) throw error;
}

export async function banUserWithReason(userId: string, reason: string): Promise<void> {
  const { error } = await supabase.rpc('ban_user', { p_user_id: userId, p_reason: reason });
  if (error) throw error;
}

// ===== 兴趣画像 =====
export async function setInterest(userId: string, interest: 'flight' | 'explore' | 'both'): Promise<void> {
  const { error } = await supabase.from('profiles').update({ interest }).eq('id', userId);
  if (error) throw error;
}

// ===== 限时活动（云端防重复） =====
export async function claimEventReward(eventId: string, balance: number, xp: number): Promise<{ success: boolean; reason?: string }> {
  const { data, error } = await supabase.rpc('claim_event_reward_atomic', { p_event_id: eventId, p_balance: balance, p_xp: xp });
  if (error) throw error;
  return data as { success: boolean; reason?: string };
}

export async function getClaimedEvents(): Promise<string[]> {
  const { data, error } = await supabase.rpc('get_claimed_events');
  if (error) throw error;
  return Array.isArray(data) ? (data as string[]) : [];
}

// ===== 管理员查看用户详情（不可屏蔽） =====
export async function getAdminUserDetail(userId: string): Promise<AdminUserDetail | null> {
  const { data, error } = await supabase.rpc('get_admin_user_detail', { p_user_id: userId });
  if (error) throw error;
  return (data as AdminUserDetail) || null;
}

// ===== 在线心跳 =====
export async function touchPresence(): Promise<void> {
  await supabase.rpc('touch_presence');
}
