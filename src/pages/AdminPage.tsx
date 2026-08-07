import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/db/supabase';
import { HudPanel, EmptyState } from '@/components/common/Hud';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Shield, Users, Gauge, Star, Radio, Ban, ShieldCheck } from 'lucide-react';
import { fmtPrice, fmtLY } from '@/data/pricing';
import { toast } from 'sonner';

interface AdminStats {
  user_count: number;
  order_count: number;
  total_ly: number;
  total_xp: number;
  flying_count: number;
}

interface AdminProfile {
  id: string;
  username: string;
  role: string;
  balance: number;
  xp: number;
  level: number;
  light_years: number;
  sign_in_streak: number;
  banned: boolean;
  created_at: string;
}

interface AdminOrder {
  id: string;
  user_id: string;
  username: string;
  plan_name: string;
  origin: string;
  destination: string;
  status: string;
  price: number;
  light_years: number;
  created_at: string;
}

const ORDER_STATUS: Record<string, { label: string; color: string }> = {
  pending: { label: '待登船', color: 'text-yellow-400' },
  flying: { label: '航行中', color: 'text-laser' },
  done: { label: '已完成', color: 'text-green-400' },
  cancelled: { label: '已取消', color: 'text-red-400' },
};

export default function AdminPage() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [profiles, setProfiles] = useState<AdminProfile[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [s, p, o] = await Promise.all([
        supabase.rpc('get_admin_stats'),
        supabase.rpc('get_all_profiles'),
        supabase.rpc('get_all_orders'),
      ]);
      if (s.error) throw s.error;
      if (p.error) throw p.error;
      if (o.error) throw o.error;
      setStats(s.data as AdminStats);
      setProfiles((p.data || []) as AdminProfile[]);
      setOrders((o.data || []) as AdminOrder[]);
    } catch (e: any) {
      const msg = e?.message || '加载管理数据失败';
      toast.error(msg.includes('无管理员权限') ? '无管理员权限' : '加载管理数据失败：' + msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (profile?.role !== 'admin') return;
    loadData();
  }, [profile, loadData]);

  const handleBanToggle = async (p: AdminProfile) => {
    setActioningId(p.id);
    try {
      const rpc = p.banned ? 'unban_user' : 'ban_user';
      const { error } = await supabase.rpc(rpc, { p_user_id: p.id });
      if (error) throw error;
      toast.success(p.banned ? `已解封 ${p.username}` : `已封禁 ${p.username}`);
      await loadData();
    } catch (e: any) {
      toast.error(e.message || '操作失败');
    } finally {
      setActioningId(null);
    }
  };

  if (profile?.role !== 'admin') {
    return (
      <div className="px-4 md:px-8 py-6 max-w-3xl mx-auto">
        <EmptyState icon="🔒" title="无访问权限" desc="此页面仅限管理员访问" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="px-4 md:px-8 py-6 max-w-4xl mx-auto">
        <div className="text-laser animate-pulse font-mono-num text-center py-20">加载管理数据中…</div>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-8 py-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-2 mb-5">
        <Shield className="w-6 h-6 text-laser" />
        <h1 className="text-xl font-bold text-foreground">管理控制台</h1>
        <span className="ml-auto text-[10px] text-laser border border-laser/50 px-2 py-0.5 font-mono-num">ADMIN</span>
        <Button variant="outline" size="sm" className="btn-mech" onClick={loadData}>刷新</Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <HudPanel>
          <div className="p-4 text-center">
            <Users className="w-5 h-5 text-laser mx-auto mb-2" />
            <div className="text-2xl font-bold text-foreground font-mono-num">{stats?.user_count ?? 0}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">注册航行员</div>
          </div>
        </HudPanel>
        <HudPanel>
          <div className="p-4 text-center">
            <Gauge className="w-5 h-5 text-laser mx-auto mb-2" />
            <div className="text-2xl font-bold text-foreground font-mono-num">{stats?.order_count ?? 0}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">总订单数</div>
          </div>
        </HudPanel>
        <HudPanel>
          <div className="p-4 text-center">
            <Star className="w-5 h-5 text-laser mx-auto mb-2" />
            <div className="text-2xl font-bold text-foreground font-mono-num">{fmtLY(stats?.total_ly ?? 0)}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">总光年</div>
          </div>
        </HudPanel>
        <HudPanel>
          <div className="p-4 text-center">
            <Radio className="w-5 h-5 text-laser mx-auto mb-2" />
            <div className="text-2xl font-bold text-foreground font-mono-num">{stats?.flying_count ?? 0}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">航行中</div>
          </div>
        </HudPanel>
      </div>

      <Tabs defaultValue="users">
        <TabsList className="grid grid-cols-2 mb-4 bg-muted/50">
          <TabsTrigger value="users" className="btn-mech text-xs data-[state=active]:text-laser">航行员列表</TabsTrigger>
          <TabsTrigger value="orders" className="btn-mech text-xs data-[state=active]:text-laser">全站订单</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <HudPanel>
            <div className="w-full max-w-full overflow-x-auto bg-card">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-3 py-2 text-left text-muted-foreground whitespace-nowrap">航行员</th>
                    <th className="px-3 py-2 text-left text-muted-foreground whitespace-nowrap">角色</th>
                    <th className="px-3 py-2 text-left text-muted-foreground whitespace-nowrap">状态</th>
                    <th className="px-3 py-2 text-right text-muted-foreground whitespace-nowrap">等级</th>
                    <th className="px-3 py-2 text-right text-muted-foreground whitespace-nowrap">余额</th>
                    <th className="px-3 py-2 text-right text-muted-foreground whitespace-nowrap">光年</th>
                    <th className="px-3 py-2 text-center text-muted-foreground whitespace-nowrap">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {profiles.length === 0 ? (
                    <tr><td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">暂无航行员数据</td></tr>
                  ) : profiles.map((p) => (
                    <tr key={p.id} className="border-b border-border/50">
                      <td className="px-3 py-2 text-foreground font-semibold whitespace-nowrap">{p.username}</td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className={p.role === 'admin' ? 'text-laser font-bold' : 'text-muted-foreground'}>{p.role === 'admin' ? '管理员' : '航行员'}</span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className={p.banned ? 'text-red-400 font-bold' : 'text-green-400 font-bold'}>
                          {p.banned ? '⛔ 已封禁' : '✅ 正常'}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right font-mono-num text-foreground whitespace-nowrap">Lv{p.level}</td>
                      <td className="px-3 py-2 text-right font-mono-num text-laser whitespace-nowrap">{fmtPrice(p.balance)}</td>
                      <td className="px-3 py-2 text-right font-mono-num text-foreground whitespace-nowrap">{fmtLY(p.light_years)}</td>
                      <td className="px-3 py-2 text-center whitespace-nowrap">
                        {p.role !== 'admin' && (
                          <Button
                            size="sm"
                            variant={p.banned ? 'outline' : 'default'}
                            disabled={actioningId === p.id}
                            onClick={() => handleBanToggle(p)}
                            className={`btn-mech text-xs ${p.banned ? 'text-green-400 hover:text-green-300' : 'bg-red-500/80 text-white hover:bg-red-500'}`}
                          >
                            {p.banned ? <ShieldCheck className="w-3 h-3 mr-1" /> : <Ban className="w-3 h-3 mr-1" />}
                            {p.banned ? '解封' : '封禁'}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </HudPanel>
        </TabsContent>

        <TabsContent value="orders">
          <HudPanel>
            <div className="w-full max-w-full overflow-x-auto bg-card">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-3 py-2 text-left text-muted-foreground whitespace-nowrap">航行员</th>
                    <th className="px-3 py-2 text-left text-muted-foreground whitespace-nowrap">航线</th>
                    <th className="px-3 py-2 text-left text-muted-foreground whitespace-nowrap">目的地</th>
                    <th className="px-3 py-2 text-left text-muted-foreground whitespace-nowrap">状态</th>
                    <th className="px-3 py-2 text-right text-muted-foreground whitespace-nowrap">价格</th>
                    <th className="px-3 py-2 text-right text-muted-foreground whitespace-nowrap">光年</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr><td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">暂无订单</td></tr>
                  ) : orders.map((o) => {
                    const st = ORDER_STATUS[o.status] || { label: o.status, color: 'text-muted-foreground' };
                    return (
                      <tr key={o.id} className="border-b border-border/50">
                        <td className="px-3 py-2 text-foreground whitespace-nowrap">{o.username || '—'}</td>
                        <td className="px-3 py-2 text-foreground font-semibold whitespace-nowrap">{o.plan_name}</td>
                        <td className="px-3 py-2 text-foreground whitespace-nowrap">{o.destination}</td>
                        <td className={`px-3 py-2 font-bold whitespace-nowrap ${st.color}`}>{st.label}</td>
                        <td className="px-3 py-2 text-right font-mono-num text-laser whitespace-nowrap">{fmtPrice(o.price)}</td>
                        <td className="px-3 py-2 text-right font-mono-num text-foreground whitespace-nowrap">{fmtLY(o.light_years)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </HudPanel>
        </TabsContent>
      </Tabs>
    </div>
  );
}