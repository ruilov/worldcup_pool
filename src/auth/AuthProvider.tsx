// src/auth/AuthProvider.tsx
// Supabase auth context with magic-link session handling

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  signOut: (opts?: { allDevices?: boolean }) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    const { data, error: authError } = await supabase.auth.getSession();
    if (authError) {
      console.error('Auth refresh error:', authError);
      setError(authError.message);
      setUser(null);
      setSession(null);
    } else {
      setSession(data.session);
      setUser(data.session?.user ?? null);
    }
    setLoading(false);
  };

  const signOut = async (opts?: { allDevices?: boolean }) => {
    setLoading(true);
    setError(null);
    const { error: signOutError } = await supabase.auth.signOut({
      scope: opts?.allDevices ? 'global' : 'local',
    });
    if (signOutError) {
      console.error('Sign out error:', signOutError);
      setError(signOutError.message);
    }
    setUser(null);
    setSession(null);
    setLoading(false);
  };

  useEffect(() => {
    // Initial load
    refresh();

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      loading,
      error,
      refresh,
      signOut,
    }),
    [user, session, loading, error],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
