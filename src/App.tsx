import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { changeLanguage } from './i18n';
import { MatchList } from './components/MatchList';
import { useDefaultChallenge } from './hooks/useDefaultChallenge';
import { AuthProvider, useAuth } from './auth/AuthProvider';
import { requestMagicLink, verifyMagicLink } from './auth/magicLinks';
import styles from './App.module.css';

const KNOWN_PATHS = new Set(['/auth', '/auth/link-sent', '/auth/verify', '/challenges', '/account', '/500']);
const BASE_PREFIX = (import.meta.env.BASE_URL ?? '/').replace(/\/+$/, '') || '/';

function stripBase(pathname: string): string {
  if (BASE_PREFIX !== '/' && pathname.startsWith(BASE_PREFIX)) {
    const stripped = pathname.slice(BASE_PREFIX.length) || '/';
    return stripped;
  }
  return pathname || '/';
}

function buildUrl(targetPath: string, search: string, hash: string): string {
  const path = targetPath === '/' ? '' : targetPath;
  const prefix = BASE_PREFIX === '/' ? '' : BASE_PREFIX;
  return `${prefix}${path}${search}${hash}`;
}

function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}

type HeaderProps = {
  currentLang: string;
  onLanguageChange: (lang: string) => void;
};

function Header({ currentLang, onLanguageChange }: HeaderProps) {
  const { t } = useTranslation();

  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        <span className={styles.logoIcon}>⚽</span>
        <div>
          <h1 className={styles.logoText}>
            {t('common.appName')}
            <span className={styles.logoSubtext}>2026</span>
          </h1>
        </div>
      </div>

      <div className={styles.languageSelector}>
        <label className={styles.languageLabel} htmlFor="language-select">
          {t('common.language')}
        </label>
        <select
          id="language-select"
          className={styles.languageSelect}
          value={currentLang}
          onChange={e => onLanguageChange(e.target.value)}
        >
          <option value="en">English</option>
          <option value="pt">Português</option>
        </select>
      </div>
    </header>
  );
}

type RouteSwitchProps = {
  path: string;
  navigate: (to: string) => void;
};

function RouteSwitch({ path, navigate }: RouteSwitchProps) {
  switch (path) {
    case '/auth':
      return <AuthPage navigate={navigate} />;
    case '/auth/link-sent':
      return <LinkSentPage navigate={navigate} />;
    case '/auth/verify':
      return <VerifyPage navigate={navigate} />;
    case '/challenges':
      return (
        <ProtectedRoute navigate={navigate}>
          <ChallengesPage />
        </ProtectedRoute>
      );
    case '/account':
      return (
        <ProtectedRoute navigate={navigate}>
          <AccountPage navigate={navigate} />
        </ProtectedRoute>
      );
    case '/500':
      return <ErrorPage navigate={navigate} />;
    default:
      return null;
  }
}

type NavigationProps = {
  navigate: (to: string) => void;
};

function AuthPage({ navigate }: NavigationProps) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitting(true);
    setError(null);
    const { error: reqError } = await requestMagicLink(email);
    if (reqError) {
      setError(reqError);
      setSubmitting(false);
      return;
    }
    navigate(`/auth/link-sent?email=${encodeURIComponent(email)}`);
    setSubmitting(false);
  };

  return (
    <section className={styles.page}>
      <h2>{t('auth.heading', { defaultValue: 'Sign in with a magic link' })}</h2>
      <p>{t('auth.description', { defaultValue: 'Enter your email to get a sign-in link.' })}</p>
      <form className={styles.form} onSubmit={handleSubmit}>
        <label className={styles.label} htmlFor="auth-email">
          {t('auth.emailLabel', { defaultValue: 'Email' })}
        </label>
        <input
          id="auth-email"
          name="email"
          type="email"
          className={styles.input}
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          disabled={submitting}
          placeholder={t('auth.emailPlaceholder', { defaultValue: 'you@example.com' })}
        />
        {error ? <div className={styles.error}>{error}</div> : null}
        <button className={styles.primaryButton} type="submit" disabled={!email || submitting}>
          {submitting
            ? t('auth.sending', { defaultValue: 'Sending…' })
            : t('auth.sendLink', { defaultValue: 'Send magic link' })}
        </button>
      </form>
    </section>
  );
}

function LinkSentPage({ navigate }: NavigationProps) {
  const { t } = useTranslation();
  const params = new URLSearchParams(window.location.search);
  const email = params.get('email') ?? '';
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const resend = async () => {
    if (!email) return;
    setResending(true);
    setMessage(null);
    setError(null);
    const { error: reqError } = await requestMagicLink(email);
    if (reqError) {
      setError(reqError);
    } else {
      setMessage(t('auth.linkResent', { defaultValue: 'Link resent. Check your inbox.' }));
    }
    setResending(false);
  };

  return (
    <section className={styles.page}>
      <h2>{t('auth.linkSentHeading', { defaultValue: 'Link sent' })}</h2>
      <p>
        {email
          ? t('auth.linkSentDescriptionEmail', {
              defaultValue: 'Check your email for the magic link we sent to {{email}}.',
              email,
            })
          : t('auth.linkSentDescription', { defaultValue: 'Check your email for the magic link.' })}
      </p>
      {message ? <div className={styles.success}>{message}</div> : null}
      {error ? <div className={styles.error}>{error}</div> : null}
      <div className={styles.actions}>
        <button className={styles.primaryButton} type="button" onClick={resend} disabled={!email || resending}>
          {resending
            ? t('auth.resending', { defaultValue: 'Resending…' })
            : t('auth.resendLink', { defaultValue: 'Resend link' })}
        </button>
        <button className={styles.secondaryButton} type="button" onClick={() => navigate('/auth')}>
          {t('auth.backToAuth', { defaultValue: 'Use a different email' })}
        </button>
      </div>
    </section>
  );
}

