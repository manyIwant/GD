// ===== 游戏状态管理 Hook =====
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import * as api from '@/services/api';
import type { OrderRow, AchievementRow, DailyTaskRow, FlightLogRow, UnlockedShipRow } from '@/types/types';
import { getShip } from '@/data/ships';
import { getPlan } from '@/data/plans';
import { calcPrice, getLightYears } from '@/data/pricing';
import { isTrisolarisRoute } from '@/data/eras';
import { toast } from 'sonner';

export function useGameStore() {
  const { user, profile, refreshProfile } = useAuth();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [achievements, setAchievements] = useState<AchievementRow[]>([]);
  const [dailyTasks, setDailyTasks] = useState<DailyTaskRow[]>([]);
  const [flightLogs, setFlightLogs] = useState<FlightLogRow[]>([]);
  const [unlockedShips, setUnlockedShips] = useState<UnlockedShipRow[]>([]);
  const [loading, setLoading] = useState(false);

  // 当前订单（监控用）
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);

  // 全量加载
  const loadAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [o, a, t, l, s] = await Promise.all([
        api.fetchOrders(user.id),
        api.fetchAchievements(user.id),
        api.fetchDailyTasks(user.id),
        api.fetchFlightLogs(user.id),
        api.fetchUnlockedShips(user.id),
      ]);
      setOrders(o);
      setAchievements(a);
      setDailyTasks(t);
      setFlightLogs(l);
      setUnlockedShips(s);
      const flying = o.find((x) => x.status === 'flying');
      if (flying) setActiveOrderId(flying.id);
    } catch (e) {
      console.error('加载数据失败', e);
      toast.error('数据加载失败');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) loadAll();
    else {
      setOrders([]); setAchievements([]); setDailyTasks([]); setFlightLogs([]); setUnlockedShips([]);
    }
  }, [user, loadAll]);

  // 下单
  const placeOrder = useCallback(async (params: {
    origin: string;
    destination: string;
    transits: string[];
    planKey: string;
    waypoints: OrderRow['waypoints'];
  }) => {
    if (!user || !profile) return null;
    const plan = getPlan(params.planKey);
    const shipDef = getShip(profile.selected_ship);
    const shipDiscount = shipDef.buffType === 'discount' ? shipDef.buffValue : 0;
    const price = calcPrice(params.planKey, params.destination, shipDiscount);
    if (profile.balance < price) {
      toast.error('信用点不足，请充值', { description: `需要 ${price.toLocaleString()}，余额 ${profile.balance.toLocaleString()}` });
      return null;
    }
    const now = Date.now();
    const shipSpeedMult = shipDef.buffType === 'speed' ? shipDef.buffValue : 1;
    const durationDays = Math.max(30, Math.round((plan.d || 120) / shipSpeedMult));
    const ly = getLightYears(params.destination);

    const newOrder = await api.createOrder({
      user_id: user.id,
      origin: params.origin,
      destination: params.destination,
      plan_code: params.planKey,
      plan_name: plan.n,
      icon: plan.i,
      cabin: plan.c,
      price,
      status: 'pending',
      departure_time: new Date(now + 17 * 86400000).toISOString(),
      arrival_time: new Date(now + (17 + durationDays) * 86400000).toISOString(),
      waypoints: params.waypoints,
      rad: 'Lv4',
      ticket_number: 'ISPT-' + Math.random().toString(36).slice(2, 10).toUpperCase(),
      purchases: [],
      ship_code: profile.selected_ship,
      light_years: ly,
    });
    if (!newOrder) return null;

    // 扣余额、任务进度
    await api.updateBalance(user.id, -price);
    await api.incTaskProgress(user.id, 'book_flight', 1);
    if (params.destination.includes('火星')) await api.incTaskProgress(user.id, 'book_mars', 1);

    // 首单成就
    await api.unlockAchievement('firstOrder');
    await refreshProfile();
    await loadAll();
    toast.success('🎉 订单创建成功', { description: `${params.origin} → ${params.destination}` });
    return newOrder;
  }, [user, profile, refreshProfile, loadAll]);

  // 登船
  const boardOrder = useCallback(async (orderId: string) => {
    await api.updateOrderStatus(orderId, 'flying');
    setActiveOrderId(orderId);
    await loadAll();
    toast.success('🚀 已登船，航行开始');
  }, [loadAll]);

  // 取消订单
  const cancelOrder = useCallback(async (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order || !user) return;
    await api.deleteOrder(orderId);
    await api.updateBalance(user.id, Math.round(order.price * 0.7)); // 退还70%
    if (activeOrderId === orderId) setActiveOrderId(null);
    await refreshProfile();
    await loadAll();
    toast.success('订单已取消，退还70%信用点');
  }, [orders, user, activeOrderId, refreshProfile, loadAll]);

  // 完成订单（抵达目的地）
  const completeFlight = useCallback(async (orderId: string) => {
    if (!user) return;
    try {
      const result = await api.completeOrder(orderId);
      const order = orders.find((o) => o.id === orderId);
      if (order) {
        // 解锁成就
        const achCodes = [
          ...(order.destination.includes('月球') ? ['moonTrip'] : []),
          ...(order.destination.includes('火星') ? ['marsTrip'] : []),
          ...(order.destination.includes('翁法罗斯') ? ['omphalos'] : []),
          ...(order.destination.includes('比邻星') || order.destination.includes('三体') ? ['trisolaris'] : []),
          ...(order.destination.includes('B612') || order.destination.includes('小王子') ? ['b612'] : []),
          ...(order.destination.includes('仙女座') ? ['andromeda'] : []),
        ];
        for (const code of achCodes) await api.unlockAchievement(code);
      }
      if (activeOrderId === orderId) setActiveOrderId(null);
      await refreshProfile();
      await loadAll();
      if (result) {
        toast.success('🎉 已抵达目的地！', {
          description: `+${result.xp_gain} XP · ${result.light_years?.toFixed(2) || 0} 光年`,
        });
      }
      return result;
    } catch (e) {
      console.error(e);
      toast.error('完成航行失败');
    }
  }, [user, orders, activeOrderId, refreshProfile, loadAll]);

  // 每日签到
  const doSignIn = useCallback(async () => {
    try {
      const result = await api.dailySignIn();
      await refreshProfile();
      await loadAll();
      toast.success('✅ 签到成功', { description: `+${result.reward} 信用点 · 连续${result.streak}天` });
      return result;
    } catch (e: any) {
      toast.error(e.message?.includes('已签到') ? '今日已签到' : '签到失败');
      return null;
    }
  }, [refreshProfile, loadAll]);

  // 领取任务奖励
  const claimTask = useCallback(async (taskId: string) => {
    try {
      const result = await api.claimDailyTask(taskId);
      await refreshProfile();
      await loadAll();
      toast.success('🎁 任务奖励已领取', { description: `+${result.xp} XP · +${result.balance} 信用点` });
      return result;
    } catch (e: any) {
      toast.error(e.message || '领取失败');
      return null;
    }
  }, [refreshProfile, loadAll]);

  // 充值
  const recharge = useCallback(async (amount: number) => {
    if (!user) return;
    await api.recharge(user.id, amount);
    await refreshProfile();
    await loadAll();
    toast.success('⚡ 充值成功', { description: `+${amount.toLocaleString()} 信用点` });
  }, [user, refreshProfile, loadAll]);

  // 增加经验（宇宙事件奖励）
  const addXp = useCallback(async (amount: number) => {
    if (!user) return;
    await api.addXp(user.id, amount);
    await refreshProfile();
  }, [user, refreshProfile]);

  // 扣除信用点（事件惩罚）
  const deductBalance = useCallback(async (amount: number) => {
    if (!user) return;
    await api.deductBalance(user.id, amount);
    await refreshProfile();
    await loadAll();
  }, [user, refreshProfile, loadAll]);

  // 保存个人飞船配置
  const saveShipConfig = useCallback(async (config: Record<string, string>) => {
    if (!user) return;
    await api.saveShipConfig(user.id, config);
    await refreshProfile();
  }, [user, refreshProfile]);

  // 添加纪念品
  const addMemento = useCallback(async (name: string, desc: string, emoji: string) => {
    if (!user) return;
    await api.addMemento(user.id, name, desc, emoji);
    await refreshProfile();
  }, [user, refreshProfile]);

  // 解锁探索成就
  const unlockExploreAchievement = useCallback(async (name: string) => {
    if (!user) return;
    await api.unlockExploreAchievement(user.id, name);
    await refreshProfile();
  }, [user, refreshProfile]);

  // 选择飞船
  const selectShip = useCallback(async (code: string) => {
    if (!user) return;
    await api.selectShip(user.id, code);
    await refreshProfile();
    toast.success(`飞船已切换：${getShip(code).name}`);
  }, [user, refreshProfile]);

  // 解锁飞船（升级时调用）
  const unlockShipByCode = useCallback(async (code: string) => {
    await api.unlockShip(code);
    await loadAll();
  }, [loadAll]);

  // 任务进度推进（浏览目的地等）
  const incProgress = useCallback(async (taskCode: string, increment: number = 1) => {
    if (!user) return;
    await api.incTaskProgress(user.id, taskCode, increment);
    await loadAll();
  }, [user, loadAll]);

  // 三体航线检测
  const checkTrisolaris = useCallback((origin: string, transits: string[], dest: string) => {
    return isTrisolarisRoute(origin, transits, dest);
  }, []);

  return {
    user, profile, orders, achievements, dailyTasks, flightLogs, unlockedShips,
    loading, activeOrderId, setActiveOrderId,
    loadAll, placeOrder, boardOrder, cancelOrder, completeFlight,
    doSignIn, claimTask, recharge, addXp, deductBalance, saveShipConfig, addMemento, unlockExploreAchievement, selectShip, unlockShipByCode, incProgress, checkTrisolaris,
  };
}

export type GameStore = ReturnType<typeof useGameStore>;
