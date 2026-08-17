import { useMemo, useState, useEffect } from 'react';
import { useGameStore } from '@/hooks/useGameStore';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { HudPanel, EmptyState, AlertBar } from '@/components/common/Hud';
import ChallengeDetailDialog from '@/components/game/ChallengeDetailDialog';
import { Calendar, Gift, CheckCircle2, Circle, Zap, Swords, Clock, Award, AlertTriangle, Flame } from 'lucide-react';
import { toast } from 'sonner';
import type { DailyTaskRow, ChallengeDef } from '@/types/types';

function isToday(dateStr: string): boolean {
  return dateStr === new Date().toISOString().slice(0, 10);
}

function fmtCountdown(ms: number): string {
  if (ms <= 0) return '00:00';
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export default function TasksPage() {
  const store = useGameStore();
  const { profile } = useAuth();
  const { dailyTasks, doSignIn, claimTask, challengeDefs, activeChallenge, challengeHistory, acceptChallenge, settleChallenge } = store;
  const [now, setNow] = useState(Date.now());
  const [selected, setSelected] = useState<ChallengeDef | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [settling, setSettling] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const todayTasks = useMemo(() => dailyTasks.filter((t) => isToday(t.task_date)), [dailyTasks]);
  const completedCount = todayTasks.filter((t) => t.status === 'claimed').length;
  const canClaimCount = todayTasks.filter((t) => t.status === 'completed').length;
  const signedToday = profile?.last_sign_in_date ? isToday(profile.last_sign_in_date) : false;

  // 当前挑战进度
  const challengeProgress = useMemo(() => {
    if (!activeChallenge || !profile) return 0;
    const baseline = activeChallenge.baseline ?? 0;
    const current = activeChallenge.goal_type === 'flight' ? (profile.orders_completed ?? 0) : (profile.xp ?? 0);
    return Math.max(0, current - baseline);
  }, [activeChallenge, profile]);

  const expiresMs = activeChallenge?.expires_at ? new Date(activeChallenge.expires_at).getTime() - now : 0;
  const expired = activeChallenge && expiresMs <= 0;

  const handleAccept = async () => {
    if (!selected) return;
    const res = await acceptChallenge(selected.code);
    setDialogOpen(false);
    setSelected(null);
    if (res) setNow(Date.now());
  };

  const handleSettle = async () => {
    if (!activeChallenge?.id) return;
    setSettling(true);
    await settleChallenge(activeChallenge.id);
    setSettling(false);
    setNow(Date.now());
  };

  // 倒计时归零自动结算
  useEffect(() => {
    if (expired && activeChallenge?.id && !settling) {
      handleSettle();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expired]);

  const goalLabel = activeChallenge?.goal_type === 'flight'
    ? `完成 ${activeChallenge?.goal_target ?? 0} 次航行`
    : `获得 ${activeChallenge?.goal_target ?? 0} 经验值`;

  return (
    <div className="px-4 md:px-8 py-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Calendar className="w-5 h-5 text-laser" /> 每日任务
        </h1>
        <span className="text-xs text-muted-foreground font-mono-num">{new Date().toLocaleDateString('zh-CN')}</span>
      </div>

      {/* 签到 */}
      <HudPanel className="mb-4">
        <div className="p-4 flex items-center gap-4">
          <div className="w-14 h-14 border-2 border-laser bg-laser/10 flex items-center justify-center text-2xl shrink-0">
            {signedToday ? '✅' : '🎁'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-foreground">每日签到</div>
            <div className="text-[11px] text-muted-foreground">连续签到 {profile?.sign_in_streak || 0} 天 · 第7天双倍奖励</div>
          </div>
          <Button
            disabled={signedToday}
            onClick={() => doSignIn()}
            className="btn-mech bg-laser text-primary-foreground hover:bg-laser/90 disabled:opacity-50"
            size="sm"
          >
            {signedToday ? '已签到' : '签到'}
          </Button>
        </div>
      </HudPanel>

      {/* 任务进度 */}
      {canClaimCount > 0 && (
        <AlertBar tone="success">
          <CheckCircle2 className="w-4 h-4 inline mr-1" /> 有 {canClaimCount} 个任务可领取奖励！
        </AlertBar>
      )}

      {/* 任务列表 */}
      <HudPanel title={`今日任务 (${completedCount}/${todayTasks.length})`} className="mt-4">
        <div className="p-3 space-y-2">
          {todayTasks.length === 0 ? (
            <EmptyState icon="📅" title="今日任务生成中" desc="稍后刷新即可查看" />
          ) : (
            todayTasks.map((task) => <TaskCard key={task.id} task={task} onClaim={() => claimTask(task.id)} />)
          )}
        </div>
      </HudPanel>

      {/* ===== 星际挑战 ===== */}
      <HudPanel title="星际挑战" className="mt-4">
        <div className="p-3 space-y-3">
          {activeChallenge ? (
            <ActiveChallengeCard
              title={activeChallenge.title || ''}
              description={activeChallenge.description || ''}
              goalLabel={goalLabel || ''}
              progress={challengeProgress}
              target={activeChallenge.goal_target ?? 0}
              rewardXp={activeChallenge.reward_xp ?? 0}
              rewardBalance={activeChallenge.reward_balance ?? 0}
              penaltyXp={activeChallenge.penalty_xp ?? 0}
              penaltyBalance={activeChallenge.penalty_balance ?? 0}
              countdown={fmtCountdown(expiresMs)}
              expired={!!expired}
              settling={settling}
              onSettle={handleSettle}
            />
          ) : (
            <>
              <AlertBar tone="info">
                <Flame className="w-4 h-4 inline mr-1" /> 接受限时挑战，完成赢取丰厚奖励，未完成将受到惩罚。同一时间只能进行一个挑战。
              </AlertBar>
              <div className="space-y-2">
                {challengeDefs.length === 0 ? (
                  <EmptyState icon="⚔" title="暂无可用挑战" desc="稍后再来看看" />
                ) : (
                  challengeDefs.map((c) => (
                    <button
                      key={c.code}
                      onClick={() => { setSelected(c); setDialogOpen(true); }}
                      className="w-full text-left p-3 border border-border bg-muted/20 hover:border-laser hover:bg-muted/40 btn-mech transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-sm font-bold text-foreground flex items-center gap-1.5">
                          <Swords className="w-3.5 h-3.5 text-laser shrink-0" /> {c.title}
                        </span>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5 shrink-0"><Clock className="w-2.5 h-2.5" />{c.duration_minutes}分钟</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground mb-1.5">{c.description}</div>
                      <div className="flex items-center gap-3 text-[10px]">
                        <span className="text-green-400 flex items-center gap-0.5"><Award className="w-2.5 h-2.5" />+{c.reward_xp}XP</span>
                        <span className="text-red-400 flex items-center gap-0.5"><AlertTriangle className="w-2.5 h-2.5" />-{c.penalty_balance}信用点</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </>
          )}

          {/* 挑战历史 */}
          {challengeHistory.length > 0 && (
            <div className="pt-2 border-t border-border">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">挑战记录</div>
              <div className="space-y-1">
                {challengeHistory.slice(0, 5).map((h) => (
                  <div key={h.id} className="flex items-center justify-between text-[11px] py-1">
                    <span className="text-foreground truncate flex-1 min-w-0 mr-2">{h.title}</span>
                    <span className={h.status === 'completed' ? 'text-green-400' : 'text-red-400'}>
                      {h.status === 'completed' ? '✅ 完成' : '❌ 未达成'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </HudPanel>

      <AlertBar tone="info" >
        <Zap className="w-4 h-4 inline mr-1" /> 每日 0 点（服务端时间）生成 3 个随机任务，未领取的奖励将在次日重置。
      </AlertBar>

      <ChallengeDetailDialog challenge={selected} open={dialogOpen} onAccept={handleAccept} onCancel={() => { setDialogOpen(false); setSelected(null); }} />
    </div>
  );
}

function ActiveChallengeCard(props: {
  title: string; description: string; goalLabel: string; progress: number; target: number;
  rewardXp: number; rewardBalance: number; penaltyXp: number; penaltyBalance: number;
  countdown: string; expired: boolean; settling: boolean; onSettle: () => void;
}) {
  const pct = props.target > 0 ? Math.min(100, (props.progress / props.target) * 100) : 0;
  return (
    <div className="p-3 border border-laser bg-laser/5">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-sm font-bold text-foreground flex items-center gap-1.5"><Swords className="w-3.5 h-3.5 text-laser" /> {props.title}</span>
        <span className={`text-xs font-bold font-mono-num ${props.expired ? 'text-red-400' : 'text-laser'}`}>
          {props.expired ? '已超时' : `⏱ ${props.countdown}`}
        </span>
      </div>
      <div className="text-[11px] text-muted-foreground mb-2">{props.description}</div>
      <div className="flex items-center gap-2 text-[11px] mb-2">
        <div className="flex-1 h-2 bg-muted overflow-hidden">
          <div className="h-full bg-laser laser-line transition-all" style={{ width: `${pct}%` }} />
        </div>
        <span className="text-foreground font-mono-num shrink-0">{props.progress}/{props.target}</span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <div className="text-[10px] text-muted-foreground">
          <span className="text-green-400">奖励 +{props.rewardXp}XP/+{props.rewardBalance}</span>
          <span className="mx-1">·</span>
          <span className="text-red-400">惩罚 -{props.penaltyXp}XP/-{props.penaltyBalance}</span>
        </div>
        <Button size="sm" disabled={props.settling} onClick={props.onSettle} className="btn-mech bg-laser text-primary-foreground hover:bg-laser/90 shrink-0">
          {props.settling ? '结算中…' : props.expired ? '立即结算' : '提前结算'}
        </Button>
      </div>
    </div>
  );
}

function TaskCard({ task, onClaim }: { task: DailyTaskRow; onClaim: () => void }) {
  const pct = Math.min(100, (task.current_value / task.target_value) * 100);
  const isCompleted = task.status === 'completed';
  const isClaimed = task.status === 'claimed';

  return (
    <div className={`p-3 border-l-4 ${
      isClaimed ? 'border-green-500/50 bg-green-950/10 opacity-70' : isCompleted ? 'border-laser bg-laser/10' : 'border-border bg-muted/20'
    }`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-foreground flex items-center gap-1.5">
            {isClaimed ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> : isCompleted ? <Gift className="w-3.5 h-3.5 text-laser" /> : <Circle className="w-3.5 h-3.5 text-muted-foreground" />}
            {task.task_desc}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">
            奖励：+{task.reward_xp} XP · +{task.reward_balance} 信用点
          </div>
        </div>
        <Button
          size="sm"
          disabled={!isCompleted || isClaimed}
          onClick={onClaim}
          className="btn-mech bg-laser text-primary-foreground hover:bg-laser/90 disabled:opacity-40 shrink-0"
        >
          {isClaimed ? '已领取' : isCompleted ? '领取' : '进行中'}
        </Button>
      </div>
      <div className="flex items-center gap-2 text-[11px]">
        <div className="flex-1 h-1.5 bg-muted overflow-hidden">
          <div className="h-full bg-laser laser-line" style={{ width: `${pct}%` }} />
        </div>
        <span className="text-muted-foreground font-mono-num shrink-0">{task.current_value}/{task.target_value}</span>
      </div>
    </div>
  );
}
