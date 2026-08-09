import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
// @ts-ignore
import { supabase } from '@/db/supabase';
import type { User } from '@supabase/supabase-js';
// @ts-ignore
import type { Profile } from '@/types/types';
import { toast } from 'sonner';

// 将用户名映射为合法的 Supabase Auth 邮箱（本地名仅允许 ASCII）
// 规则：纯 ASCII 用户名沿用旧版「字面邮箱」，保证历史账号（含管理员）可正常登录；
// 非 ASCII（如中文）用户名用 FNV-1a 哈希生成稳定的 ASCII 标识。
// 返回候选邮箱列表（ASCII 用户名会同时给出字面与哈希两种，登录时逐一尝试以兼容过渡期账号）
function emailCandidates(username: string): string[] {
  const trimmed = username.trim().toLowerCase();
  let hash = 0x811c9dc5;
  for (let i = 0; i < trimmed.length; i++) {
    hash ^= trimmed.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  const hex = (hash >>> 0).toString(16).padStart(8, '0');
  const hashed = `u${hex}@miaoda.com`;
  const isAscii = [...trimmed].every((c) => c.charCodeAt(0) < 128);
  return isAscii ? [`${trimmed}@miaoda.com`, hashed] : [hashed];
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('获取用户信息失败:', error);
    return null;
  }
  return data;
}
interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signInWithUsername: (username: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithUsername: (username: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    if (!user) {
      setProfile(null);
      return;
    }

    const profileData = await getProfile(user.id);
    setProfile(profileData);
  };

  useEffect(() => {
    supabase
      .auth
      .getSession()
      // @ts-ignore
      .then(({ data: { session } }) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          // 恢复会话：始终加载资料（含封禁信息），由前端决定展示
          getProfile(session.user.id).then(setProfile);
        }
      })
      // @ts-ignore
      .catch(error => {
        toast.error(`获取用户信息失败: ${error.message}`);
      })
      .finally(() => {
        setLoading(false);
      });

    // @ts-ignore
    // In this function, do NOT use any await calls. Use `.then()` instead to avoid deadlocks.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        getProfile(session.user.id).then(setProfile);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // 在线心跳：登录后定期更新 last_seen_at（用于在线状态展示）
  useEffect(() => {
    if (!user) return;
    supabase.rpc('touch_presence');
    const timer = setInterval(() => {
      supabase.rpc('touch_presence');
    }, 60000);
    return () => clearInterval(timer);
  }, [user]);

  const signInWithUsername = async (username: string, password: string) => {
    try {
      // 逐一尝试候选邮箱，兼容旧版字面邮箱账号与新版哈希邮箱账号
      const candidates = emailCandidates(username);
      let data: { user: User | null } | null = null;
      let lastError: unknown = null;
      for (const email of candidates) {
        const res = await supabase.auth.signInWithPassword({ email, password });
        if (!res.error) { data = res.data; lastError = null; break; }
        lastError = res.error;
      }
      if (lastError) throw lastError;

      // 检查封禁状态：保留登录态，交由封号申诉页处理
      if (data?.user) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('banned')
          .eq('id', data.user.id)
          .maybeSingle();
        if (prof?.banned) {
          return { error: null };
        }
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signUpWithUsername = async (username: string, password: string) => {
    try {
      // 注册统一使用首选（字面/哈希）邮箱
      const email = emailCandidates(username)[0];
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signInWithUsername, signUpWithUsername, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
