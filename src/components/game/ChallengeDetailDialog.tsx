import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertBar } from '@/components/common/Hud';
import type { ChallengeDef } from '@/types/types';
import { Award, AlertTriangle, Clock, Swords } from 'lucide-react';

interface Props {
  challenge: ChallengeDef | null;
  open: boolean;
  onAccept: () => void;
  onCancel: () => void;
}

export default function ChallengeDetailDialog({ challenge, open, onAccept, onCancel }: Props) {
  if (!challenge) return null;
  const goalLabel = challenge.goal_type === 'flight'
    ? `完成 ${challenge.goal_target} 次航行`
    : `获得 ${challenge.goal_target} 经验值`;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-md bg-card border-laser">
        <DialogHeader>
          <DialogTitle className="text-laser flex items-center gap-2">
            <Swords className="w-5 h-5" /> {challenge.title}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground leading-relaxed text-pretty">{challenge.description}</p>

          <div className="flex items-center gap-2 text-xs text-foreground">
            <Clock className="w-3.5 h-3.5 text-laser shrink-0" />
            <span>目标：<b>{goalLabel}</b> · 限时 <b>{challenge.duration_minutes} 分钟</b></span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 border border-green-500/40 bg-green-950/20">
              <div className="text-[10px] text-green-400 flex items-center gap-1 mb-1"><Award className="w-3 h-3" />完成奖励</div>
              <div className="text-xs font-bold text-foreground font-mono-num">+{challenge.reward_xp} XP</div>
              <div className="text-xs font-bold text-green-400 font-mono-num">+{challenge.reward_balance} 信用点</div>
            </div>
            <div className="p-2 border border-red-500/40 bg-red-950/20">
              <div className="text-[10px] text-red-400 flex items-center gap-1 mb-1"><AlertTriangle className="w-3 h-3" />未完成惩罚</div>
              <div className="text-xs font-bold text-foreground font-mono-num">-{challenge.penalty_xp} XP</div>
              <div className="text-xs font-bold text-red-400 font-mono-num">-{challenge.penalty_balance} 信用点</div>
            </div>
          </div>

          <AlertBar tone="warning">⚠ 一旦接受挑战将无法中途放弃，倒计时结束后系统自动结算。</AlertBar>
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" className="btn-mech flex-1" onClick={onCancel}>再想想</Button>
          <Button className="btn-mech bg-laser text-primary-foreground hover:bg-laser/90 flex-1" onClick={onAccept}>
            <Swords className="w-4 h-4 mr-1" /> 接受挑战
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}