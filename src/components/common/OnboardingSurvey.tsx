import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { setInterest } from '@/services/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plane, Compass, Sparkles, Check } from 'lucide-react';
import { toast } from 'sonner';
import Starfield from '@/components/common/Starfield';

type Interest = 'flight' | 'explore' | 'both';

const OPTIONS: { key: Interest; title: string; desc: string; perks: string[]; icon: React.ReactNode }[] = [
  {
    key: 'flight',
    title: '星际航线',
    desc: '热衷于乘坐航班、穿梭星系',
    perks: ['信用点充值无上限', '每日任务偏向乘机'],
    icon: <Plane className="w-6 h-6 text-laser" />,
  },
  {
    key: 'explore',
    title: '深空探索',
    desc: '偏爱探索未知、收集奇遇',
    perks: ['专注探索奖励', '每日任务偏向探索'],
    icon: <Compass className="w-6 h-6 text-amber-400" />,
  },
  {
    key: 'both',
    title: '两者兼顾',
    desc: '航线与探索，我全都要',
    perks: ['均衡的体验', '标准信用点额度'],
    icon: <Sparkles className="w-6 h-6 text-purple-400" />,
  },
];

export default function OnboardingSurvey() {
  const { profile, refreshProfile } = useAuth();
  const [selected, setSelected] = useState<Interest | null>(null);
  const [saving, setSaving] = useState(false);
  const open = !!profile && !profile.interest && !profile.banned;

  const submit = async () => {
    if (!selected || !profile) return;
    setSaving(true);
    try {
      await setInterest(profile.id, selected);
      await refreshProfile();
      toast.success('已为你定制专属体验');
    } catch (e: any) {
      toast.error(e.message || '保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => { /* 不可关闭，必须选择 */ }}>
      <DialogContent
        className="max-w-[calc(100%-2rem)] md:max-w-lg bg-card border-laser overflow-hidden p-0"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <Starfield className="absolute inset-0 pointer-events-none opacity-20" density={80} />
        <div className="relative">
          <div className="h-0.5 laser-line" />
          <div className="p-6">
            <DialogHeader>
              <DialogTitle className="text-foreground flex items-center gap-2 text-lg">
                <Sparkles className="w-5 h-5 text-laser" /> 产品调研
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-1 text-pretty">
                欢迎来到星际客运！告诉我们你更感兴趣的方向，我们将为你定制专属的航行体验与每日任务。
              </p>
            </DialogHeader>

            <div className="space-y-2.5 mt-5">
              {OPTIONS.map((o) => {
                const active = selected === o.key;
                return (
                  <button
                    key={o.key}
                    type="button"
                    onClick={() => setSelected(o.key)}
                    className={`w-full text-left p-3.5 border transition-colors flex items-start gap-3 ${
                      active ? 'border-laser bg-laser/10 neon-active' : 'border-border hover:bg-muted/50'
                    }`}
                  >
                    <div className="w-10 h-10 flex items-center justify-center bg-muted border border-border shrink-0">
                      {o.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-foreground">{o.title}</span>
                        {active && <Check className="w-3.5 h-3.5 text-laser" />}
                      </div>
                      <div className="text-[11px] text-muted-foreground mb-1.5">{o.desc}</div>
                      <div className="flex flex-wrap gap-1">
                        {o.perks.map((p, i) => (
                          <span key={i} className="text-[10px] border border-border bg-muted/40 text-muted-foreground px-1.5 py-0.5">
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <Button
              className="w-full mt-5 btn-mech bg-laser text-primary-foreground hover:bg-laser/90 font-bold"
              disabled={!selected || saving}
              onClick={submit}
            >
              {saving ? '保存中…' : '确认选择'}
            </Button>
          </div>
          <div className="h-0.5 laser-line" />
        </div>
      </DialogContent>
    </Dialog>
  );
}