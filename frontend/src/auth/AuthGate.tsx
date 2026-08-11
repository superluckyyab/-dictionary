import { createContext, useContext, useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { createAdminCredentials, isOwner } from './auth';
import { AUTH_COPY } from './authCopy';

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
      setError(AUTH_COPY.invalidCredentials);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGuestLogin() {
    setError('');
    setSubmitting(true);
    const { error: signInError } = await supabase.auth.signInAnonymously();
    if (signInError) setError(AUTH_COPY.guestError);
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
    return <div className="min-h-screen bg-[#EAE3D2] grid place-items-center text-[#8A857B]">{AUTH_COPY.loading}</div>;
  }

  if (user && contextValue) {
    return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
  }

  return (
    <main className="min-h-screen bg-[#EAE3D2] grid place-items-center px-4">
      <section className="w-full max-w-sm rounded-2xl border border-[#D4CBB8] bg-[#F2EDE0] p-6 shadow-sm">
        <h1 className="word-title text-2xl font-bold text-[#2C2A26]">English Dictionary</h1>
        <p className="mt-1 text-sm text-[#8A857B]">{AUTH_COPY.intro}</p>
        {!isSupabaseConfigured && (
          <p className="mt-4 rounded-lg bg-[#EAE3D2] px-3 py-2 text-sm text-[#8C2F2A]">{AUTH_COPY.configurationError}</p>
        )}
        <form className="mt-5 space-y-3" onSubmit={handleAdminLogin}>
          <label className="block text-xs font-medium text-[#5A5550]">
            {AUTH_COPY.username}
            <input className="mt-1 w-full rounded-lg border border-[#D4CBB8] bg-[#EAE3D2] px-3 py-2 text-sm text-[#2C2A26] outline-none focus:border-[#8C2F2A]" value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" />
          </label>
          <label className="block text-xs font-medium text-[#5A5550]">
            {AUTH_COPY.password}
            <input className="mt-1 w-full rounded-lg border border-[#D4CBB8] bg-[#EAE3D2] px-3 py-2 text-sm text-[#2C2A26] outline-none focus:border-[#8C2F2A]" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" />
          </label>
          {error && <p className="text-sm text-[#8C2F2A]">{error}</p>}
          <button className="w-full rounded-lg bg-[#8C2F2A] px-4 py-2.5 text-sm font-medium text-[#F2EDE0] hover:bg-[#6B1F1A] disabled:opacity-50 transition-colors" disabled={submitting || !isSupabaseConfigured} type="submit">{AUTH_COPY.signIn}</button>
        </form>
        <div className="my-4 h-px bg-[#D4CBB8]" />
        <button className="w-full rounded-lg border border-[#D4CBB8] bg-[#F2EDE0] px-4 py-2.5 text-sm font-medium text-[#5A5550] hover:border-[#8C2F2A] hover:text-[#8C2F2A] disabled:opacity-50 transition-colors" disabled={submitting || !isSupabaseConfigured} onClick={handleGuestLogin} type="button">{AUTH_COPY.guestAction}</button>
        <p className="mt-3 text-center text-xs text-[#8A857B]">{AUTH_COPY.guestNote}</p>
      </section>
    </main>
  );
}
