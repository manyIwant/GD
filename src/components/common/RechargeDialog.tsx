import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useGameStore } from '@/hooks/useGameStore';
import { fmtPrice } from '@/data/pricing';
import { toast } from 'sonner';
import { Zap, Wallet, Check } from 'lucide-react';

const PRESETS = [100000, 500000, 1000000, 5000000, 10000000, 50000000];

// 虚拟支付方式（还原现实体验·不侵权命名）
interface PayMethod {
  id: string;
  name: string;
  slogan: string;
  badge: string;
  color: string;
  icon: React.ReactNode;
}

const PAY_METHODS: PayMethod[] = [
  {
    id: 'weifu',
    name: '微付宝',
    slogan: '微付一下·即刻到账',
    badge: '推荐',
    color: '#07c160',
    icon: (
      <svg viewBox="0 0 24 24" className="w-7 h-7" fill="currentColor">
        <path d="M8.7 13.4c-.4.2-.8.3-1.2.3-.3 0-.6 0-.9-.1.2.9.7 1.7 1.4 2.3 1.5 1.4 3.9 1.6 5.7.5.3-.2.6-.1.7.2.1.3 0 .6-.2.7-2.1 1.3-4.9 1.1-6.7-.5-1.1-1-1.7-2.4-1.7-3.9-.6-.3-1.1-.8-1.4-1.4.4.2.9.3 1.4.3.7 0 1.4-.2 2-.6z"/>
        <path d="M20.5 11.8c0-3.9-3.5-7-7.8-7s-7.8 3.1-7.8 7c0 1.9.9 3.6 2.3 4.8-.2.6-.6 1.4-1.3 2.1-.2.2-.2.5 0 .7.1.1.2.1.4.1 1.4-.1 2.7-.6 3.6-1.2 1 .3 2 .4 3 .4 4.3 0 7.6-3.1 7.6-6.9z"/>
      </svg>
    ),
  },
  {
    id: 'zhixin',
    name: '支信',
    slogan: '信用生活·支信相伴',
    badge: '快捷',
    color: '#1677ff',
    icon: (
      <svg viewBox="0 0 24 24" className="w-7 h-7" fill="currentColor">
        <path d="M12 2C6.5 2 2 6 2 11c0 3 1.6 5.6 4.1 7.2-.2.8-.6 2-1.1 3-.1.3.1.6.4.5 1.6-.5 3-1.2 3.9-1.8 1 .3 2 .4 3 .4 5.5 0 9.7-4 9.7-9S17.5 2 12 2z"/>
        <path d="M8.5 13.5c-.8 0-1.5-.7-1.5-1.5s.7-1.5 1.5-1.5 1.5.7 1.5 1.5-.7 1.5-1.5 1.5z" fill="#fff"/>
        <path d="M12 13.5c-.8 0-1.5-.7-1.5-1.5s.7-1.5 1.5-1.5 1.5.7 1.5 1.5-.7 1.5-1.5 1.5z" fill="#fff"/>
        <path d="M15.5 13.5c-.8 0-1.5-.7-1.5-1.5s.7-1.5 1.5-1.5 1.5.7 1.5 1.5-.7 1.5-1.5 1.5z" fill="#fff"/>
      </svg>
    ),
  },
  {
    id: 'xingfu',
    name: '星付',
    slogan: '星际通用·一码通行',
    badge: '通用',
    color: '#7c3aed',
    icon: (
      <svg viewBox="0 0 24 24" className="w-7 h-7" fill="currentColor">
        <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8l-6.2 4.5 2.4-7.4L2 9.4h7.6z"/>
      </svg>
    ),
  },
  {
    id: 'yunshan',
    name: '云闪',
    slogan: '云端闪付·安全无忧',
    badge: '安全',
    color: '#e60012',
    icon: (
      <svg viewBox="0 0 24 24" className="w-7 h-7" fill="currentColor">
        <path d="M13 2L4 14h6l-1 8 9-12h-6z"/>
      </svg>
    ),
  },
];

export default function RechargeDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const store = useGameStore();
  const { profile } = store;
  const [amount, setAmount] = useState(1000000);
  const [method, setMethod] = useState('weifu');
  const [loading, setLoading] = useState(false);

  const handleRecharge = async () => {
    if (amount <= 0) { toast.error('请输入有效金额'); return; }
    setLoading(true);
    try {
      await store.recharge(amount);
      const m = PAY_METHODS.find((p) => p.id === method);
      toast.success(`${m?.name || '支付'}成功`, { description: `+${fmtPrice(amount)} 信用点已到账` });
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-md bg-card border-laser">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <Zap className="w-5 h-5 text-laser" /> 充值中心
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 border border-border bg-muted/30">
            <span className="text-xs text-muted-foreground flex items-center gap-1.5"><Wallet className="w-4 h-4" />当前余额</span>
            <span className="text-lg font-bold text-laser font-mono-num text-glow">{fmtPrice(profile?.balance || 0)}</span>
          </div>

          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">快速选择</div>
            <div className="grid grid-cols-3 gap-2">
              {PRESETS.map((v) => (
                <button
                  key={v}
                  onClick={() => setAmount(v)}
                  className={`py-2 text-xs border btn-mech transition-colors ${
                    amount === v ? 'neon-active text-laser' : 'border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {fmtPrice(v)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">自定义金额</div>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value) || 0)}
              className="bg-background border-border btn-mech font-mono-num"
            />
          </div>

          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">选择支付方式</div>
            <div className="grid grid-cols-2 gap-2">
              {PAY_METHODS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setMethod(p.id)}
                  className={`relative flex items-center gap-2 p-2.5 border btn-mech transition-colors text-left ${
                    method === p.id ? 'border-laser bg-laser/10' : 'border-border hover:bg-muted/50'
                  }`}
                >
                  {method === p.id && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-laser rounded-full flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 text-primary-foreground" />
                    </span>
                  )}
                  <span className="shrink-0" style={{ color: p.color }}>{p.icon}</span>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-foreground flex items-center gap-1">
                      {p.name}
                      <span className="text-[8px] px-1 py-px rounded" style={{ background: `${p.color}22`, color: p.color }}>{p.badge}</span>
                    </div>
                    <div className="text-[9px] text-muted-foreground truncate">{p.slogan}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="text-[10px] text-muted-foreground leading-relaxed border border-dashed border-border p-2">
            ⚠ 信用点为虚拟货币，仅用于本应用内购票与消费。充值后不可提现、不可转让。
          </div>
        </div>
        <DialogFooter>
          <Button className="w-full btn-mech bg-laser text-primary-foreground hover:bg-laser/90" disabled={loading} onClick={handleRecharge}>
            <Zap className="w-4 h-4 mr-1.5" /> {loading ? '支付处理中…' : `通过 ${PAY_METHODS.find((p) => p.id === method)?.name} 充值 ${fmtPrice(amount)}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
