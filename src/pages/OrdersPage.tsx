import { useMemo } from 'react';
import { useGameStore } from '@/hooks/useGameStore';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { HudPanel, EmptyState } from '@/components/common/Hud';
import { fmtPrice, fmtLY } from '@/data/pricing';
import { useNavigate } from 'react-router-dom';
import { Rocket, Gauge, XCircle, Radio, Clock, MapPin } from 'lucide-react';
import type { OrderRow } from '@/types/types';

const STATUS_MAP: Record<OrderRow['status'], { label: string; color: string }> = {
  pending: { label: '待登船', color: 'text-yellow-400' },
  flying: { label: '航行中', color: 'text-laser' },
  done: { label: '已完成', color: 'text-green-400' },
  cancelled: { label: '已取消', color: 'text-red-400' },
};

function OrderCard({ order, store }: { order: OrderRow; store: ReturnType<typeof useGameStore> }) {
  const navigate = useNavigate();
  const status = STATUS_MAP[order.status];
  const depDate = new Date(order.departure_time);
  const arrDate = new Date(order.arrival_time);

  return (
    <HudPanel className="mb-3">
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-2xl">{order.icon || '🚀'}</span>
            <div className="min-w-0">
              <div className="text-sm font-bold text-foreground truncate">{order.plan_name}</div>
              <div className="text-[10px] text-muted-foreground font-mono-num">{order.order_number}</div>
            </div>
          </div>
          <span className={`text-xs font-bold ${status.color} shrink-0`}>{status.label}</span>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
          <MapPin className="w-3 h-3 shrink-0" />
          <span className="truncate">{order.origin}</span>
          <span className="text-laser">→</span>
          <span className="truncate text-foreground font-semibold">{order.destination}</span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="w-3 h-3" /> 出发 {depDate.toLocaleDateString('zh-CN')}
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="w-3 h-3" /> 抵达 {arrDate.toLocaleDateString('zh-CN')}
          </div>
          <div className="text-muted-foreground">舱位：{order.cabin}</div>
          <div className="text-laser font-bold font-mono-num">{fmtPrice(order.price)}</div>
        </div>

        <div className="flex gap-2 mt-3">
          {order.status === 'pending' && (
            <>
              <Button size="sm" className="flex-1 btn-mech bg-laser text-primary-foreground hover:bg-laser/90" onClick={() => { store.setActiveOrderId(order.id); navigate('/monitor'); }}>
                <Rocket className="w-3.5 h-3.5 mr-1" /> 登船启航
              </Button>
              <Button size="sm" variant="outline" className="btn-mech text-red-400 hover:text-red-300" onClick={() => store.cancelOrder(order.id)}>
                <XCircle className="w-3.5 h-3.5 mr-1" /> 取消
              </Button>
            </>
          )}
          {order.status === 'flying' && (
            <Button size="sm" className="flex-1 btn-mech bg-laser text-primary-foreground hover:bg-laser/90" onClick={() => { store.setActiveOrderId(order.id); navigate('/monitor'); }}>
              <Radio className="w-3.5 h-3.5 mr-1" /> 进入监控
            </Button>
          )}
          {order.status === 'done' && (
            <Button size="sm" variant="outline" className="flex-1 btn-mech" onClick={() => navigate('/logs')}>
              <Gauge className="w-3.5 h-3.5 mr-1" /> 查看明信片
            </Button>
          )}
        </div>
      </div>
    </HudPanel>
  );
}

export default function OrdersPage() {
  const store = useGameStore();
  const navigate = useNavigate();

  const groups = useMemo(() => {
    const g: Record<string, OrderRow[]> = { pending: [], flying: [], done: [], cancelled: [] };
    store.orders.forEach((o) => g[o.status]?.push(o));
    return g;
  }, [store.orders]);

  return (
    <div className="px-4 md:px-8 py-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Gauge className="w-5 h-5 text-laser" /> 我的订单
        </h1>
        <Button size="sm" className="btn-mech bg-laser text-primary-foreground hover:bg-laser/90" onClick={() => navigate('/route')}>
          <Rocket className="w-3.5 h-3.5 mr-1" /> 预订新航线
        </Button>
      </div>

      <Tabs defaultValue="pending">
        <TabsList className="grid grid-cols-4 mb-4 bg-muted/50">
          <TabsTrigger value="pending" className="btn-mech text-xs data-[state=active]:text-laser">待登船 ({groups.pending.length})</TabsTrigger>
          <TabsTrigger value="flying" className="btn-mech text-xs data-[state=active]:text-laser">航行中 ({groups.flying.length})</TabsTrigger>
          <TabsTrigger value="done" className="btn-mech text-xs data-[state=active]:text-laser">已完成 ({groups.done.length})</TabsTrigger>
          <TabsTrigger value="cancelled" className="btn-mech text-xs data-[state=active]:text-laser">已取消 ({groups.cancelled.length})</TabsTrigger>
        </TabsList>

        {(['pending', 'flying', 'done', 'cancelled'] as const).map((status) => (
          <TabsContent key={status} value={status}>
            {groups[status].length === 0 ? (
              <EmptyState icon="📭" title="暂无订单" desc="前往航线页面预订你的第一次星际航行" action={<Button className="btn-mech bg-laser text-primary-foreground" onClick={() => navigate('/route')}>搜索航线</Button>} />
            ) : (
              groups[status].map((o) => <OrderCard key={o.id} order={o} store={store} />)
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
