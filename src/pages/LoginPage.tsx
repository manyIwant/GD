import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Rocket, User, Lock, Sparkles } from 'lucide-react';
import Starfield from '@/components/common/Starfield';

export default function LoginPage() {
  const { signInWithUsername, signUpWithUsername } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast.error('请输入用户名和密码');
      return;
    }
    if (password.length < 6) {
      toast.error('密码至少 6 位');
      return;
    }
    setLoading(true);
    try {
      const fn = mode === 'login' ? signInWithUsername : signUpWithUsername;
      const { error } = await fn(username.trim(), password);
      if (error) {
        toast.error(error.message || (mode === 'login' ? '登录失败' : '注册失败'));
      } else {
        if (mode === 'register') {
          toast.success('注册成功，欢迎加入星际客运', { description: '正在进入…' });
        }
        navigate('/');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 overflow-hidden">
      <Starfield />
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-card/95 backdrop-blur-md border border-border shadow-2xl">
          {/* 头部 */}
          <div className="relative px-6 py-8 border-b border-border overflow-hidden">
            <div className="absolute inset-0 hud-grid opacity-30" />
            <div className="absolute top-0 left-0 right-0 h-px laser-line" />
            <div className="relative flex items-center gap-3">
              <div className="w-12 h-12 border-2 border-laser flex items-center justify-center bg-laser/10">
                <Rocket className="w-6 h-6 text-laser" />
              </div>
              <div>
                <div className="text-[10px] tracking-[0.3em] text-muted-foreground uppercase">GAODE INTERSTELLAR</div>
                <div className="text-xl font-bold text-foreground text-glow">高德星际·客运</div>
              </div>
            </div>
            <div className="relative mt-3 text-xs text-muted-foreground leading-relaxed">
              星际航行预订平台 · 深空跃迁 · 休眠航行 · 文明归档
            </div>
          </div>

          {/* 切换 */}
          <div className="flex border-b border-border">
            {(['login', 'register'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
                  mode === m ? 'text-laser' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {m === 'login' ? '航行员登录' : '新航行员注册'}
                {mode === m && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-laser laser-line" />}
              </button>
            ))}
          </div>

          {/* 表单 */}
          <form onSubmit={submit} className="p-6 space-y-4">
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider">航行员代号</label>
              <div className="relative mt-1">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="输入用户名"
                  className="pl-9 bg-background border-border btn-mech"
                  autoComplete="username"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider">访问密钥</label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="输入密码（≥6位）"
                  className="pl-9 bg-background border-border btn-mech"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full btn-mech bg-laser text-primary-foreground hover:bg-laser/90 font-bold tracking-wider"
            >
              {loading ? '处理中…' : mode === 'login' ? '启航·登录' : '注册并启航'}
              {!loading && <Sparkles className="w-4 h-4 ml-2" />}
            </Button>

            <div className="text-center text-[10px] text-muted-foreground leading-relaxed pt-2">
              登录即代表同意《星际客运服务条款》<br />
              单向航行不可退票 · 请谨慎预订
            </div>
          </form>
          <div className="h-1 laser-line" />
        </div>

        {/* 底部信息 */}
        <div className="mt-4 text-center text-[10px] text-muted-foreground/60 font-mono-num">
          ISC-2026-08821 · QUANTUM RELAY #4267
        </div>
      </div>
    </div>
  );
}
