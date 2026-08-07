import { useMemo } from 'react';
import { useGameStore } from '@/hooks/useGameStore';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { HudPanel, EmptyState, AlertBar } from '@/components/common/Hud';
import { Calendar, Gift, CheckCircle2, Circle, Zap } from 'lucide-react';
import { toast } from 'sonner';
import type { DailyTaskRow } from '@/types/types';

function isToday(dateStr: string): boolean {
  return dateStr === new Date().toISOString().slice(0, 10);
}

export default function TasksPage() {
  const store = useGameStore();
  const { profile } = useAuth();
  const { dailyTasks, doSignIn, claimTask } = store;

  const todayTasks = useMemo(() => dailyTasks.filter((t) => isToday(t.task_date)), [dailyTasks]);
  const completedCount = todayTasks.filter((t) => t.status === 'claimed').length;
  const canClaimCount = todayTasks.filter((t) => t.status === 'completed').length;
  const signedToday = profile?.last_sign_in_date ? isToday(profile.last_sign_in_date) : false;

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

      <AlertBar tone="info" >
        <Zap className="w-4 h-4 inline mr-1" /> 每日 0 点（服务端时间）生成 3 个随机任务，未领取的奖励将在次日重置。
      </AlertBar>
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
