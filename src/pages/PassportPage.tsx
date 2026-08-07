import { useAuth } from '@/contexts/AuthContext';
import { HudPanel, DataItem, LocationHero } from '@/components/common/Hud';
import { Button } from '@/components/ui/button';
import { fmtLY, fmtPrice } from '@/data/pricing';
import { getLevelByXp, getNextLevel } from '@/data/levels';
import { getShip } from '@/data/ships';
import { useNavigate } from 'react-router-dom';
import { Award, MapPin, Ship, Calendar } from 'lucide-react';

export default function PassportPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  if (!profile) return null;

  const level = getLevelByXp(profile.xp);
  const next = getNextLevel(profile.xp);
  const ship = getShip(profile.selected_ship);
  const joinDate = new Date(profile.created_at).toLocaleDateString('zh-CN');

  return (
    <div className="px-4 md:px-8 py-6 max-w-3xl mx-auto">
      <LocationHero bg="bg-earth" name="🛂 星际通行证" desc="INTERSTELLAR TRAVEL PASSPORT" />

      <HudPanel className="mt-4">
        <div className="p-5">
          {/* 主信息 */}
          <div className="flex items-center gap-4 mb-5">
            <div className="w-20 h-20 border-2 border-laser bg-laser/10 flex items-center justify-center text-4xl shrink-0">
              {level.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] text-muted-foreground uppercase tracking-[0.2em]">航行员</div>
              <div className="text-xl font-bold text-foreground">{profile.username}</div>
              <div className="text-xs text-laser mt-0.5">Lv.{level.level} · {level.name}</div>
            </div>
          </div>

          {/* 凭证号 */}
          <div className="bg-muted/40 border border-border p-3 mb-4">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">凭证编号</div>
            <div className="text-sm font-bold font-mono-num text-foreground">{profile.id.slice(0, 8).toUpperCase()}-ISC</div>
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-1">
              <Calendar className="w-3 h-3" /> 注册日期 {joinDate}
            </div>
          </div>

          {/* 数据网格 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
            <DataItem label="信用点" value={fmtPrice(profile.balance)} accent />
            <DataItem label="累计光年" value={fmtLY(profile.light_years_traveled)} />
            <DataItem label="完成航次" value={profile.orders_completed} />
            <DataItem label="成就" value={profile.achievements_count} />
          </div>

          {/* 飞船 */}
          <div className="flex items-center gap-3 p-3 border border-border bg-muted/20 mb-4">
            <span className="text-3xl">{ship.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] text-muted-foreground uppercase">当前飞船</div>
              <div className="text-sm font-bold text-foreground truncate">{ship.name}</div>
            </div>
            <Button size="sm" variant="outline" className="btn-mech" onClick={() => navigate('/ships')}>
              <Ship className="w-3.5 h-3.5 mr-1" /> 切换
            </Button>
          </div>

          {/* 等级权益 */}
          <div className="border-l-2 border-laser pl-3 py-1 mb-4">
            <div className="text-xs text-muted-foreground">当前等级权益</div>
            <div className="text-sm text-foreground">{level.perk}</div>
          </div>

          {next && (
            <div className="text-xs text-muted-foreground border border-dashed border-border p-3">
              <span className="text-laser">下一等级：</span>{next.name}（Lv.{next.level}）· 需 {next.minXp - profile.xp} XP · {next.perk}
            </div>
          )}

          <div className="flex gap-2 mt-5">
            <Button className="flex-1 btn-mech bg-laser text-primary-foreground hover:bg-laser/90" onClick={() => navigate('/level')}>
              <Award className="w-4 h-4 mr-1.5" /> 查看成就墙
            </Button>
            <Button variant="outline" className="flex-1 btn-mech" onClick={() => navigate('/leaderboard')}>
              <MapPin className="w-4 h-4 mr-1.5" /> 我的排名
            </Button>
          </div>
        </div>
      </HudPanel>
    </div>
  );
}
