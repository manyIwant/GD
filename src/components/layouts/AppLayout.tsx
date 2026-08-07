import { NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu, Rocket, Gauge, LogOut, Zap, Trophy, Ship, BookOpen, MapPin, Radio, Award, Target, Shield } from 'lucide-react';
import { fmtPrice } from '@/data/pricing';

const NAV_ITEMS = [
  { to: '/', label: '首页', icon: Rocket },
  { to: '/route', label: '航线', icon: MapPin },
  { to: '/orders', label: '订单', icon: Gauge },
  { to: '/monitor', label: '监控', icon: Radio },
  { to: '/destinations', label: '目的地', icon: Target },
  { to: '/level', label: '等级成就', icon: Award },
  { to: '/tasks', label: '每日任务', icon: Target },
  { to: '/leaderboard', label: '排行榜', icon: Trophy },
  { to: '/ships', label: '飞船收藏', icon: Ship },
  { to: '/logs', label: '飞行日志', icon: BookOpen },
  { to: '/comm', label: '通讯', icon: Radio },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    setMobileOpen(false);
    navigate('/login');
  };

  const NavList = ({ onNavigate }: { onNavigate?: () => void }) => (
    <nav className="flex flex-col gap-0.5">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 text-sm border-l-2 transition-colors btn-mech ${
              isActive
                ? 'border-laser bg-laser/10 text-laser text-glow'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`
          }
        >
          <item.icon className="w-4 h-4 shrink-0" />
          <span>{item.label}</span>
        </NavLink>
      ))}
      {profile?.role === 'admin' && (
        <>
          <div className="px-3 pt-4 pb-1 text-[9px] text-muted-foreground/60 uppercase tracking-[0.2em]">管理</div>
          <NavLink
            to="/admin"
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 text-sm border-l-2 transition-colors btn-mech ${
                isActive
                  ? 'border-yellow-400 bg-yellow-400/10 text-yellow-400'
                  : 'border-transparent text-yellow-400/70 hover:text-yellow-400 hover:bg-muted/50'
              }`
            }
          >
            <Shield className="w-4 h-4 shrink-0" />
            <span>管理控制台</span>
          </NavLink>
        </>
      )}
    </nav>
  );

  return (
    <div className="flex min-h-screen w-full relative">
      {/* 桌面端侧边栏 */}
      <aside className="hidden md:flex flex-col w-60 shrink-0 border-r border-border bg-sidebar/80 backdrop-blur-sm sticky top-0 h-screen z-30">
        <div className="px-4 py-4 border-b border-border flex items-center gap-2">
          <div className="w-2 h-2 bg-laser laser-line" />
          <span className="font-bold text-foreground tracking-wider">高德星际</span>
          <span className="ml-auto text-[9px] text-muted-foreground font-mono-num">v2.0</span>
        </div>

        {/* 用户信息 */}
        <div className="px-4 py-3 border-b border-border">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">航行员</div>
          <div className="text-sm font-bold text-foreground truncate">{profile?.username || '未登录'}</div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-[10px] text-muted-foreground">余额</span>
            <span className="text-xs font-bold text-laser font-mono-num">{fmtPrice(profile?.balance || 0)}</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          <NavList />
        </div>

        <div className="p-3 border-t border-border">
          <Button variant="outline" size="sm" className="w-full btn-mech" onClick={handleSignOut}>
            <LogOut className="w-3.5 h-3.5 mr-1.5" /> 退出登录
          </Button>
        </div>
      </aside>

      {/* 主内容 */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* 移动端顶栏 */}
        <header className="md:hidden flex items-center justify-between px-3 py-2 border-b border-border bg-background/90 backdrop-blur-sm sticky top-0 z-30">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="btn-mech">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 bg-sidebar p-0">
              <SheetHeader className="px-4 py-4 border-b border-border">
                <SheetTitle className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-laser laser-line" />
                  <span>高德星际</span>
                </SheetTitle>
              </SheetHeader>
              <div className="px-4 py-3 border-b border-border">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">航行员</div>
                <div className="text-sm font-bold text-foreground truncate">{profile?.username || '未登录'}</div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[10px] text-muted-foreground">余额</span>
                  <span className="text-xs font-bold text-laser font-mono-num">{fmtPrice(profile?.balance || 0)}</span>
                </div>
              </div>
              <div className="py-2 overflow-y-auto" style={{ height: 'calc(100% - 180px)' }}>
                <NavList onNavigate={() => setMobileOpen(false)} />
              </div>
              <div className="p-3 border-t border-border absolute bottom-0 left-0 right-0">
                <Button variant="outline" size="sm" className="w-full btn-mech" onClick={handleSignOut}>
                  <LogOut className="w-3.5 h-3.5 mr-1.5" /> 退出登录
                </Button>
              </div>
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-laser laser-line" />
            <span className="font-bold text-sm tracking-wider">高德星际</span>
          </div>
          <Button asChild size="sm" className="btn-mech bg-laser text-primary-foreground hover:bg-laser/90">
            <a href="/GD/"><Zap className="w-3 h-3 mr-1" />充值</a>
          </Button>
        </header>

        <main className="flex-1 relative z-10">{children}</main>
      </div>
    </div>
  );
}
