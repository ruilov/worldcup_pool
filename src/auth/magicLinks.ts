// Helpers for Supabase magic-link flows
import { supabase } from '../supabaseClient';

const buildVerifyUrl = (email?: string): string => {
  const base = import.meta.env.BASE_URL ?? '/';
  // Ensure single trailing slash before auth/verify
  const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base;
  const url = new URL(`${window.location.origin}${normalizedBase}/auth/verify`);
  if (email) {
    url.searchParams.set('email', email);
  }
  return url.toString();
};

export async function requestMagicLink(email: string): Promise<{ error?: string }> {
  const redirectTo = buildVerifyUrl(email);
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectTo,
      // Force PKCE so we get a code_verifier stored client-side
      flowType: 'pkce',
    },
  });
  return { error: error?.message };
}

export async function verifyMagicLink(): Promise<void> {
  const url = new URL(window.location.href);
  const searchParams = url.searchParams;
  const hashParams = new URLSearchParams(url.hash.replace(/^#/, ''));
  const code = searchParams.get('code') ?? hashParams.get('code');

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw error;
  } else {
    // If the URL was already cleaned but session exists (e.g., after a reload), accept it.
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('No verification code found in the URL. Request a new link and try again.');
    }
  }

  // Clean the URL (remove code/email params and hash)
  searchParams.delete('code');
  searchParams.delete('email');
  url.search = searchParams.toString();
  url.hash = '';
  window.history.replaceState(window.history.state, '', url.toString());
}
