import { useState } from 'react';
import { useGameStore } from '@/hooks/useGameStore';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { HudPanel, AlertBar } from '@/components/common/Hud';
import RechargeDialog from '@/components/common/RechargeDialog';
import { fmtPrice, fmtLY } from '@/data/pricing';
import { Radio, Send, Zap, Bell, Wallet } from 'lucide-react';
import { toast } from 'sonner';

export default function CommPage() {
  const store = useGameStore();
  const { profile } = useAuth();
  const [rechargeOpen, setRechargeOpen] = useState(false);
  const [msg, setMsg] = useState('');

  const sendMessage = () => {
    if (!msg.trim()) { toast.error('请输入讯息内容'); return; }
    toast.success('📨 已加入量子中继队列', {
      description: `预估投递：约1,200,000年 · 编号 MSG-${Date.now().toString(36).toUpperCase()}`,
    });
    setMsg('');
  };

  const totalOrders = store.orders.length;
  const doneOrders = store.orders.filter((o) => o.status === 'done').length;

  return (
    <div className="px-4 md:px-8 py-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Radio className="w-5 h-5 text-laser animate-pulse" /> 通讯中心
        </h1>
        <Button size="sm" className="btn-mech bg-laser text-primary-foreground hover:bg-laser/90" onClick={() => setRechargeOpen(true)}>
          <Zap className="w-3.5 h-3.5 mr-1" /> 充值
        </Button>
      </div>

      {/* 钱包概览 */}
      <HudPanel title="钱包" className="mb-4">
        <div className="p-4 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">星际信用点</div>
            <div className="text-2xl font-bold text-laser font-mono-num text-glow">{fmtPrice(profile?.balance || 0)}</div>
          </div>
          <Wallet className="w-10 h-10 text-laser/50" />
        </div>
      </HudPanel>

      {/* 系统消息 */}
      <HudPanel title="系统消息" className="mb-4">
        <div className="p-3 space-y-2">
          <MsgItem icon="📡" title="量子中继站在线" desc="当前与地球主站通讯正常 · 延迟约 4.24 年" time="刚刚" />
          <MsgItem icon="🚀" title="航行统计" desc={`累计完成 ${doneOrders} 次航行 · 累计 ${fmtLY(profile?.light_years_traveled || 0)} 光年`} time="实时" />
          <MsgItem icon="🏆" title="成就进度" desc={`已解锁 ${profile?.achievements_count || 0} 个成就 · 当前 Lv.${profile?.level || 1}`} time="实时" />
          <MsgItem icon="📋" title="订单概览" desc={`共 ${totalOrders} 笔订单`} time="实时" />
        </div>
      </HudPanel>

      {/* 量子讯息发送 */}
      <HudPanel title="量子讯息投递" className="mb-4">
        <div className="p-4 space-y-3">
          <AlertBar tone="warning">⚠ 量子中继存在约 120 万年的传输延迟，请确保讯息内容可被后世理解。</AlertBar>
          <textarea
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            placeholder="输入文字讯息（延迟约120万年抵达）"
            className="w-full min-h-[80px] bg-background border border-border p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-laser btn-mech resize-none"
          />
          <Button className="w-full btn-mech bg-laser text-primary-foreground hover:bg-laser/90" onClick={sendMessage}>
            <Send className="w-4 h-4 mr-1.5" /> 投递至量子中继
          </Button>
        </div>
      </HudPanel>

      <RechargeDialog open={rechargeOpen} onOpenChange={setRechargeOpen} />
    </div>
  );
}

function MsgItem({ icon, title, desc, time }: { icon: string; title: string; desc: string; time: string }) {
  return (
    <div className="flex items-start gap-2 p-2 border-l-2 border-border hover:border-laser/50 transition-colors">
      <span className="text-lg">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-bold text-foreground">{title}</div>
        <div className="text-[11px] text-muted-foreground">{desc}</div>
      </div>
      <span className="text-[10px] text-muted-foreground shrink-0 flex items-center gap-0.5"><Bell className="w-2.5 h-2.5" />{time}</span>
    </div>
  );
}
