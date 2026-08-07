import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { HudPanel, DataItem, LocationHero, AlertBar } from '@/components/common/Hud';
import { getLevelByXp, getNextLevel, getLevelProgress } from '@/data/levels';
import { getShip } from '@/data/ships';
import { fmtPrice, fmtLY } from '@/data/pricing';
import { CANDIDATES, buildWP } from '@/data/waypoints';
import { Search, Plus, MapPin, Trophy, Target, Ship, BookOpen, Zap, ChevronRight, Orbit, Wrench, Radio } from 'lucide-react';

export default function HomePage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [origin, setOrigin] = useState('地球（亚洲·海口）');
  const [dest, setDest] = useState('');
  const [transits, setTransits] = useState<string[]>(['']);
  const [showCandidates, setShowCandidates] = useState(false);
  const [focusField, setFocusField] = useState<'origin' | 'dest' | 'transit' | null>(null);

  // 星历时钟（每秒更新）
  const [stardate, setStardate] = useState('');
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      const sd = `${d.getUTCFullYear()}.${String(d.getUTCMonth() + 1).padStart(2, '0')}.${String(d.getUTCDate()).padStart(2, '0')} · ${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}:${String(d.getUTCSeconds()).padStart(2, '0')} UTC`;
      setStardate(sd);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  // 每日宇宙格言（按日期稳定）
  const quotes = useMemo(
    () => [
      '「星辰大海，始于足下。」—— 致每一位仰望星空的航行员',
      '「我们都是星尘的孩子，终将回归星辰。」—— 卡尔·萨根',
      '「宇宙最不可理解之处，在于它竟然可以被理解。」—— 爱因斯坦',
      '「在浩瀚星海面前，渺小也是一种浪漫。」',
      '「每一颗星星，都是一个未被讲述的故事。」',
      '「跨越光年的旅程，从一次勇敢的点击开始。」',
    ],
    []
  );
  const dailyQuote = useMemo(() => {
    const d = new Date();
    const idx = (d.getUTCFullYear() * 1000 + d.getUTCMonth() * 50 + d.getUTCDate()) % quotes.length;
    return quotes[idx];
  }, [quotes]);

  const level = useMemo(() => getLevelByXp(profile?.xp || 0), [profile?.xp]);
  const nextLevel = useMemo(() => getNextLevel(profile?.xp || 0), [profile?.xp]);
  const progress = useMemo(() => getLevelProgress(profile?.xp || 0), [profile?.xp]);
  const ship = useMemo(() => getShip(profile?.selected_ship || 'cnsa'), [profile?.selected_ship]);

  const handleCandidateClick = (text: string) => {
    if (focusField === 'origin') { setOrigin(text); setShowCandidates(false); return; }
    if (focusField === 'dest') { setDest(text); setShowCandidates(false); return; }
    if (focusField === 'transit') {
      setTransits((prev) => {
        const emptyIdx = prev.findIndex((t) => !t.trim());
        if (emptyIdx >= 0) {
          const next = [...prev];
          next[emptyIdx] = text;
          return next;
        }
        return [...prev, text];
      });
      setShowCandidates(false);
    }
  };

  const goToRoute = () => {
    if (!dest.trim()) { setShowCandidates(true); setFocusField('dest'); return; }
    // 用 URL 参数传递
    const t = transits.filter((x) => x.trim());
    const q = new URLSearchParams({ o: origin, d: dest, t: t.join('|') });
    navigate(`/route?${q.toString()}`);
  };

  const shortcuts = [
    { label: '每日任务', icon: Target, to: '/tasks', color: 'text-orange-400' },
    { label: '排行榜', icon: Trophy, to: '/leaderboard', color: 'text-blue-400' },
    { label: '飞船收藏', icon: Ship, to: '/ships', color: 'text-purple-400' },
    { label: '飞行日志', icon: BookOpen, to: '/logs', color: 'text-green-400' },
  ];

  return (
    <div className="px-4 md:px-8 py-6 max-w-5xl mx-auto">
      {/* 星历与宇宙格言 */}
      <div className="mb-5 flex flex-col gap-2">
        <div className="flex items-center gap-2 text-[10px] md:text-xs font-mono-num">
          <Radio className="w-3.5 h-3.5 text-laser animate-pulse" />
          <span className="text-laser">STARDATE</span>
          <span className="text-muted-foreground">{stardate}</span>
        </div>
        <div className="text-[11px] md:text-xs text-muted-foreground italic border-l-2 border-laser/40 pl-2 text-pretty">
          {dailyQuote}
        </div>
      </div>

      {/* 等级面板 */}
      <HudPanel title="航行员档案" className="mb-5">
        <div className="p-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 border-2 border-laser bg-laser/10 flex items-center justify-center text-3xl shrink-0">
              {level.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-foreground">Lv.{level.level} {level.name}</span>
                <span className="text-[10px] text-muted-foreground font-mono-num">XP {profile?.xp || 0}</span>
              </div>
              <div className="mt-2 h-2 bg-muted border border-border overflow-hidden">
                <div className="h-full bg-laser laser-line" style={{ width: `${progress.pct}%` }} />
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1 font-mono-num">
                <span>{progress.current}/{progress.next} XP</span>
                <span>{nextLevel ? `下一级：${nextLevel.name}` : '已满级'}</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
            <DataItem label="信用点" value={fmtPrice(profile?.balance || 0)} accent />
            <DataItem label="累计光年" value={fmtLY(profile?.light_years_traveled || 0)} />
            <DataItem label="完成航次" value={profile?.orders_completed || 0} />
            <DataItem label="成就" value={profile?.achievements_count || 0} />
          </div>
          <div className="mt-3 text-[11px] text-muted-foreground border-l-2 border-laser/50 pl-2">
            🚀 当前飞船：<span className="text-laser">{ship.icon} {ship.name}</span>
            {ship.buffType !== 'discount' && ship.buffValue > 0 && (
              <span className="ml-2 text-green-400">
                · {ship.buffType === 'speed' ? `速度+${Math.round((ship.buffValue - 1) * 100)}%` : `XP+${Math.round(ship.buffValue * 100)}%`}
              </span>
            )}
          </div>
        </div>
      </HudPanel>

      {/* 个人探索大项目入口 */}
      <button
        onClick={() => navigate('/galaxy')}
        className="w-full mb-5 relative overflow-hidden border border-cyan-500/40 btn-mech group"
        style={{ background: 'linear-gradient(120deg, rgba(6,182,212,0.12) 0%, rgba(124,58,237,0.12) 100%)' }}
      >
        <div className="absolute inset-0 pointer-events-none opacity-40">
          <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/10 blur-[60px]" />
          <div className="absolute bottom-0 left-1/4 w-40 h-40 bg-purple-500/10 blur-[50px]" />
        </div>
        <div className="relative p-5 flex items-center gap-4">
          <div className="text-5xl shrink-0 group-hover:scale-110 transition-transform">🌌</div>
          <div className="flex-1 min-w-0 text-left">
            <div className="flex items-center gap-2 mb-1">
              <Orbit className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-bold text-cyan-400">个人探索 · 银河星图</span>
              <span className="text-[9px] px-1.5 py-px rounded bg-cyan-500/20 text-cyan-400">大项目</span>
            </div>
            <div className="text-xs text-foreground/80 leading-relaxed text-pretty">设计你的专属探索舰，曲速航行探索未知星域，收集神秘纪念品，打造属于你的银河版图。</div>
            <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><Wrench className="w-3 h-3 text-purple-400" />飞船设计</span>
              <span className="flex items-center gap-1"><Orbit className="w-3 h-3 text-cyan-400" />曲速探索</span>
              <span className="flex items-center gap-1">🎁 纪念品</span>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-cyan-400 shrink-0 group-hover:translate-x-1 transition-transform" />
        </div>
      </button>

      {/* 搜索栏 */}
      <HudPanel title="航线搜索" className="mb-5">
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 laser-line shrink-0" />
            <Input
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              onFocus={() => { setFocusField('origin'); setShowCandidates(true); }}
              placeholder="出发地"
              className="bg-background border-border btn-mech"
            />
          </div>
          {transits.map((t, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-yellow-500 laser-line shrink-0" />
              <Input
                value={t}
                onChange={(e) => setTransits((prev) => { const n = [...prev]; n[i] = e.target.value; return n; })}
                onFocus={() => { setFocusField('transit'); setShowCandidates(true); }}
                placeholder={`途经点 ${i + 1}`}
                className="bg-background border-border btn-mech"
              />
              {transits.length > 1 && (
                <Button variant="ghost" size="sm" className="btn-mech px-2" onClick={() => setTransits((prev) => prev.filter((_, idx) => idx !== i))}>✕</Button>
              )}
            </div>
          ))}
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-laser laser-line shrink-0" />
            <Input
              value={dest}
              onChange={(e) => setDest(e.target.value)}
              onFocus={() => { setFocusField('dest'); setShowCandidates(true); }}
              placeholder="目的地"
              className="bg-background border-border btn-mech"
            />
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="btn-mech" onClick={() => setTransits((prev) => [...prev, ''])}>
              <Plus className="w-3.5 h-3.5 mr-1" /> 途经点
            </Button>
            <Button className="flex-1 btn-mech bg-laser text-primary-foreground hover:bg-laser/90" onClick={goToRoute}>
              <Search className="w-4 h-4 mr-1.5" /> 搜索航线
            </Button>
          </div>

          {showCandidates && (
            <div className="border border-border bg-muted/30 p-2">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 px-1">候选地点</div>
              <div className="flex flex-wrap gap-1.5">
                {CANDIDATES.map((c) => (
                  <button
                    key={c}
                    onClick={() => handleCandidateClick(c)}
                    className="px-2.5 py-1 text-xs border border-border bg-background hover:border-laser hover:text-laser btn-mech transition-colors"
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </HudPanel>

      {/* 快捷入口 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {shortcuts.map((s) => (
          <button
            key={s.to}
            onClick={() => navigate(s.to)}
            className="bg-card border border-border p-4 flex flex-col items-center gap-2 hover:border-laser btn-mech transition-colors group"
          >
            <s.icon className={`w-6 h-6 ${s.color} group-hover:scale-110 transition-transform`} />
            <span className="text-xs text-foreground">{s.label}</span>
          </button>
        ))}
      </div>

      {/* 系统公告 */}
      <HudPanel title="系统公告">
        <div className="p-4 space-y-2 text-xs text-muted-foreground leading-relaxed">
          <div className="flex gap-2"><span className="text-laser">●</span> 三体纪元航线已开放，需经半人马座α中转。</div>
          <div className="flex gap-2"><span className="text-yellow-500">●</span> B-612 与翁法罗斯为隐藏目的地，可通过目的地页探索。</div>
          <div className="flex gap-2"><span className="text-green-500">●</span> 每日完成3个任务可获额外 XP 与信用点。</div>
        </div>
      </HudPanel>

      <div className="mt-6 text-center text-[10px] text-muted-foreground/60 font-mono-num">
        高德星际 · GAODE INTERSTELLAR · ISC-2026-08821
      </div>
    </div>
  );
}
