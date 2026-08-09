import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Rocket, User, Lock, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Starfield from '@/components/common/Starfield';

// ────────── 动画阶段 ──────────
// dormant   初始：漆黑深空，信标缓慢脉动
// activating 点击后：信标引爆，扫描线扫屏，背景点亮
// ready      登录卡丝滑弹入，信标退场
type Phase = 'dormant' | 'activating' | 'ready';

// 信标点击后向外爆射的12粒粒子方向角
const BURST_ANGLES = Array.from({ length: 12 }, (_, i) => i * 30);

export default function LoginPage() {
  const { signInWithUsername, signUpWithUsername } = useAuth();
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>('dormant');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // ── 激活序列 ──
  const activate = () => {
    if (phase !== 'dormant') return;
    setPhase('activating');
    setTimeout(() => setPhase('ready'), 1050);
  };

  // ── 表单提交（逻辑不变）──
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

      {/* ── 层1：星空（休眠时极暗，激活后渐亮）── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ opacity: phase === 'dormant' ? 0.08 : 1, transition: 'opacity 1.4s ease' }}
      >
        <Starfield density={200} className="absolute inset-0 pointer-events-none" />
      </div>

      {/* ── 层2：星云光晕（激活后浮现）── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ opacity: phase === 'dormant' ? 0 : 1, transition: 'opacity 1.2s ease 0.2s' }}
      >
        <div className="absolute top-[12%] left-[8%] w-[520px] h-[520px] rounded-full blur-[150px]"
          style={{ background: 'radial-gradient(circle, rgba(0,200,255,0.11) 0%, transparent 70%)' }} />
        <div className="absolute bottom-[8%] right-[5%] w-[600px] h-[600px] rounded-full blur-[170px]"
          style={{ background: 'radial-gradient(circle, rgba(120,80,255,0.09) 0%, transparent 70%)' }} />
        <div className="absolute top-[45%] left-[38%] w-[360px] h-[360px] rounded-full blur-[120px]"
          style={{ background: 'radial-gradient(circle, rgba(0,255,160,0.05) 0%, transparent 70%)' }} />
      </div>

      {/* ── 层3：HUD 网格（激活后微显）── */}
      <div
        className="absolute inset-0 hud-grid pointer-events-none"
        style={{ opacity: phase === 'dormant' ? 0 : 0.055, transition: 'opacity 1s ease 0.3s' }}
      />

      {/* ── 扫描线（仅激活阶段）── */}
      <AnimatePresence>
        {phase === 'activating' && (
          <motion.div
            key="scanline"
            className="absolute left-0 right-0 h-[2px] z-30 pointer-events-none"
            style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(0,220,255,0.7) 50%, transparent 100%)' }}
            initial={{ top: 0, opacity: 0.8 }}
            animate={{ top: '100vh', opacity: 0 }}
            exit={{}}
            transition={{ duration: 0.75, ease: 'linear' }}
          />
        )}
      </AnimatePresence>

      {/* ── 信标（休眠 + 激活阶段）── */}
      <AnimatePresence>
        {phase !== 'ready' && (
          <motion.div
            key="beacon"
            className="absolute z-20 flex flex-col items-center"
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.3, filter: 'blur(16px)' }}
            transition={{ duration: 0.45, ease: 'easeInOut' }}
          >
            <QuantumGate activating={phase === 'activating'} onActivate={activate} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 登录卡（ready 阶段丝滑弹入）── */}
      <AnimatePresence>
        {phase === 'ready' && (
          <motion.div
            key="card"
            className="relative z-10 w-full max-w-md px-4"
            initial={{ opacity: 0, y: 56, filter: 'blur(12px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ type: 'spring', stiffness: 190, damping: 22, delay: 0.05 }}
          >
            {/* 卡片外框角装饰 */}
            <div className="relative">
              {/* 四角装饰线 */}
              {[
                'top-0 left-0 border-t-2 border-l-2',
                'top-0 right-0 border-t-2 border-r-2',
                'bottom-0 left-0 border-b-2 border-l-2',
                'bottom-0 right-0 border-b-2 border-r-2',
              ].map((cls, i) => (
                <div key={i} className={`absolute w-4 h-4 border-laser/70 ${cls} z-10`} />
              ))}

              <div className="bg-card/90 backdrop-blur-xl border border-border/80 shadow-[0_0_60px_rgba(0,200,255,0.08)]">
                {/* 顶部激光扫描线 */}
                <div className="h-px laser-line" />

                {/* 头部 */}
                <div className="relative px-6 py-7 border-b border-border overflow-hidden">
                  <div className="absolute inset-0 hud-grid opacity-20" />
                  <motion.div
                    className="relative flex items-center gap-3"
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.18, duration: 0.45 }}
                  >
                    <div className="w-11 h-11 border-2 border-laser flex items-center justify-center bg-laser/10 shrink-0"
                      style={{ boxShadow: '0 0 16px rgba(var(--laser-rgb, 0,220,255),0.25)' }}>
                      <Rocket className="w-5 h-5 text-laser" />
                    </div>
                    <div>
                      <div className="text-[9px] tracking-[0.35em] text-muted-foreground uppercase font-mono">GAODE INTERSTELLAR</div>
                      <div className="text-lg font-bold text-foreground text-glow leading-tight">高德星际·客运</div>
                    </div>
                  </motion.div>
                  <motion.div
                    className="relative mt-2 text-[11px] text-muted-foreground"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                  >
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
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.22 + i * 0.07, duration: 0.35 }}
                    >
                      {m === 'login' ? '航行员登录' : '新航行员注册'}
                      {mode === m && (
                        <motion.span
                          layoutId="tab-indicator"
                          className="absolute bottom-0 left-0 right-0 h-0.5 bg-laser"
                          style={{ boxShadow: '0 0 8px hsl(var(--laser))' }}
                        />
                      )}
                    </motion.button>
                  ))}
                </div>

                {/* 表单 */}
                <form onSubmit={submit} className="p-6 space-y-4">
                  {[
                    { label: '航行员代号', icon: User, key: 'username', type: 'text', ph: '输入用户名', auto: 'username', val: username, set: setUsername },
                    { label: '访问密钥', icon: Lock, key: 'password', type: 'password', ph: '输入密码（≥6位）', auto: mode === 'login' ? 'current-password' : 'new-password', val: password, set: setPassword },
                  ].map(({ label, icon: Icon, key, type, ph, auto, val, set }, fi) => (
                    <motion.div
                      key={key}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + fi * 0.09, duration: 0.4 }}
                    >
                      <label className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</label>
                      <div className="relative mt-1">
                        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          type={type}
                          value={val}
                          onChange={(e) => set(e.target.value)}
                          placeholder={ph}
                          className="pl-9 bg-background/60 border-border btn-mech focus:border-laser/70 focus:shadow-[0_0_0_1px_hsl(var(--laser)/0.3)]"
                          autoComplete={auto}
                        />
                      </div>
                    </motion.div>
                  ))}

                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.4 }}
                  >
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full btn-mech bg-laser text-primary-foreground hover:bg-laser/90 font-bold tracking-wider"
                    >
                      {loading ? '处理中…' : mode === 'login' ? '启航·登录' : '注册并启航'}
                      {!loading && <Sparkles className="w-4 h-4 ml-2" />}
                    </Button>
                  </motion.div>

                  <motion.div
                    className="text-center text-[10px] text-muted-foreground/70 leading-relaxed pt-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.4 }}
                  >
                    登录即代表同意《星际客运服务条款》<br />
                    单向航行不可退票 · 请谨慎预订
                  </motion.div>
                </form>

                {/* 底部状态条 */}
                <div className="h-0.5 laser-line" />
              </div>
            </div>

            {/* 卡片下方序列号 */}
            <motion.div
              className="mt-4 text-center text-[10px] text-muted-foreground/40 font-mono-num"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              ISC-2026-08821 · QUANTUM RELAY #4267
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ──────────────────────────────────────────
// 量子跃迁门（Quantum Launch Gate）信标
// ──────────────────────────────────────────
function QuantumGate({ activating, onActivate }: { activating: boolean; onActivate: () => void }) {
  return (
    <div className="relative flex flex-col items-center">
      {/* 爆射粒子（激活瞬间） */}
      {activating && BURST_ANGLES.map((deg) => (
        <motion.div
          key={deg}
          className="absolute w-1.5 h-1.5 rounded-full"
          style={{ background: 'rgba(0,220,255,0.9)' }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{
            x: Math.cos((deg * Math.PI) / 180) * 180,
            y: Math.sin((deg * Math.PI) / 180) * 180,
            opacity: 0,
            scale: 0.3,
          }}
          transition={{ duration: 0.75, ease: 'easeOut' }}
        />
      ))}

      {/* 外层旋转分段环 */}
      <motion.div
        className="absolute rounded-full border-dashed border-[1.5px]"
        style={{
          width: 220, height: 220,
          borderColor: activating ? 'rgba(0,220,255,0.6)' : 'rgba(0,180,220,0.25)',
          top: '50%', left: '50%',
          marginTop: -110, marginLeft: -110,
        }}
        animate={{ rotate: 360 }}
        transition={{ repeat: activating ? 0 : Infinity, duration: activating ? 0.4 : 14, ease: activating ? 'easeIn' : 'linear' }}
      />

      {/* 中层反向旋转环 */}
      <motion.div
        className="absolute rounded-full border border-dotted"
        style={{
          width: 170, height: 170,
          borderColor: activating ? 'rgba(0,255,200,0.5)' : 'rgba(0,180,140,0.2)',
          top: '50%', left: '50%',
          marginTop: -85, marginLeft: -85,
        }}
        animate={{ rotate: -360 }}
        transition={{ repeat: activating ? 0 : Infinity, duration: activating ? 0.5 : 20, ease: 'linear' }}
      />

      {/* 脉冲扩散环（休眠时） */}
      {!activating && (
        <>
          {[0, 0.6, 1.2].map((delay) => (
            <motion.div
              key={delay}
              className="absolute rounded-full border border-cyan-500/20"
              style={{ width: 120, height: 120, top: '50%', left: '50%', marginTop: -60, marginLeft: -60 }}
              animate={{ scale: [1, 1.9], opacity: [0.35, 0] }}
              transition={{ repeat: Infinity, duration: 2.4, delay, ease: 'easeOut' }}
            />
          ))}
        </>
      )}

      {/* 激活爆闪光环 */}
      {activating && (
        <>
          {[0, 0.1, 0.22].map((delay) => (
            <motion.div
              key={delay}
              className="absolute rounded-full"
              style={{
                width: 120, height: 120,
                top: '50%', left: '50%',
                marginTop: -60, marginLeft: -60,
                border: '2px solid rgba(0,220,255,0.8)',
              }}
              animate={{ scale: [1, 2.8], opacity: [0.9, 0] }}
              transition={{ duration: 0.7, delay, ease: 'easeOut' }}
            />
          ))}
        </>
      )}

      {/* 核心可点击区域 */}
      <motion.button
        type="button"
        onClick={onActivate}
        disabled={activating}
        className="relative z-10 flex items-center justify-center rounded-full cursor-pointer select-none"
        style={{
          width: 120, height: 120,
          background: activating
            ? 'radial-gradient(circle, rgba(0,255,220,0.25) 0%, rgba(0,180,255,0.15) 60%, transparent 100%)'
            : 'radial-gradient(circle, rgba(0,180,255,0.12) 0%, rgba(0,100,180,0.08) 60%, transparent 100%)',
          border: '2px solid',
          borderColor: activating ? 'rgba(0,255,220,0.8)' : 'rgba(0,180,255,0.4)',
          boxShadow: activating
            ? '0 0 40px rgba(0,220,255,0.5), inset 0 0 30px rgba(0,220,255,0.15)'
            : '0 0 20px rgba(0,180,255,0.15), inset 0 0 20px rgba(0,100,180,0.08)',
        }}
        whileHover={!activating ? { scale: 1.06, boxShadow: '0 0 36px rgba(0,200,255,0.4)' } : {}}
        whileTap={!activating ? { scale: 0.94 } : {}}
        transition={{ type: 'spring', stiffness: 300, damping: 18 }}
      >
        {/* 六边形内框 */}
        <div
          className="absolute inset-4 flex items-center justify-center"
          style={{
            clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
            background: activating ? 'rgba(0,255,220,0.12)' : 'rgba(0,150,200,0.08)',
            border: '1px solid rgba(0,200,255,0.3)',
          }}
        />
        {/* 火箭图标 */}
        <motion.div
          animate={activating ? { scale: [1, 1.3, 0.8], rotate: [0, 10, -10, 0] } : { y: [0, -3, 0] }}
          transition={activating
            ? { duration: 0.5, ease: 'easeInOut' }
            : { repeat: Infinity, duration: 2.5, ease: 'easeInOut' }
          }
        >
          <Rocket
            className="w-9 h-9 relative z-10"
            style={{ color: activating ? 'rgba(0,255,220,0.95)' : 'rgba(0,200,255,0.75)' }}
          />
        </motion.div>
      </motion.button>

      {/* 水平标尺装饰线 */}
      {[-60, 60].map((offset) => (
        <div
          key={offset}
          className="absolute h-px"
          style={{
            width: 60, top: '50%',
            left: offset > 0 ? 'calc(50% + 60px)' : 'calc(50% - 120px)',
            background: `linear-gradient(${offset > 0 ? '90deg' : '270deg'}, rgba(0,200,255,0.6), transparent)`,
          }}
        />
      ))}

      {/* 状态文字 */}
      <div className="mt-12 text-center pointer-events-none">
        <motion.div
          className="text-[11px] tracking-[0.4em] uppercase font-mono"
          style={{ color: activating ? 'rgba(0,255,220,0.9)' : 'rgba(0,180,255,0.55)' }}
          animate={activating ? {} : { opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
        >
          {activating ? '量子通道开启中…' : '触碰启航'}
        </motion.div>
        {!activating && (
          <div className="text-[10px] text-muted-foreground/40 mt-1 font-mono-num tracking-wider">
            QUANTUM BOARDING TERMINAL
          </div>
        )}
        {activating && (
          <motion.div
            className="flex items-center justify-center gap-1 mt-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {[0, 0.15, 0.3].map((d) => (
              <motion.div
                key={d}
                className="w-1 h-1 rounded-full bg-cyan-400"
                animate={{ scale: [1, 1.6, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 0.6, delay: d }}
              />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
