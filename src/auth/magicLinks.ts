// Helpers for Supabase magic-link flows
import { supabase } from '../supabaseClient';

const EMAIL_STORAGE_KEY = 'wc_magic_email';

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
  try {
    window.localStorage.setItem(EMAIL_STORAGE_KEY, email);
  } catch {
    // ignore
  }
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

  // If Supabase already processed the redirect (detectSessionInUrl), just accept the session.
  const {
    data: { session: existingSession },
  } = await supabase.auth.getSession();
  if (existingSession) {
    // Clean any leftover params to keep the URL tidy.
    searchParams.delete('code');
    searchParams.delete('email');
    searchParams.delete('token');
    searchParams.delete('type');
    url.search = searchParams.toString();
    url.hash = '';
    window.history.replaceState(window.history.state, '', url.toString());
    return;
  }

  const storedEmail = (() => {
    try {
      return window.localStorage.getItem(EMAIL_STORAGE_KEY);
    } catch {
      return null;
    }
  })();
  const email = searchParams.get('email') ?? storedEmail ?? undefined;

  // Preferred PKCE flow: look for ?code
  const code = searchParams.get('code') ?? hashParams.get('code');
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw error;

    // Clean the URL (remove code/email params and hash)
    searchParams.delete('code');
    searchParams.delete('email');
    url.search = searchParams.toString();
    url.hash = '';
    window.history.replaceState(window.history.state, '', url.toString());
    return;
  }

  // Fallback magiclink/OTP flow: token + type + email
  // For PKCE-only flow we expect ?code. If it isn't present, surface a clear error.

  throw new Error('No verification code found in the URL. Request a new link and try again.');
}
