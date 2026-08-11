import { createContext, useContext, useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { createAdminCredentials, isOwner } from './auth';

type AuthContextValue = {
  user: User;
  owner: boolean;
  anonymous: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthGate');
  return value;
}

export default function AuthGate({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active) {
        setUser(data.session?.user ?? null);
        setLoading(false);
      }
    });
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  async function handleAdminLogin(event: FormEvent) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const credentials = createAdminCredentials(username, password);
      const { error: signInError } = await supabase.auth.signInWithPassword(credentials);
      if (signInError) throw signInError;
    } catch {
      setError('用户名或密码不正确');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGuestLogin() {
    setError('');
    setSubmitting(true);
    const { error: signInError } = await supabase.auth.signInAnonymously();
    if (signInError) setError('暂时无法进入体验，请稍后重试');
    setSubmitting(false);
  }

  const contextValue = useMemo<AuthContextValue | null>(() => {
    if (!user) return null;
    return {
      user,
      owner: isOwner(user),
      anonymous: Boolean(user.is_anonymous),
      signOut: async () => { await supabase.auth.signOut(); },
    };
  }, [user]);

  if (loading) {
    return <div className="min-h-screen bg-[#EAE3D2] grid place-items-center text-[#8A857B]">Loading…</div>;
  }

  if (user && contextValue) {
    return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
  }

  return (
    <main className="min-h-screen bg-[#EAE3D2] grid place-items-center px-4">
      <section className="w-full max-w-sm rounded-xl border border-[#D4CBB8] bg-[#F2EDE0] p-6 shadow-sm">
        <h1 className="word-title text-2xl font-bold text-[#2C2A26]">English Dictionary</h1>
        <p className="mt-1 text-sm text-[#8A857B]">登录永久词典，或匿名临时体验</p>
        {!isSupabaseConfigured && (
          <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">服务尚未配置完成</p>
        )}
        <form className="mt-5 space-y-3" onSubmit={handleAdminLogin}>
          <label className="block text-sm text-[#2C2A26]">
            用户名
            <input className="mt-1 w-full rounded-md border border-[#C8BFA8] bg-white px-3 py-2 outline-none focus:border-[#8C2F2A]" value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" />
          </label>
          <label className="block text-sm text-[#2C2A26]">
            密码
            <input className="mt-1 w-full rounded-md border border-[#C8BFA8] bg-white px-3 py-2 outline-none focus:border-[#8C2F2A]" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" />
          </label>
          {error && <p className="text-sm text-[#8C2F2A]">{error}</p>}
          <button className="w-full rounded-md bg-[#8C2F2A] px-4 py-2.5 font-medium text-white hover:bg-[#6B1F1A] disabled:opacity-60" disabled={submitting || !isSupabaseConfigured} type="submit">登录</button>
        </form>
        <div className="my-4 flex items-center gap-3 text-xs text-[#8A857B]"><span className="h-px flex-1 bg-[#D4CBB8]" />或<span className="h-px flex-1 bg-[#D4CBB8]" /></div>
        <button className="w-full rounded-md border border-[#8C2F2A] px-4 py-2.5 font-medium text-[#8C2F2A] hover:bg-[#EAE3D2] disabled:opacity-60" disabled={submitting || !isSupabaseConfigured} onClick={handleGuestLogin} type="button">匿名体验</button>
        <p className="mt-3 text-center text-xs text-[#8A857B]">匿名体验记录仅保存在该临时账号中</p>
      </section>
    </main>
  );
}
