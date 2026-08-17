import { useState } from 'react';
import { useGameStore } from '@/hooks/useGameStore';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { HudPanel, AlertBar } from '@/components/common/Hud';
import DriftBottleDialog from '@/components/game/DriftBottleDialog';
import { fmtPrice, fmtLY } from '@/data/pricing';
import { Radio, Send, Zap, Bell, Wallet, Waves, Heart, Inbox, Ship } from 'lucide-react';
import { toast } from 'sonner';
import type { DriftBottle } from '@/types/types';

function fmtTime(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
  return d.toLocaleDateString('zh-CN');
}

export default function CommPage() {
  const store = useGameStore();
  const { profile } = useAuth();
  const { inboxBottles, myBottles, sendBottle, replyBottle, likeBottle, loadBottles } = store;
  const [tab, setTab] = useState<'inbox' | 'sent'>('inbox');
  const [msg, setMsg] = useState('');
  const [selectedBottle, setSelectedBottle] = useState<DriftBottle | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const sendMessage = async () => {
    if (!msg.trim()) { toast.error('请输入讯息内容'); return; }
    const ok = await sendBottle(msg.trim());
    if (ok) setMsg('');
  };

  const openBottle = (b: DriftBottle) => {
    setSelectedBottle(b);
    setDialogOpen(true);
  };

  const doneOrders = store.orders.filter((o) => o.status === 'done').length;
  const list = tab === 'inbox' ? inboxBottles : myBottles;

  return (
    <div className="px-4 md:px-8 py-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Radio className="w-5 h-5 text-laser animate-pulse" /> 通讯中心
        </h1>
        <span className="text-xs text-muted-foreground">漂流瓶 · 星际讯息</span>
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
        </div>
      </HudPanel>

      {/* 投放漂流瓶 */}
      <HudPanel title="投放漂流瓶" className="mb-4">
        <div className="p-4 space-y-3">
          <AlertBar tone="info">
            <Waves className="w-4 h-4 inline mr-1" /> 将你的讯息封入漂流瓶投入星海，它可能在亿万光年外被某位航行员拾起，并收到对方的回应。
          </AlertBar>
          <textarea
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            placeholder="写下你想对宇宙说的话…（最多 500 字）"
            maxLength={500}
            className="w-full min-h-[80px] bg-background border border-border p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-laser btn-mech resize-none"
          />
          <Button className="w-full btn-mech bg-laser text-primary-foreground hover:bg-laser/90" onClick={sendMessage}>
            <Send className="w-4 h-4 mr-1.5" /> 投入星海
          </Button>
        </div>
      </HudPanel>

      {/* 漂流瓶收发 */}
      <HudPanel className="mb-4">
        <div className="p-3">
          <div className="grid grid-cols-2 gap-1.5 mb-3">
            <button onClick={() => setTab('inbox')} className={`py-2 text-xs border btn-mech transition-colors ${tab === 'inbox' ? 'neon-active text-laser bg-laser/10 border-laser' : 'border-border text-muted-foreground hover:text-foreground'}`}>
              <Inbox className="w-3.5 h-3.5 inline mr-1" /> 收到的漂流瓶
            </button>
            <button onClick={() => setTab('sent')} className={`py-2 text-xs border btn-mech transition-colors ${tab === 'sent' ? 'neon-active text-laser bg-laser/10 border-laser' : 'border-border text-muted-foreground hover:text-foreground'}`}>
              <Ship className="w-3.5 h-3.5 inline mr-1" /> 我发出的
            </button>
          </div>

          {list.length === 0 ? (
            <div className="py-8 text-center">
              <Waves className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
              <div className="text-xs text-muted-foreground">
                {tab === 'inbox' ? '星海一片寂静，暂未拾起漂流瓶' : '你还没有投放过漂流瓶'}
              </div>
              {tab === 'inbox' && (
                <Button size="sm" variant="outline" className="btn-mech mt-3" onClick={() => loadBottles()}>
                  再次搜寻星海
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {list.map((b) => (
                <button
                  key={b.id}
                  onClick={() => openBottle(b)}
                  className="w-full text-left p-3 border border-border bg-muted/20 hover:border-laser hover:bg-muted/40 btn-mech transition-colors"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-bold text-foreground truncate flex-1 min-w-0">
                      {b.sender_username || '匿名航行员'}
                    </span>
                    <span className="text-[10px] text-muted-foreground shrink-0 flex items-center gap-1">
                      <Heart className="w-2.5 h-2.5" /> {b.likes}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-2 break-words text-pretty">{b.content}</p>
                  <div className="text-[10px] text-muted-foreground/70 mt-1">{fmtTime(b.created_at)}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </HudPanel>

      <DriftBottleDialog
        bottle={selectedBottle}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onReply={replyBottle}
        onLike={likeBottle}
      />
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