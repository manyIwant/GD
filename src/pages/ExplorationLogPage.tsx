import { useMemo } from 'react';
import { useGameStore } from '@/hooks/useGameStore';
import { useNavigate } from 'react-router-dom';
import { HudPanel, EmptyState } from '@/components/common/Hud';
import { Button } from '@/components/ui/button';
import { fmtLY } from '@/data/pricing';
import { MEMENTOS, EXPLORE_ACHIEVEMENTS } from '@/data/exploreEvents';
import { Compass, Gift, Trophy, Rocket, MapPin, Sparkles } from 'lucide-react';

export default function ExplorationLogPage() {
  const store = useGameStore();
  const { profile, flightLogs } = store;
  const navigate = useNavigate();

  const mementos = profile?.mementos || [];
  const exploreAch = profile?.explore_achievements || [];
  const ownedNames = useMemo(() => new Set(mementos.map((m) => m.name)), [mementos]);

  // 探索进度统计
  const exploredCount = useMemo(() => {
    const dests = new Set(flightLogs.map((l) => l.destination));
    return dests.size;
  }, [flightLogs]);

  const totalLy = useMemo(() => flightLogs.reduce((s, l) => s + (l.light_years || 0), 0), [flightLogs]);
  const mementoRate = MEMENTOS.length > 0 ? Math.round((mementos.length / MEMENTOS.length) * 100) : 0;
  const achRate = EXPLORE_ACHIEVEMENTS.length > 0 ? Math.round((exploreAch.length / EXPLORE_ACHIEVEMENTS.length) * 100) : 0;

  return (
    <div className="px-4 md:px-8 py-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg md:text-2xl font-bold text-foreground flex items-center gap-2">
            <Compass className="w-5 h-5 md:w-6 md:h-6 text-cyan-400" /> 个人探索日志
          </h1>
          <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5">记录你在深空中的每一次发现与奇遇</p>
        </div>
        <Button className="btn-mech bg-cyan-500/80 text-white hover:bg-cyan-500 shrink-0" onClick={() => navigate('/galaxy')}>
          <Compass className="w-4 h-4 mr-1" /> 前往星图
        </Button>
      </div>

      {/* 探索概览 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <HudPanel>
          <div className="p-3 text-center">
            <MapPin className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
            <div className="text-lg font-bold text-foreground font-mono-num">{exploredCount}</div>
            <div className="text-[9px] text-muted-foreground uppercase">探索星域</div>
          </div>
        </HudPanel>
        <HudPanel>
          <div className="p-3 text-center">
            <Rocket className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
            <div className="text-lg font-bold text-foreground font-mono-num">{fmtLY(totalLy)}</div>
            <div className="text-[9px] text-muted-foreground uppercase">探索光年</div>
          </div>
        </HudPanel>
        <HudPanel>
          <div className="p-3 text-center">
            <Gift className="w-4 h-4 text-pink-400 mx-auto mb-1" />
            <div className="text-lg font-bold text-foreground font-mono-num">{mementos.length}/{MEMENTOS.length}</div>
            <div className="text-[9px] text-muted-foreground uppercase">纪念品</div>
          </div>
        </HudPanel>
        <HudPanel>
          <div className="p-3 text-center">
            <Trophy className="w-4 h-4 text-amber-400 mx-auto mb-1" />
            <div className="text-lg font-bold text-foreground font-mono-num">{exploreAch.length}/{EXPLORE_ACHIEVEMENTS.length}</div>
            <div className="text-[9px] text-muted-foreground uppercase">探索成就</div>
          </div>
        </HudPanel>
      </div>

      {/* 收集进度 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
        <HudPanel>
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5"><Gift className="w-3.5 h-3.5 text-pink-400" /> 纪念品收集进度</span>
              <span className="text-xs font-mono-num text-pink-400">{mementoRate}%</span>
            </div>
            <div className="h-2 bg-muted overflow-hidden">
              <div className="h-full bg-pink-500/70 transition-all" style={{ width: `${mementoRate}%` }} />
            </div>
          </div>
        </HudPanel>
        <HudPanel>
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5"><Trophy className="w-3.5 h-3.5 text-amber-400" /> 探索成就进度</span>
              <span className="text-xs font-mono-num text-amber-400">{achRate}%</span>
            </div>
            <div className="h-2 bg-muted overflow-hidden">
              <div className="h-full bg-amber-500/70 transition-all" style={{ width: `${achRate}%` }} />
            </div>
          </div>
        </HudPanel>
      </div>

      {/* 已抵达的星域 */}
      <HudPanel className="mb-6">
        <div className="p-4">
          <div className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-cyan-400" /> 已抵达的星域
          </div>
          {flightLogs.length === 0 ? (
            <EmptyState icon="🌌" title="尚未探索任何星域" desc="前往银河星图开始你的探索之旅" />
          ) : (
            <div className="flex flex-wrap gap-2">
              {[...new Set(flightLogs.map((l) => l.destination))].map((dest) => (
                <span key={dest} className="flex items-center gap-1 text-xs border border-cyan-500/40 bg-cyan-500/10 text-cyan-300 px-2 py-1">
                  <Sparkles className="w-3 h-3" /> {dest}
                </span>
              ))}
            </div>
          )}
        </div>
      </HudPanel>

      {/* 探索成就 */}
      <HudPanel>
        <div className="p-4">
          <div className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" /> 探索成就
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {EXPLORE_ACHIEVEMENTS.map((a) => {
              const unlocked = exploreAch.includes(a.name);
              return (
                <div key={a.name} className={`p-3 border ${unlocked ? 'border-amber-500/50 bg-amber-500/5' : 'border-border bg-muted/10 opacity-60'}`}>
                  <div className="text-xs font-bold text-foreground mb-1">{a.name}</div>
                  <div className="text-[10px] text-muted-foreground text-pretty">{a.desc}</div>
                  <div className={`text-[10px] mt-2 ${unlocked ? 'text-amber-400' : 'text-muted-foreground'}`}>
                    {unlocked ? '✓ 已解锁' : '未解锁'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </HudPanel>
    </div>
  );
}