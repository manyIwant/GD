import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/db/supabase';
import { HudPanel, AlertBar } from '@/components/common/Hud';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { CalendarClock, Flame, Gift, Rocket, Star } from 'lucide-react';

interface EventDef {
  id: string;
  title: string;
  icon: string;
  desc: string;
  rule: string;
  reward: string;
  rewardBalance: number;
  rewardXp: number;
  color: string;
  active: boolean;
  endsIn: string;
}

function getEvents(): EventDef[] {
  const now = new Date();
  const day = now.getDate();
  // 周期性轮换活动
  return [
    {
      id: 'double_xp',
      title: '双倍经验周',
      icon: '⚡',
      desc: '本周所有航行将获得双倍经验值！抓住机会快速升级。',
      rule: '完成任意一次航行即可触发双倍经验。',
      reward: '航行经验 ×2',
      rewardBalance: 0,
      rewardXp: 200,
      color: '#eab308',
      active: day % 7 < 3,
      endsIn: `${3 - (day % 7)} 天后结束`,
    },
    {
      id: 'deep_space',
      title: '深空探索节',
      icon: '🌌',
      desc: '前往比邻星以远的深空目的地，解锁专属成就与丰厚奖励。',
      rule: '完成一次前往比邻星/天狼星/仙女座的航行。',
      reward: '信用点 +2000',
      rewardBalance: 2000,
      rewardXp: 300,
      color: '#8b5cf6',
      active: true,
      endsIn: '本月内有效',
    },
    {
      id: 'newcomer',
      title: '新航行者礼包',
      icon: '🎁',
      desc: '专为初次踏上星海的旅行者准备的启航礼包。',
      rule: '完成你的第一次航行即可领取。',
      reward: '信用点 +500',
      rewardBalance: 500,
      rewardXp: 100,
      color: '#22c55e',
      active: true,
      endsIn: '永久有效',
    },
    {
      id: 'spin_bonus',
      title: '幸运转盘狂欢',
      icon: '🎲',
      desc: '活动期间，每次转盘抽奖额外赠送 50 信用点！',
      rule: '参与任意一次转盘抽奖。',
      reward: '信用点 +50（抽奖额外）',
      rewardBalance: 50,
      rewardXp: 0,
      color: '#ef4444',
      active: day % 5 < 2,
      endsIn: `${2 - (day % 5)} 天后结束`,
    },
  ];
}

export default function EventsPage() {
  const { profile, refreshProfile } = useAuth();
  const events = useMemo(getEvents, []);
  const claimed = useMemo(() => {
    // 简单本地标记已领取（活动奖励为一次性）
    try {
      return new Set(JSON.parse(localStorage.getItem('claimed_events') || '[]'));
    } catch {
      return new Set<string>();
    }
  }, []);

  const handleClaim = async (ev: EventDef) => {
    if (claimed.has(ev.id)) {
      toast.info('该活动奖励已领取');
      return;
    }
    try {
      const { error } = await supabase.rpc('claim_event_reward', {
        p_balance: ev.rewardBalance,
        p_xp: ev.rewardXp,
      });
      if (error) throw error;
      const next = new Set(claimed);
      next.add(ev.id);
      localStorage.setItem('claimed_events', JSON.stringify([...next]));
      toast.success(`🎉 已领取：${ev.reward}`);
      await refreshProfile();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '领取失败';
      toast.error(msg);
    }
  };

  return (
    <div className="px-4 md:px-8 py-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <CalendarClock className="w-5 h-5 text-laser" /> 限时活动
        </h1>
        <span className="text-xs text-muted-foreground">活动定期轮换，及时参与</span>
      </div>

      <AlertBar tone="info" className="mb-6">
        <Flame className="w-4 h-4 inline mr-1" /> 完成活动任务即可领取丰厚奖励，部分活动限时开放，错过需等待下一轮！
      </AlertBar>

      <div className="space-y-4">
        {events.map((ev) => (
          <HudPanel key={ev.id}>
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div
                  className="w-14 h-14 border-2 flex items-center justify-center text-3xl shrink-0"
                  style={{ borderColor: ev.color, background: `${ev.color}15` }}
                >
                  {ev.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-foreground">{ev.title}</span>
                    <span
                      className="text-[10px] px-2 py-0.5 border"
                      style={{ color: ev.color, borderColor: `${ev.color}66` }}
                    >
                      {ev.active ? `进行中 · ${ev.endsIn}` : '未开启'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 text-pretty">{ev.desc}</p>
                  <div className="flex items-center gap-1 mt-2 text-[11px] text-muted-foreground">
                    <Star className="w-3 h-3" /> 规则：{ev.rule}
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-[11px]" style={{ color: ev.color }}>
                    <Gift className="w-3 h-3" /> 奖励：{ev.reward}
                  </div>
                </div>
                <div className="shrink-0">
                  <Button
                    size="sm"
                    disabled={!ev.active || claimed.has(ev.id)}
                    onClick={() => handleClaim(ev)}
                    className="btn-mech bg-laser text-primary-foreground hover:bg-laser/90 disabled:opacity-40"
                  >
                    {claimed.has(ev.id) ? '已领取' : '领取'}
                  </Button>
                </div>
              </div>
            </div>
          </HudPanel>
        ))}
      </div>

      <div className="mt-6 p-4 border border-border bg-muted/10 flex items-center gap-2">
        <Rocket className="w-4 h-4 text-laser shrink-0" />
        <span className="text-xs text-muted-foreground text-pretty">提示：活动奖励为一次性领取，请确保满足领取条件后再点击领取。双倍经验周期间，航行完成将自动获得双倍经验。</span>
      </div>
    </div>
  );
}