function VerifyPage({ navigate }: NavigationProps) {
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        await verifyMagicLink();
        navigate('/challenges');
      } catch (err) {
        console.error('Verification error', err);
        setError((err as Error).message);
        navigate('/500');
      }
    };
    run();
  }, [navigate]);

  return (
    <section className={styles.page}>
      <h2>{t('auth.verifyHeading', { defaultValue: 'Verifying…' })}</h2>
      <p>{t('auth.verifyDescription', { defaultValue: 'Hold on while we validate your link.' })}</p>
      {error ? <div className={styles.error}>{error}</div> : <div className={styles.loading}>{t('auth.verifying', { defaultValue: 'Checking your link…' })}</div>}
    </section>
  );
}

function ChallengesPage() {
  const { t } = useTranslation();
  const { challenge, loading } = useDefaultChallenge();

  if (loading) {
    return <div className={styles.loading}>{t('matches.loadingChallenge')}</div>;
  }

  if (!challenge) {
    return <div className={styles.error}>{t('matches.noChallengeFound')}</div>;
  }

  return (
    <section className={styles.page}>
      <h2>{t('matches.heading')}</h2>
      <MatchList challengeId={challenge.id} />
    </section>
  );
}

function AccountPage({ navigate }: NavigationProps) {
  const { t } = useTranslation();
  return (
    <section className={styles.page}>
      <h2>{t('account.heading', { defaultValue: 'Account' })}</h2>
      <p>{t('account.stub', { defaultValue: 'Account details will go here.' })}</p>
      <button className={styles.secondaryButton} type="button" onClick={() => navigate('/auth')}>
        {t('account.signOut', { defaultValue: 'Sign out' })}
      </button>
    </section>
  );
}

function ErrorPage({ navigate }: NavigationProps) {
  const { t } = useTranslation();
  return (
    <section className={styles.page}>
      <h2>{t('errors.title500', { defaultValue: 'Something went wrong' })}</h2>
      <p>
        {t('errors.description500', {
          defaultValue: 'We could not complete your request. Try again or request a new link.',
        })}
      </p>
      <button className={styles.secondaryButton} type="button" onClick={() => navigate('/auth')}>
        {t('errors.backToAuth', { defaultValue: 'Back to sign in' })}
      </button>
    </section>
  );
}

type ProtectedRouteProps = {
  children: React.ReactNode;
  navigate: (to: string) => void;
};

function ProtectedRoute({ children, navigate }: ProtectedRouteProps) {
  const { loading, user } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [loading, navigate, user]);

  if (loading) {
    return <div className={styles.loading}>{'Loading session…'}</div>;
  }

  if (!user) return null;

  return <>{children}</>;
}

export default App

/**
 * Internal shell with routing + header.
 */
function AppShell() {
  const { i18n } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const [path, setPath] = useState<string>(() => stripBase(window.location.pathname));

  const handleLanguageChange = (lang: string) => {
    changeLanguage(lang);
  };

  const navigate = useCallback((to: string) => {
    const targetUrl = new URL(to, window.location.origin);
    const normalizedPath = targetUrl.pathname.startsWith('/')
      ? stripBase(targetUrl.pathname)
      : stripBase(`/${targetUrl.pathname}`);
    const fullPath = buildUrl(normalizedPath, targetUrl.search, targetUrl.hash);
    if (fullPath === window.location.pathname + window.location.search + window.location.hash) {
      return;
    }
    window.history.pushState({}, '', fullPath);
    setPath(normalizedPath);
  }, []);

  // Track browser navigation
  useEffect(() => {
    const handler = () => setPath(stripBase(window.location.pathname));
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, []);

  // Redirect unknown routes to /auth or /challenges based on auth
  useEffect(() => {
    if (!KNOWN_PATHS.has(path)) {
      navigate(user ? '/challenges' : '/auth');
    }
  }, [navigate, path, user]);

  return (
    <div className={styles.app}>
      <div className={styles.container}>
        <Header
          currentLang={i18n.language}
          onLanguageChange={handleLanguageChange}
        />

        <main className={styles.main}>
          {authLoading ? (
            <div className={styles.loading}>{'Loading session…'}</div>
          ) : (
            <RouteSwitch path={path} navigate={navigate} />
          )}
        </main>
      </div>
    </div>
  );
}
