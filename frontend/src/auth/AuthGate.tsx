import { createContext, useContext, useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { createAdminCredentials, isOwner } from './auth';
import { AUTH_COPY } from './authCopy';
import TopTabs from '../components/TopTabs';
import SearchBar from '../components/SearchBar';
import LevelFilter from '../components/LevelFilter';
import LetterFilter from '../components/LetterFilter';
import DefinitionModeToggle from '../components/DefinitionModeToggle';

type AuthContextValue = {
  user: User;
  owner: boolean;
  anonymous: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type SignedOutViewProps = {
  username: string;
  password: string;
  submitting: boolean;
  error: string;
  configured: boolean;
  onUsernameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onAdminLogin: (event: FormEvent<HTMLFormElement>) => void;
  onGuestLogin: () => void;
};

const ignore = () => undefined;

export function SignedOutView({
  username,
  password,
  submitting,
  error,
  configured,
  onUsernameChange,
  onPasswordChange,
  onAdminLogin,
  onGuestLogin,
}: SignedOutViewProps) {
  return (
    <div className="min-h-screen bg-[#EAE3D2]">
      <div className="max-w-2xl mx-auto bg-[#EAE3D2]">
        <div className="sticky top-0 z-10 bg-[#EAE3D2] border-b border-[#D4CBB8] shadow-sm">
          <div className="px-4 pt-4 pb-1">
            <h1 className="word-title text-2xl font-bold text-[#2C2A26]">English Dictionary</h1>
            <p className="text-xs text-[#8A857B] mt-0.5">CEFR A1–C2 vocabulary</p>
          </div>
          <TopTabs
            activeTab="all"
            onTabChange={ignore}
            onAddWord={ignore}
            onImport={ignore}
            owner
          />
          <SearchBar value="" onChange={ignore} />
          <LevelFilter selected={[]} onChange={ignore} />
          <LetterFilter selected="All" onChange={ignore} />
          <div className="px-4 py-1.5 flex items-center justify-between flex-wrap gap-2">
            <p className="text-xs text-[#8A857B]">…</p>
            <DefinitionModeToggle mode="hidden" onChange={ignore} />
          </div>
        </div>
        <div className="pt-2">
          <div className="flex flex-col items-center justify-center py-16 text-[#8A857B]">
            <div className="w-6 h-6 border-2 border-[#8C2F2A] border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm">Loading words…</p>
          </div>
        </div>
      </div>

      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
        <div className="bg-[#F2EDE0] rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
          <div className="px-5 py-4 border-b border-[#D4CBB8]">
            <h2 className="word-title text-lg font-bold text-[#2C2A26]">Sign in</h2>
            <p className="text-xs text-[#8A857B] mt-1">{AUTH_COPY.intro}</p>
          </div>
          <form onSubmit={onAdminLogin} className="p-5 space-y-4">
            {!configured && (
              <p className="rounded-lg bg-[#EAE3D2] px-3 py-2 text-sm text-[#8C2F2A]">{AUTH_COPY.configurationError}</p>
            )}
            <div>
              <label className="block text-xs font-medium text-[#5A5550] mb-1" htmlFor="auth-username">{AUTH_COPY.username}</label>
              <input
                id="auth-username"
                className="w-full bg-[#EAE3D2] border border-[#D4CBB8] rounded-lg px-3 py-2 text-sm text-[#2C2A26] focus:outline-none focus:border-[#8C2F2A]"
                value={username}
                onChange={(event) => onUsernameChange(event.target.value)}
                autoComplete="username"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#5A5550] mb-1" htmlFor="auth-password">{AUTH_COPY.password}</label>
              <input
                id="auth-password"
                className="w-full bg-[#EAE3D2] border border-[#D4CBB8] rounded-lg px-3 py-2 text-sm text-[#2C2A26] focus:outline-none focus:border-[#8C2F2A]"
                type="password"
                value={password}
                onChange={(event) => onPasswordChange(event.target.value)}
                autoComplete="current-password"
              />
            </div>
            {error && <p className="text-sm text-[#8C2F2A]">{error}</p>}
            <div className="flex gap-3 pt-2">
              <button
                className="flex-1 py-2 rounded-lg border border-[#D4CBB8] text-sm text-[#5A5550] hover:border-[#8C2F2A] transition-colors disabled:opacity-50"
                disabled={submitting || !configured}
                onClick={onGuestLogin}
                type="button"
              >
                {AUTH_COPY.guestAction}
              </button>
              <button
                className="flex-1 py-2 rounded-lg bg-[#8C2F2A] text-[#F2EDE0] text-sm font-medium hover:bg-[#6B1F1A] disabled:opacity-50 transition-colors"
                disabled={submitting || !configured}
                type="submit"
              >
                {AUTH_COPY.signIn}
              </button>
            </div>
            <p className="text-center text-xs text-[#8A857B]">{AUTH_COPY.guestNote}</p>
          </form>
        </div>
      </div>
    </div>
  );
}

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

  return <SignedOutView
    username={username}
    password={password}
    submitting={submitting}
    error={error}
    configured={isSupabaseConfigured}
    onUsernameChange={setUsername}
    onPasswordChange={setPassword}
    onAdminLogin={handleAdminLogin}
    onGuestLogin={handleGuestLogin}
  />;
}
