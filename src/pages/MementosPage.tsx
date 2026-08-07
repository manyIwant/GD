import { useGameStore } from '@/hooks/useGameStore';
import { HudPanel, EmptyState } from '@/components/common/Hud';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { MEMENTOS, EXPLORE_ACHIEVEMENTS } from '@/data/exploreEvents';
import { Gift, Trophy, Compass, Lock } from 'lucide-react';

export default function MementosPage() {
  const store = useGameStore();
  const { profile } = store;
  const navigate = useNavigate();
  const mementos = profile?.mementos || [];
  const achievements = profile?.explore_achievements || [];

  const ownedNames = new Set(mementos.map((m) => m.name));

  return (
    <div className="px-4 md:px-8 py-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg md:text-2xl font-bold text-foreground flex items-center gap-2">
            <Gift className="w-5 h-5 md:w-6 md:h-6 text-pink-400" /> 探索纪念品
          </h1>
          <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5">在银河星图探索中收集的神秘纪念品</p>
        </div>
        <Button className="btn-mech bg-cyan-500/80 text-white hover:bg-cyan-500" onClick={() => navigate('/galaxy')}>
          <Compass className="w-4 h-4 mr-1" /> 前往星图
        </Button>
      </div>

      {/* 探索成就 */}
      <HudPanel className="mb-4">
        <div className="p-4">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1"><Trophy className="w-3 h-3" /> 探索成就</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {EXPLORE_ACHIEVEMENTS.map((a) => {
              const unlocked = achievements.includes(a.name);
              return (
                <div key={a.name} className={`p-3 border ${unlocked ? 'border-yellow-400/50 bg-yellow-400/5' : 'border-border bg-muted/20'}`}>
                  <div className="flex items-center gap-1.5 mb-1">
                    {unlocked ? <span className="text-lg">🏆</span> : <Lock className="w-4 h-4 text-muted-foreground" />}
                    <span className={`text-xs font-bold ${unlocked ? 'text-yellow-400' : 'text-muted-foreground'}`}>{a.name}</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground leading-relaxed">{a.desc}</div>
                </div>
              );
            })}
          </div>
        </div>
      </HudPanel>

      {/* 纪念品图鉴 */}
      {mementos.length === 0 ? (
        <EmptyState
          icon="🎁"
          title="尚未收集到纪念品"
          desc="前往银河星图探索未知星域，触发探索事件即可获得神秘纪念品"
          action={<Button className="btn-mech bg-cyan-500/80 text-white hover:bg-cyan-500" onClick={() => navigate('/galaxy')}>开始探索</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {mementos.map((m, i) => (
            <HudPanel key={i} className="h-full">
              <div className="p-4 flex flex-col h-full">
                <div className="text-4xl mb-2">{m.emoji}</div>
                <div className="text-sm font-bold text-foreground">{m.name}</div>
                <div className="text-xs text-muted-foreground leading-relaxed mt-1 text-pretty flex-1">{m.desc}</div>
                <div className="text-[10px] text-pink-400 mt-2">✦ 稀有纪念品</div>
              </div>
            </HudPanel>
          ))}
        </div>
      )}

      {/* 未收集的纪念品（图鉴占位） */}
      <div className="mt-6">
        <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">纪念品图鉴（{mementos.length}/{MEMENTOS.length}）</div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {MEMENTOS.map((m) => {
            const owned = ownedNames.has(m.name);
            return (
              <div key={m.name} className={`p-2 border text-center ${owned ? 'border-pink-400/40 bg-pink-400/5' : 'border-border bg-muted/20 opacity-50'}`}>
                <div className="text-2xl">{owned ? m.emoji : <Lock className="w-5 h-5 mx-auto text-muted-foreground" />}</div>
                <div className="text-[9px] text-muted-foreground truncate mt-1">{owned ? m.name : '？？？'}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}