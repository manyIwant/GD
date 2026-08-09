import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { User, Lock, Sparkles } from 'lucide-react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import Starfield from '@/components/common/Starfield';

// ── 阶段：dormant → launching → smoky → ready ──
type Phase = 'dormant' | 'launching' | 'smoky' | 'ready';

// 烟雾散去时的爆射粒子（18方向）
const BURST = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  angle: (i * 360) / 18,
  dist: 160 + Math.sin(i * 2.1) * 55,
  delay: (i % 5) * 0.025,
  size: 5 + (i % 4) * 3,
}));

interface FormCardProps {
  mode: 'login' | 'register';
  setMode: (m: 'login' | 'register') => void;
  username: string;
  setUsername: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export default function LoginPage() {
  const { signInWithUsername, signUpWithUsername } = useAuth();
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>('dormant');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const smokeCtrl = useAnimation();

  // ── 启动序列 ──
  const activate = () => {
    if (phase !== 'dormant') return;
    setPhase('launching');
    // 烟雾随火箭开始扩张
    smokeCtrl.start({
      clipPath: 'circle(32% at 50% 58%)',
      opacity: 1,
      transition: { duration: 0.52, ease: [0.2, 0, 0.5, 1] },
    });
    // 烟雾铺满全屏
    setTimeout(() => {
      setPhase('smoky');
      smokeCtrl.start({
        clipPath: 'circle(200% at 50% 58%)',
        transition: { duration: 0.2, ease: 'easeIn' },
      });
    }, 720);
    // 烟雾散去，登录卡登场
    setTimeout(() => {
      setPhase('ready');
      smokeCtrl.start({
        opacity: 0,
        transition: { duration: 0.55, ease: 'easeIn', delay: 0.08 },
      });
    }, 1580);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) { toast.error('请输入用户名和密码'); return; }
    if (password.length < 6) { toast.error('密码至少 6 位'); return; }
    setLoading(true);
    try {
      const fn = mode === 'login' ? signInWithUsername : signUpWithUsername;
      const { error } = await fn(username.trim(), password);
      if (error) {
        const msg = error.message || '';
        let friendly = mode === 'login' ? '登录失败' : '注册失败';
        if (msg.includes('Invalid login credentials')) friendly = '用户名或密码错误，请重试';
        else if (msg.includes('already registered') || msg.includes('already been registered')) friendly = '该航行员代号已注册，请直接登录';
        else if (msg.includes('Password should be at least')) friendly = '密码至少 6 位';
        else if (msg.includes('已被封禁')) friendly = '该账号已被封禁，请联系管理员';
        toast.error(friendly);
      } else {
        if (mode === 'register') toast.success('注册成功，欢迎加入星际客运', { description: '正在进入…' });
        navigate('/');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#050816]">

      {/* 层1：星空（休眠时极暗） */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ opacity: phase === 'dormant' ? 0.1 : 1, transition: 'opacity 1.4s ease' }}>
        <Starfield density={200} className="absolute inset-0 pointer-events-none" />
      </div>

      {/* 层2：星云光晕（ready 后浮现） */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ opacity: phase === 'ready' ? 1 : 0, transition: 'opacity 1.2s ease 0.4s' }}>
        <div className="absolute top-[12%] left-[8%] w-[500px] h-[500px] rounded-full blur-[150px]"
          style={{ background: 'radial-gradient(circle, rgba(0,200,255,0.11), transparent 70%)' }} />
        <div className="absolute bottom-[8%] right-[5%] w-[600px] h-[600px] rounded-full blur-[170px]"
          style={{ background: 'radial-gradient(circle, rgba(120,80,255,0.09), transparent 70%)' }} />
      </div>

      {/* 层3：HUD 网格 */}
      <div className="absolute inset-0 hud-grid pointer-events-none"
        style={{ opacity: phase === 'ready' ? 0.055 : 0, transition: 'opacity 1s ease 0.4s' }} />

      {/* ── 烟雾遮罩（clip-path 圆形扩张） ── */}
      <motion.div
        className="fixed inset-0 z-40 pointer-events-none"
        animate={smokeCtrl}
        initial={{ clipPath: 'circle(0% at 50% 58%)', opacity: 0 }}
        style={{
          background:
            'radial-gradient(ellipse at 50% 40%, #f0f6ff 0%, #ccdeff 35%, #9bbcf0 70%, #7098d8 100%)',
        }}
      />

      {/* ── 烟雾散去时的爆射粒子 ── */}
      {phase === 'smoky' &&
        BURST.map(({ id, angle, dist, delay, size }) => (
          <motion.div
            key={id}
            className="fixed z-50 rounded-full pointer-events-none"
            style={{
              width: size, height: size,
              left: `calc(50% - ${size / 2}px)`,
              top: `calc(58% - ${size / 2}px)`,
              background: 'rgba(160,200,255,0.9)',
              filter: 'blur(1.5px)',
            }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{
              x: Math.cos((angle * Math.PI) / 180) * dist,
              y: Math.sin((angle * Math.PI) / 180) * dist,
              opacity: 0, scale: 1.6,
            }}
            transition={{ duration: 0.65, delay, ease: 'easeOut' }}
          />
        ))}

      {/* ── 发射台（dormant / launching / smoky 阶段可见） ── */}
      <AnimatePresence>
        {phase !== 'ready' && (
          <motion.div
            key="launchpad"
            className="absolute z-30 flex flex-col items-center"
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
          >
            <LaunchPad phase={phase} onLaunch={activate} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 登录卡（ready 阶段材质化弹入） ── */}
      <AnimatePresence>
        {phase === 'ready' && (
          <motion.div
            key="card"
            className="relative z-10 w-full max-w-md px-4"
            initial={{ opacity: 0, y: 50, filter: 'blur(18px)', scale: 0.94 }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)', scale: 1 }}
            transition={{ type: 'spring', stiffness: 185, damping: 22, delay: 0.1 }}
          >
            <FormCard
              mode={mode} setMode={setMode}
              username={username} setUsername={setUsername}
              password={password} setPassword={setPassword}
              loading={loading} onSubmit={submit}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════
// 发射台组件
// ═══════════════════════════════════════════
function LaunchPad({ phase, onLaunch }: { phase: Phase; onLaunch: () => void }) {
  const isDormant = phase === 'dormant';
  const isLaunching = phase === 'launching';

  return (
    <div className="flex flex-col items-center select-none">
      {/* 火箭（含升空动画） */}
      <motion.div
        className={isDormant ? 'cursor-pointer' : 'cursor-default'}
        onClick={isDormant ? onLaunch : undefined}
        whileHover={isDormant ? { scale: 1.06 } : {}}
        whileTap={isDormant ? { scale: 0.93 } : {}}
        animate={
          isLaunching
            ? {
                // shake → 点火 → 快速升空
                y: [0, 5, -5, 3, -3, 2, -2, 0, -10, -900],
                rotate: [0, -1, 1, -0.5, 0.5, 0],
                transition: {
                  y: { times: [0, 0.05, 0.10, 0.15, 0.20, 0.25, 0.30, 0.36, 0.42, 1], duration: 0.88, ease: 'easeIn' },
                  rotate: { duration: 0.36 },
                },
              }
            : {}
        }
      >
        <RocketSVG glow={isDormant} />

        {/* 发动机尾焰（点火后出现） */}
        <AnimatePresence>
          {isLaunching && (
            <motion.div
              className="relative -mt-1 flex justify-center"
              initial={{ scaleY: 0, opacity: 0 }}
              animate={{ scaleY: [0, 1.3, 1, 1.15, 0.9], opacity: 1 }}
              style={{ transformOrigin: 'top center' }}
              transition={{ duration: 0.3 }}
            >
              <FlameSVG />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* 发射台光晕 */}
      {isDormant && (
        <motion.div
          className="rounded-full"
          style={{
            width: 80, height: 10, marginTop: 6,
            background: 'radial-gradient(ellipse, rgba(0,200,255,0.35) 0%, transparent 70%)',
            filter: 'blur(4px)',
          }}
          animate={{ opacity: [0.4, 1, 0.4], scaleX: [0.9, 1.1, 0.9] }}
          transition={{ repeat: Infinity, duration: 2.2 }}
        />
      )}

      {/* 状态文字 */}
      {isDormant && (
        <motion.div className="mt-5 text-center pointer-events-none"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 2.2 }}>
          <div className="text-[11px] tracking-[0.45em] text-cyan-400/75 font-mono uppercase">点击发射</div>
          <div className="text-[9px] text-muted-foreground/35 mt-1 font-mono-num tracking-widest">
            INTERSTELLAR BOARDING TERMINAL
          </div>
        </motion.div>
      )}
      {isLaunching && (
        <motion.div
          className="mt-5 text-[10px] text-cyan-300/90 font-mono tracking-[0.35em] uppercase"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}>
          引擎点火…
        </motion.div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════
// 火箭 SVG（精确居中，无 clip-path 干扰）
// ═══════════════════════════════════════════
function RocketSVG({ glow }: { glow: boolean }) {
  return (
    <motion.div
      animate={
        glow
          ? {
              filter: [
                'drop-shadow(0 0 8px rgba(0,200,255,0.4))',
                'drop-shadow(0 0 20px rgba(0,200,255,0.75))',
                'drop-shadow(0 0 8px rgba(0,200,255,0.4))',
              ],
            }
          : { filter: 'drop-shadow(0 0 6px rgba(0,200,255,0.3))' }
      }
      transition={{ repeat: Infinity, duration: 2.6 }}
    >
      <svg width="76" height="148" viewBox="0 0 76 148" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* 鼻锥 */}
        <path d="M 22 44 Q 38 2 54 44 Z" fill="rgba(238,248,255,0.96)" />
        {/* 机身 */}
        <rect x="22" y="40" width="32" height="76" rx="4" fill="rgba(232,245,255,0.93)" />
        {/* 机身条纹 */}
        <rect x="22" y="85" width="32" height="3" rx="1" fill="rgba(0,200,255,0.55)" />
        <rect x="22" y="93" width="32" height="1.5" rx="0.5" fill="rgba(0,200,255,0.3)" />
        {/* 左侧三角翼 */}
        <path d="M 22 90 L 3 122 L 22 113 Z" fill="rgba(0,175,220,0.82)" />
        {/* 右侧三角翼 */}
        <path d="M 54 90 L 73 122 L 54 113 Z" fill="rgba(0,175,220,0.82)" />
        {/* 翼面细线 */}
        <line x1="22" y1="100" x2="9" y2="116" stroke="rgba(0,200,255,0.35)" strokeWidth="1" />
        <line x1="54" y1="100" x2="67" y2="116" stroke="rgba(0,200,255,0.35)" strokeWidth="1" />
        {/* 发动机舱 */}
        <path d="M 27 114 L 23 130 L 29 126 L 38 132 L 47 126 L 53 130 L 49 114 Z"
          fill="rgba(20,40,70,0.92)" />
        {/* 舱门缝线 */}
        <line x1="38" y1="114" x2="38" y2="126" stroke="rgba(0,200,255,0.25)" strokeWidth="1" />
        {/* 主舷窗外圈 */}
        <circle cx="38" cy="60" r="12" fill="rgba(0,8,28,0.88)" />
        <circle cx="38" cy="60" r="12" stroke="rgba(0,200,255,0.72)" strokeWidth="2" fill="none" />
        {/* 主舷窗内圈 */}
        <circle cx="38" cy="60" r="7.5" fill="rgba(0,30,70,0.9)" />
        <circle cx="38" cy="60" r="7.5" stroke="rgba(0,160,220,0.4)" strokeWidth="1" fill="none" />
        {/* 舷窗高光 */}
        <ellipse cx="35" cy="57" rx="3" ry="2" fill="rgba(160,230,255,0.28)" />
        {/* 小观察窗 */}
        <circle cx="38" cy="77" r="4.5" fill="rgba(0,15,45,0.85)" />
        <circle cx="38" cy="77" r="4.5" stroke="rgba(0,175,220,0.5)" strokeWidth="1" fill="none" />
        {/* 机身徽章区 */}
        <rect x="30" y="46" width="16" height="10" rx="1.5" fill="rgba(0,200,255,0.1)"
          stroke="rgba(0,200,255,0.25)" strokeWidth="0.75" />
      </svg>
    </motion.div>
  );
}

// ═══════════════════════════════════════════
// 发动机尾焰 SVG
// ═══════════════════════════════════════════
function FlameSVG() {
  return (
    <svg width="76" height="72" viewBox="0 0 76 72" fill="none">
      <defs>
        <radialGradient id="flameCore" cx="50%" cy="5%" r="75%">
          <stop offset="0%" stopColor="white" stopOpacity="1" />
          <stop offset="25%" stopColor="#c8eaff" stopOpacity="0.95" />
          <stop offset="60%" stopColor="#55aadd" stopOpacity="0.7" />
          <stop offset="100%" stopColor="transparent" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="flameOuter" cx="50%" cy="5%" r="75%">
          <stop offset="0%" stopColor="#99ccff" stopOpacity="0.65" />
          <stop offset="100%" stopColor="transparent" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* 外焰 */}
      <path d="M 16 0 Q 4 26 18 54 Q 38 74 58 54 Q 72 26 60 0 Q 38 20 16 0"
        fill="url(#flameOuter)" />
      {/* 内焰核心 */}
      <path d="M 23 0 Q 15 22 24 46 Q 38 66 52 46 Q 61 22 53 0 Q 38 16 23 0"
        fill="url(#flameCore)" />
    </svg>
  );
}

// ═══════════════════════════════════════════
// 登录表单卡片（材质化弹入 + 扫描线揭幕）
// ═══════════════════════════════════════════
function FormCard({ mode, setMode, username, setUsername, password, setPassword, loading, onSubmit }: FormCardProps) {
  return (
    <div className="relative">
      {/* 四角框线装饰 */}
      {(
        ['top-0 left-0 border-t-2 border-l-2',
          'top-0 right-0 border-t-2 border-r-2',
          'bottom-0 left-0 border-b-2 border-l-2',
          'bottom-0 right-0 border-b-2 border-r-2'] as const
      ).map((cls, i) => (
        <div key={i} className={`absolute w-4 h-4 border-laser/70 ${cls} z-10`} />
      ))}

      <div className="relative bg-card/90 backdrop-blur-xl border border-border/80 overflow-hidden shadow-[0_0_60px_rgba(0,200,255,0.09)]">

        {/* 卡片开场扫描线（从上往下扫一次，像终端激活） */}
        <motion.div
          className="absolute left-0 right-0 h-[2px] z-20 pointer-events-none"
          style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(0,220,255,0.8) 40%, rgba(180,240,255,0.6) 60%, transparent 100%)' }}
          initial={{ top: 0, opacity: 1 }}
          animate={{ top: '100%', opacity: 0 }}
          transition={{ duration: 0.75, ease: 'linear', delay: 0.1 }}
        />

        {/* 顶部激光条 */}
        <div className="h-px laser-line" />

        {/* 头部 */}
        <div className="relative px-6 py-7 border-b border-border overflow-hidden">
          <div className="absolute inset-0 hud-grid opacity-20" />
          <motion.div
            className="relative flex items-center gap-3"
            initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.22, duration: 0.42 }}
          >
            {/* 徽标框 */}
            <div className="w-11 h-11 border-2 border-laser flex items-center justify-center bg-laser/10 shrink-0"
              style={{ boxShadow: '0 0 16px rgba(0,220,255,0.25)' }}>
              {/* 自绘火箭图标，保证视觉居中 */}
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path d="M 11 2 Q 16 5 16 12 L 14 12 L 14 16 L 8 16 L 8 12 L 6 12 Q 6 5 11 2 Z"
                  fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"
                  className="text-laser" />
                <circle cx="11" cy="9" r="2" fill="none" stroke="currentColor" strokeWidth="1.5"
                  className="text-laser" />
                <path d="M 8 16 L 6 19 M 14 16 L 16 19" stroke="currentColor" strokeWidth="1.5"
                  strokeLinecap="round" className="text-laser" />
                <path d="M 9 16 L 9 19 L 13 19 L 13 16" fill="none" stroke="currentColor"
                  strokeWidth="1.2" strokeLinejoin="round" className="text-laser/60" />
              </svg>
            </div>
            <div>
              <div className="text-[9px] tracking-[0.35em] text-muted-foreground uppercase font-mono">
                GAODE INTERSTELLAR
              </div>
              <div className="text-lg font-bold text-foreground text-glow leading-tight">
                高德星际·客运
              </div>
            </div>
          </motion.div>
          <motion.div
            className="relative mt-2 text-[11px] text-muted-foreground"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 0.34, duration: 0.38 }}>
            深空跃迁 · 休眠航行 · 文明归档
          </motion.div>
        </div>

        {/* 模式切换 */}
        <div className="flex border-b border-border">
          {(['login', 'register'] as const).map((m, i) => (
            <motion.button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
                mode === m ? 'text-laser' : 'text-muted-foreground hover:text-foreground'
              }`}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.26 + i * 0.07, duration: 0.32 }}
            >
              {m === 'login' ? '航行员登录' : '新航行员注册'}
              {mode === m && (
                <motion.span
                  layoutId="tab-underline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-laser"
                  style={{ boxShadow: '0 0 8px hsl(var(--laser))' }}
                />
              )}
            </motion.button>
          ))}
        </div>

        {/* 表单 */}
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          {/* 用户名 */}
          <motion.div
            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.34, duration: 0.38 }}>
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider">
              航行员代号
            </label>
            <div className="relative mt-1">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={username} onChange={(e) => setUsername(e.target.value)}
                placeholder="输入用户名"
                className="pl-9 bg-background/60 border-border btn-mech focus:border-laser/60"
                autoComplete="username"
              />
            </div>
          </motion.div>

          {/* 密码 */}
          <motion.div
            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.43, duration: 0.38 }}>
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider">
              访问密钥
            </label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="输入密码（≥6位）"
                className="pl-9 bg-background/60 border-border btn-mech focus:border-laser/60"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            </div>
          </motion.div>

          {/* 提交按钮 */}
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.52, duration: 0.38 }}>
            <Button
              type="submit" disabled={loading}
              className="w-full btn-mech bg-laser text-primary-foreground hover:bg-laser/90 font-bold tracking-wider"
            >
              {loading ? '处理中…' : mode === 'login' ? '启航·登录' : '注册并启航'}
              {!loading && <Sparkles className="w-4 h-4 ml-2" />}
            </Button>
          </motion.div>

          {/* 免责声明 */}
          <motion.div
            className="text-center text-[10px] text-muted-foreground/65 leading-relaxed pt-1"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 0.62, duration: 0.38 }}>
            登录即代表同意《星际客运服务条款》<br />
            单向航行不可退票 · 请谨慎预订
          </motion.div>
        </form>

        {/* 底部激光条 */}
        <div className="h-0.5 laser-line" />
      </div>

      {/* 序列号 */}
      <motion.div
        className="mt-4 text-center text-[10px] text-muted-foreground/35 font-mono-num"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.72 }}>
        ISC-2026-08821 · QUANTUM RELAY #4267
      </motion.div>
    </div>
  );
}
