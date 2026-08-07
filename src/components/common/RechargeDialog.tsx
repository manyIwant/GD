import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useGameStore } from '@/hooks/useGameStore';
import { fmtPrice } from '@/data/pricing';
import { toast } from 'sonner';
import { Zap, CreditCard, Wallet } from 'lucide-react';

const PRESETS = [100000, 500000, 1000000, 5000000, 10000000];

export default function RechargeDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const store = useGameStore();
  const { profile } = store;
  const [amount, setAmount] = useState(1000000);
  const [loading, setLoading] = useState(false);

  const handleRecharge = async () => {
    if (amount <= 0) { toast.error('请输入有效金额'); return; }
    setLoading(true);
    try {
      await store.recharge(amount);
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

          <div className="text-[10px] text-muted-foreground leading-relaxed border border-dashed border-border p-2">
            ⚠ 信用点为虚拟货币，仅用于本应用内购票与消费。充值后不可提现、不可转让。
          </div>
        </div>
        <DialogFooter>
          <Button className="w-full btn-mech bg-laser text-primary-foreground hover:bg-laser/90" disabled={loading} onClick={handleRecharge}>
            <CreditCard className="w-4 h-4 mr-1.5" /> {loading ? '处理中…' : `确认充值 ${fmtPrice(amount)}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
