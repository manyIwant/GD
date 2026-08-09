import { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import type { MiniGameType } from '@/data/cosmicEvents';

interface Props {
  open: boolean;
  type: MiniGameType;
  rewardXp?: number;
  rewardBalance?: number;
  riskBalance?: number;
  onClose: (success: boolean, xp: number, balance: number) => void;
}

// 宇宙事件小游戏：解码 / 躲避 / 序列
export default function MiniGame({ open, type, rewardXp = 50, rewardBalance = 0, riskBalance = 0, onClose }: Props) {
  const [timeLeft, setTimeLeft] = useState(15);
  const [phase, setPhase] = useState<'intro' | 'play' | 'win' | 'lose'>('intro');

  useEffect(() => {
    if (open) { setPhase('intro'); setTimeLeft(15); }
  }, [open, type]);

  const start = () => setPhase('play');

  const handleResult = useCallback((success: boolean) => {
    const xp = success ? rewardXp : 0;
    const bal = success ? rewardBalance : -riskBalance;
    setPhase(success ? 'win' : 'lose');
    setTimeout(() => onClose(success, xp, bal), 1200);
  }, [onClose, rewardXp, rewardBalance, riskBalance]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose(false, 0, 0)}>
      <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg bg-card border-laser">
        <DialogHeader>
          <DialogTitle className="text-laser flex items-center gap-2">
            🎮 {type === 'decode' ? '解码神秘信号' : type === 'dodge' ? '躲避流星群' : '量子序列校准'}
          </DialogTitle>
        </DialogHeader>

        {phase === 'intro' && (
          <div className="space-y-3 py-2">
            <p className="text-xs text-muted-foreground leading-relaxed">
              {type === 'decode' && '屏幕将显示一段闪烁的字符序列。请在 15 秒内按顺序点击它们，破解来自虚空的讯号。'}
              {type === 'dodge' && '左右移动你的飞船（点击屏幕左/右侧），躲避来袭的流星碎片。坚持 15 秒即胜利。'}
              {type === 'sequence' && '仪器面板将依次闪烁 4 个灯光，请按相同顺序复现。共 3 轮，难度递增。'}
            </p>
            <Button className="w-full btn-mech bg-laser text-primary-foreground hover:bg-laser/90" onClick={start}>开始挑战</Button>
          </div>
        )}

        {phase === 'play' && type === 'decode' && <DecodeGame onResult={handleResult} timeLeft={timeLeft} setTimer={setTimeLeft} />}
        {phase === 'play' && type === 'dodge' && <DodgeGame onResult={handleResult} timeLeft={timeLeft} setTimer={setTimeLeft} />}
        {phase === 'play' && type === 'sequence' && <SequenceGame onResult={handleResult} />}

        {phase === 'win' && (
          <div className="text-center py-8">
            <div className="text-5xl mb-3">🎉</div>
            <div className="text-lg font-bold text-green-400">挑战成功！</div>
            <div className="text-xs text-muted-foreground mt-1">获得 +{rewardXp} XP{rewardBalance > 0 ? ` · +${rewardBalance} 信用点` : ''}</div>
          </div>
        )}
        {phase === 'lose' && (
          <div className="text-center py-8">
            <div className="text-5xl mb-3">💫</div>
            <div className="text-lg font-bold text-yellow-400">挑战失败</div>
            <div className="text-xs text-muted-foreground mt-1">{riskBalance > 0 ? `损失 ${riskBalance} 信用点` : '航行继续，无惩罚'}</div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// 解码游戏
function DecodeGame({ onResult, timeLeft, setTimer }: { onResult: (s: boolean) => void; timeLeft: number; setTimer: (n: number) => void }) {
  const CHARS = 'αβγδεζηθικλμν';
  const [sequence] = useState(() => Array.from({ length: 4 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]));
  const [userInput, setUserInput] = useState<string[]>([]);
  const [showSeq, setShowSeq] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setShowSeq(false), 2500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (timeLeft <= 0) { onResult(false); return; }
    if (userInput.length === sequence.length) {
      onResult(userInput.join('') === sequence.join(''));
      return;
    }
    const t = setInterval(() => setTimer(timeLeft - 1), 1000);
    return () => clearInterval(t);
  }, [timeLeft, setTimer, userInput, sequence, onResult]);

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center text-xs">
        <span className="text-muted-foreground">时间</span>
        <span className="font-mono-num text-laser font-bold">{timeLeft}s</span>
      </div>
      <div className="bg-muted/40 border border-border p-3 text-center">
        <div className="text-[10px] text-muted-foreground uppercase mb-2">{showSeq ? '记住顺序' : '按顺序点击'}</div>
        {showSeq ? (
          <div className="flex justify-center gap-2 text-2xl font-bold text-laser">
            {sequence.map((c, i) => <span key={i} className="text-glow">{c}</span>)}
          </div>
        ) : (
          <div className="flex justify-center gap-1 min-h-[2rem]">
            {userInput.map((c, i) => <span key={i} className="text-xl text-laser">{c}</span>)}
            {userInput.length < sequence.length && <span className="text-xl text-muted-foreground animate-pulse">_</span>}
          </div>
        )}
      </div>
      <div className="grid grid-cols-6 gap-1.5">
        {CHARS.split('').map((c) => (
          <button
            key={c}
            disabled={showSeq}
            onClick={() => setUserInput((p) => p.length < sequence.length ? [...p, c] : p)}
            className="aspect-square border border-border bg-background hover:border-laser hover:text-laser btn-mech text-lg font-bold"
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}

// 躲避游戏
function DodgeGame({ onResult, timeLeft, setTimer }: { onResult: (s: boolean) => void; timeLeft: number; setTimer: (n: number) => void }) {
  const [shipPos, setShipPos] = useState(50);
  const [meteors, setMeteors] = useState<{ x: number; y: number }[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (timeLeft <= 0) { onResult(true); return; }
    const t = setInterval(() => setTimer(timeLeft - 1), 1000);
    return () => clearInterval(t);
  }, [timeLeft, setTimer, onResult]);

  useEffect(() => {
    const moveInterval = setInterval(() => {
      setMeteors((prev) => {
        const next = prev.map((m) => ({ ...m, y: m.y + 4 })).filter((m) => m.y < 100);
        if (Math.random() < 0.3) next.push({ x: Math.random() * 90, y: 0 });
        // 碰撞检测
        for (const m of next) {
          if (m.y > 80 && m.y < 95 && Math.abs(m.x - shipPos) < 8) {
            onResult(false);
            return next;
          }
        }
        return next;
      });
    }, 120);
    return () => clearInterval(moveInterval);
  }, [shipPos, onResult]);

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const x = ((clientX - rect.left) / rect.width) * 100;
    setShipPos(Math.max(5, Math.min(95, x)));
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">坚持时间</span>
        <span className="font-mono-num text-laser font-bold">{timeLeft}s / 15s</span>
      </div>
      <div
        ref={containerRef}
        onMouseMove={handleMove}
        onTouchMove={handleMove}
        className="relative w-full h-64 bg-background border border-border overflow-hidden cursor-crosshair"
      >
        {/* 飞船 */}
        <div className="absolute text-2xl transition-all duration-75" style={{ left: `${shipPos}%`, bottom: '5%', transform: 'translateX(-50%)' }}>🚀</div>
        {/* 流星 */}
        {meteors.map((m, i) => (
          <div key={i} className="absolute text-xl" style={{ left: `${m.x}%`, top: `${m.y}%`, transform: 'translateX(-50%)' }}>☄️</div>
        ))}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-laser laser-line" />
      </div>
      <p className="text-[10px] text-muted-foreground text-center">移动鼠标/手指控制飞船</p>
    </div>
  );
}

// 序列游戏
function SequenceGame({ onResult }: { onResult: (s: boolean) => void }) {
  const PADS = ['bg-red-500', 'bg-green-500', 'bg-blue-500', 'bg-yellow-500'];
  const [round, setRound] = useState(0);
  const [seq, setSeq] = useState<number[]>([]);
  const [showIdx, setShowIdx] = useState(-1);
  const [userIdx, setUserIdx] = useState(0);
  const [phase, setPhase] = useState<'show' | 'input'>('show');

  useEffect(() => {
    if (round >= 3) { onResult(true); return; }
    const newLen = round + 2;
    const newSeq = Array.from({ length: newLen }, () => Math.floor(Math.random() * 4));
    setSeq(newSeq);
    setUserIdx(0);
    setPhase('show');
    let i = 0;
    const showNext = () => {
      if (i >= newSeq.length) { setShowIdx(-1); setPhase('input'); return; }
      setShowIdx(newSeq[i]);
      setTimeout(() => { setShowIdx(-1); i++; setTimeout(showNext, 200); }, 500);
    };
    setTimeout(showNext, 600);
  }, [round, onResult]);

  const handleClick = (idx: number) => {
    if (phase !== 'input') return;
    if (seq[userIdx] === idx) {
      const next = userIdx + 1;
      if (next >= seq.length) {
        setRound((r) => r + 1);
        toast.success(`第 ${round + 1} 轮通过！`);
      } else {
        setUserIdx(next);
      }
    } else {
      onResult(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="text-center text-xs text-muted-foreground">第 {round + 1} / 3 轮 · {phase === 'show' ? '观察闪烁顺序' : '按顺序复现'}</div>
      <div className="grid grid-cols-2 gap-3">
        {PADS.map((color, idx) => (
          <button
            key={idx}
            onClick={() => handleClick(idx)}
            disabled={phase !== 'input'}
            className={`aspect-square rounded-lg border-2 btn-mech transition-all ${
              showIdx === idx ? 'border-white scale-95 brightness-150' : 'border-border'
            } ${color} ${phase === 'input' ? 'hover:brightness-125' : 'opacity-70'}`}
          />
        ))}
      </div>
    </div>
  );
}
