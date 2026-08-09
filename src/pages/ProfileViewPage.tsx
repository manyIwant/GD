import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPublicProfile } from '@/services/api';
import { getShip } from '@/data/ships';
import { fmtPrice, fmtLY } from '@/data/pricing';
import { ACHIEVEMENTS } from '@/data/achievements';
import type { PublicProfile, PublicOrderItem, PublicAchievementItem } from '@/types/types';
import { HudPanel } from '@/components/common/Hud';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Lock, Rocket, Star, Award, Zap, Flame, Circle, Plane, Compass, Sparkles } from 'lucide-react';
import Starfield from '@/components/common/Starfield';

const INTEREST_LABEL: Record<string, string> = { flight: '星际航线', explore: '深空探索', both: '两者兼顾' };
const INTEREST_ICON: Record<string, React.ReactNode> = {
  flight: <Plane className="w-3 h-3" />,
  explore: <Compass className="w-3 h-3" />,
  both: <Sparkles className="w-3 h-3" />,
};

export default function ProfileViewPage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    getPublicProfile(userId)
      .then(setProfile)
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return (
      <div className="px-4 md:px-8 py-6 max-w-2xl mx-auto">
        <div className="text-laser animate-pulse font-mono-num text-center py-20">解析航行员档案…</div>
      </div>
    );
  }

  if (!profile || !profile.found) {
    return (
      <div className="px-4 md:px-8 py-6 max-w-2xl mx-auto text-center">
        <div className="text-muted-foreground py-20">未找到该航行员档案</div>
        <Button variant="outline" className="btn-mech" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-1" /> 返回
        </Button>
      </div>
    );
  }

  const ship = getShip(profile.selected_ship || 'cnsa');

  return (
    <div className="px-4 md:px-8 py-6 max-w-2xl mx-auto">
      <Button variant="ghost" size="sm" className="mb-4 text-muted-foreground hover:text-foreground"
        onClick={() => navigate(-1)}>
        <ArrowLeft className="w-4 h-4 mr-1" /> 返回
      </Button>

      <div className="relative overflow-hidden">
        <Starfield className="absolute inset-0 pointer-events-none opacity-30" density={60} />
        <div className="relative bg-card/90 backdrop-blur-sm border border-border p-6">
          <div className="h-0.5 laser-line mb-5" />

          {/* 头部 */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full border-2 border-laser/60 flex items-center justify-center bg-laser/10 text-2xl shrink-0"
              style={{ boxShadow: '0 0 20px rgba(0,220,255,0.2)' }}>
              {profile.username?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <div className="text-lg font-bold text-foreground truncate">{profile.username || '匿名航行员'}</div>
                {profile.online ? (
                  <span className="flex items-center gap-1 text-[10px] text-green-400 shrink-0">
                    <Circle className="w-2 h-2 fill-green-400 text-green-400" /> 在线
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground shrink-0">
                    <Circle className="w-2 h-2 fill-muted-foreground/40 text-muted-foreground/40" /> 离线
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-laser font-mono-num">Lv.{profile.level}</span>
                {profile.interest && (
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground border border-border px-1.5 py-0.5">
                    {INTEREST_ICON[profile.interest]}{INTEREST_LABEL[profile.interest]}
                  </span>
                )}
              </div>
            </div>
            {profile.is_private && (
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground border border-border px-2 py-1 shrink-0">
                <Lock className="w-3 h-3" /> 已设为私密
              </div>
            )}
          </div>

          {profile.is_private ? (
            <div className="text-center py-8">
              <Lock className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <div className="text-sm text-muted-foreground">该航行员已开启隐私保护</div>
              <div className="text-[11px] text-muted-foreground/60 mt-1">仅展示基础信息</div>
            </div>
          ) : (
            <>
              {/* 数据网格 */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
                <HudPanel>
                  <div className="p-3 text-center">
                    <Rocket className="w-4 h-4 text-laser mx-auto mb-1" />
                    <div className="text-base font-bold text-foreground font-mono-num">{fmtLY(profile.light_years_traveled ?? 0)}</div>
                    <div className="text-[9px] text-muted-foreground uppercase">累计光年</div>
                  </div>
                </HudPanel>
                <HudPanel>
                  <div className="p-3 text-center">
                    <Star className="w-4 h-4 text-laser mx-auto mb-1" />
                    <div className="text-base font-bold text-foreground font-mono-num">{profile.orders_completed ?? 0}</div>
                    <div className="text-[9px] text-muted-foreground uppercase">完成航次</div>
                  </div>
                </HudPanel>
                <HudPanel>
                  <div className="p-3 text-center">
                    <Award className="w-4 h-4 text-laser mx-auto mb-1" />
                    <div className="text-base font-bold text-foreground font-mono-num">{profile.achievements_count ?? 0}</div>
                    <div className="text-[9px] text-muted-foreground uppercase">成就数</div>
                  </div>
                </HudPanel>
                <HudPanel>
                  <div className="p-3 text-center">
                    <Zap className="w-4 h-4 text-laser mx-auto mb-1" />
                    <div className="text-base font-bold text-foreground font-mono-num">{profile.xp ?? 0}</div>
                    <div className="text-[9px] text-muted-foreground uppercase">经验值</div>
                  </div>
                </HudPanel>
                <HudPanel>
                  <div className="p-3 text-center">
                    <Flame className="w-4 h-4 text-laser mx-auto mb-1" />
                    <div className="text-base font-bold text-foreground font-mono-num">{profile.sign_in_streak ?? 0}</div>
                    <div className="text-[9px] text-muted-foreground uppercase">连续签到</div>
                  </div>
                </HudPanel>
                <HudPanel>
                  <div className="p-3 text-center">
                    <div className="text-base mb-1">{ship.icon}</div>
                    <div className="text-[10px] text-foreground font-semibold truncate">{ship.name}</div>
                    <div className="text-[9px] text-muted-foreground uppercase">当前飞船</div>
                  </div>
                </HudPanel>
              </div>

              {/* 进行中的订单 */}
              {profile.active_orders && profile.active_orders.length > 0 && (
                <div className="mb-5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-foreground mb-2">
                    <Rocket className="w-3.5 h-3.5 text-laser" /> 进行中的航行
                  </div>
                  <div className="space-y-2">
                    {profile.active_orders.map((o: PublicOrderItem) => (
                      <div key={o.id} className="flex items-center justify-between p-2 border border-border bg-muted/10">
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-foreground truncate">{o.plan_name} · {o.origin} → {o.destination}</div>
                          <div className="text-[10px] text-muted-foreground">{o.status === 'flying' ? '航行中' : '待登船'}</div>
                        </div>
                        <div className="text-xs font-mono-num text-laser shrink-0 ml-2">{fmtPrice(o.price)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 已获得的成就 */}
              {profile.achievements && profile.achievements.length > 0 && (
                <div className="mb-5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-foreground mb-2">
                    <Award className="w-3.5 h-3.5 text-laser" /> 已获得成就
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {profile.achievements.map((a: PublicAchievementItem) => {
                      const def = ACHIEVEMENTS[a.code];
                      return (
                        <div key={a.code} className="p-2 border border-border bg-muted/10">
                          <div className="text-xs font-semibold text-foreground truncate">{def?.name || a.code}</div>
                          <div className="text-[10px] text-muted-foreground truncate">{def?.desc || '神秘成就'}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="text-[10px] text-muted-foreground/50 font-mono-num text-center">
                加入星际客运于 {profile.created_at ? new Date(profile.created_at).toLocaleDateString('zh-CN') : '未知'}
              </div>
            </>
          )}

          <div className="h-0.5 laser-line mt-5" />
        </div>
      </div>
    </div>
  );
}