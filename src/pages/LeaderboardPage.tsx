import { useState, useEffect } from 'react';
import { HudPanel, DataItem, EmptyState } from '@/components/common/Hud';
import { Button } from '@/components/ui/button';
import { fetchLeaderboard, fetchUserRank } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { fmtLY } from '@/data/pricing';
import type { LeaderboardEntry } from '@/types/types';
import { Trophy, Medal, Award, Crown } from 'lucide-react';

type Category = 'light_years' | 'orders' | 'achievements' | 'xp';

const CATEGORIES: { key: Category; label: string; field: keyof LeaderboardEntry; fmt: (e: LeaderboardEntry) => string }[] = [
  { key: 'light_years', label: '累计光年', field: 'light_years_traveled', fmt: (e) => fmtLY(e.light_years_traveled) },
  { key: 'orders', label: '完成航次', field: 'orders_completed', fmt: (e) => String(e.orders_completed) },
  { key: 'achievements', label: '成就数量', field: 'achievements_count', fmt: (e) => String(e.achievements_count) },
  { key: 'xp', label: '总经验值', field: 'xp', fmt: (e) => (e.xp || 0).toLocaleString() },
];

const RANK_COLORS = ['text-yellow-400', 'text-gray-300', 'text-orange-400'];
const RANK_ICONS = [Crown, Medal, Award];

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [category, setCategory] = useState<Category>('light_years');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    const load = async () => {
      setLoading(true);
      try {
        const [list, rank] = await Promise.all([
          fetchLeaderboard(category, 50),
          user ? fetchUserRank(user.id, category) : Promise.resolve(null),
        ]);
        if (!cancel) {
          setEntries(list);
          setMyRank(rank);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancel) setLoading(false);
      }
    };
    load();
    const timer = setInterval(load, 30000);
    return () => { cancel = true; clearInterval(timer); };
  }, [category, user]);

  return (
    <div className="px-4 md:px-8 py-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Trophy className="w-5 h-5 text-laser" /> 星际排行榜
        </h1>
        {myRank && (
          <div className="text-xs text-muted-foreground">
            我的排名：<span className="text-laser font-bold font-mono-num">#{myRank}</span>
          </div>
        )}
      </div>

      {/* 切换分类 */}
      <div className="grid grid-cols-4 gap-1.5 mb-4">
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            onClick={() => setCategory(c.key)}
            className={`py-2 text-xs border btn-mech transition-colors ${
              category === c.key ? 'neon-active text-laser bg-laser/10' : 'border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* 前三名 */}
      {entries.length >= 3 && (
        <div className="grid grid-cols-3 gap-2 mb-4">
          {entries.slice(0, 3).map((e, i) => {
            const Icon = RANK_ICONS[i] || Trophy;
            return (
              <div key={e.id} className={`border p-3 text-center ${i === 0 ? 'border-yellow-500/60 bg-yellow-950/20' : i === 1 ? 'border-gray-400/60 bg-gray-800/20' : 'border-orange-500/60 bg-orange-950/20'}`}>
                <Icon className={`w-6 h-6 mx-auto mb-1 ${RANK_COLORS[i]}`} />
                <div className="text-xs font-bold text-foreground truncate">{e.username || '匿名'}</div>
                <div className={`text-sm font-bold font-mono-num ${RANK_COLORS[i]}`}>
                  {CATEGORIES.find((c) => c.key === category)?.fmt(e)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 完整列表 */}
      <HudPanel>
        <div className="divide-y divide-border">
          {loading ? (
            <EmptyState icon="📡" title="排行榜加载中…" />
          ) : entries.length === 0 ? (
            <EmptyState icon="🏆" title="暂无排行数据" desc="完成航行后即可上榜" />
          ) : (
            entries.map((e, i) => {
              const isMe = e.id === user?.id;
              const fmt = CATEGORIES.find((c) => c.key === category)?.fmt;
              return (
                <div key={e.id} className={`flex items-center gap-3 p-3 ${isMe ? 'bg-laser/10 neon-active' : ''}`}>
                  <span className={`w-7 text-center font-bold font-mono-num ${i < 3 ? RANK_COLORS[i] : 'text-muted-foreground'}`}>
                    {i + 1}
                  </span>
                  <div className="w-8 h-8 bg-muted border border-border flex items-center justify-center text-sm shrink-0">
                    {e.username?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-foreground truncate">{e.username || '匿名航行员'}{isMe && <span className="ml-1 text-[10px] text-laser">(我)</span>}</div>
                    <div className="text-[10px] text-muted-foreground">Lv.{e.level}</div>
                  </div>
                  <div className="text-sm font-bold font-mono-num text-laser">{fmt?.(e)}</div>
                </div>
              );
            })
          )}
        </div>
      </HudPanel>

      <div className="text-center text-[10px] text-muted-foreground/60 mt-4 font-mono-num">
        排行榜每 30 秒自动刷新 · 数据实时同步云端
      </div>
    </div>
  );
}
