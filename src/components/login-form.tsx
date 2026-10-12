'use client';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api-client';
import { message, Shell } from './shell';
type Session = {
  user: null | { id: string; username: string };
  profile: null | { role: string | null };
  mode: string;
};
function remember(session: Session) {
  if (!session.user) return;
  try {
    localStorage.setItem(
      'auth:user',
      JSON.stringify({ ...session.user, role: session.profile?.role || null }),
    );
    try {
      const users = JSON.parse(localStorage.getItem('auth:users') || '{}');
      delete users[session.user.username];
      localStorage.setItem('auth:users', JSON.stringify(users));
    } catch {
      /* Legacy browser storage is optional; invalid JSON or unavailable storage must not prevent server authentication. */
    }
  } catch {
    /* Legacy browser storage is optional; invalid JSON or unavailable storage must not prevent server authentication. */
  }
}
export function LoginForm({ mode }: { mode: string }) {
  const router = useRouter();
  const restoring = useRef(false);
  const mounted = useRef(false);
  const [action, setAction] = useState<'login' | 'signup' | 'reset-request' | 'reset-confirm'>(
    'login',
  );
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    mounted.current = true;
    if (mode !== 'demo' || restoring.current)
      return () => {
        mounted.current = false;
      };
    restoring.current = true;
    async function restore() {
      try {
        const existing = localStorage.getItem('auth:user');
        if (!existing) return;
        let name = existing;
        try {
          const parsed = JSON.parse(existing);
          name = typeof parsed === 'string' ? parsed : parsed.username || existing;
        } catch {
          /* Legacy browser storage is optional; invalid JSON or unavailable storage must not prevent server authentication. */
        }
        setUsername(name);
        const record = JSON.parse(localStorage.getItem('auth:users') || '{}')[name];
        const legacyPassword = typeof record === 'string' ? record : record?.password;
        if (typeof legacyPassword !== 'string') return;
        setBusy(true);
        let session: Session;
        try {
          session = await api<Session>('/api/auth', {
            action: 'migrate',
            username: name,
            password: legacyPassword,
            legacyRecord: record,
          });
        } catch (error) {
          if (!(error instanceof ApiError) || error.status !== 409) throw error;
          session = await api<Session>('/api/auth', {
            action: 'login',
            username: name,
            password: legacyPassword,
          });
        }
        remember(session);
        if (mounted.current) {
          router.push(session.profile?.role ? '/dashboard' : '/choose-role');
          router.refresh();
        }
      } catch {
        if (mounted.current) setNotice('Enter the password of your old account to restore it.');
      } finally {
        if (mounted.current) setBusy(false);
      }
    }
    void restore();
    return () => {
      mounted.current = false;
    };
  }, [mode, router]);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    try {
      if ((action === 'signup' || action === 'reset-confirm') && password !== confirm)
        throw new Error('Passwords do not match.');
      if (mode === 'firestore') {
        const firebase = await import('@/lib/firebase-client');
        if (action === 'reset-request') {
          await firebase.firebaseReset(username);
          setNotice('If the account exists, Firebase will send a recovery email.');
          return;
        }
        const idToken =
          action === 'signup'
            ? await firebase.firebaseSignup(username, password)
            : await firebase.firebaseLogin(username, password);
        const session = await api<Session>('/api/auth', { action: 'firebase', idToken });
        remember(session);
        router.push(session.profile?.role ? '/dashboard' : '/choose-role');
        router.refresh();
        return;
      }
      if (action === 'reset-request') {
        const result = await api<{ token?: string; demoToken?: string }>('/api/auth', {
          action,
          username,
        });
        setToken(result.token || result.demoToken || '');
        setNotice(
          'Demo recovery: no email is sent. Use the shown one-time token within 15 minutes.',
        );
        setAction('reset-confirm');
        return;
      }
      if (action === 'reset-confirm') {
        await api('/api/auth', { action, username, password, confirm, token });
        setNotice('Password changed. Sign in with the new password.');
        setAction('login');
        return;
      }
      let session: Session;
      try {
        session = await api<Session>('/api/auth', { action, username, password, confirm });
      } catch (original) {
        if (action !== 'login') throw original;
        let record: unknown;
        try {
          record = JSON.parse(localStorage.getItem('auth:users') || '{}')[username];
        } catch {
          /* Legacy browser storage is optional; invalid JSON or unavailable storage must not prevent server authentication. */
        }
        if (!record) throw original;
        session = await api<Session>('/api/auth', {
          action: 'migrate',
          username,
          password,
          legacyRecord: record,
        });
      }
      remember(session);
      router.push(session.profile?.role ? '/dashboard' : '/choose-role');
      router.refresh();
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Shell mode={mode}>
      <section className="auth card">
        <span className="pill">Delivery at your altitude</span>
        <h1>
          {action === 'signup'
            ? 'Create account'
            : action.startsWith('reset')
              ? 'Restore access'
              : 'Welcome back'}
        </h1>
        <p className="muted">Sign in to AeroRoute. The role is chosen after your first sign-in.</p>
        <form className="stack" onSubmit={submit}>
          <label>
            {mode === 'firestore' ? 'Email' : 'Username'}
            <input
              required
              autoComplete="username"
              type={mode === 'firestore' ? 'email' : 'text'}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </label>
          {action !== 'reset-request' && (
            <label>
              {action === 'reset-confirm' ? 'New password' : 'Password'}
              <input
                required
                minLength={action === 'login' ? undefined : mode === 'demo' ? 4 : 6}
                type="password"
                autoComplete={action === 'login' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
          )}
          {(action === 'signup' || action === 'reset-confirm') && (
            <label>
              Repeat password
              <input
                required
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </label>
          )}
          {action === 'reset-confirm' && (
            <label>
              One-time demo token
              <input required value={token} onChange={(e) => setToken(e.target.value)} />
            </label>
          )}
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
          {notice && (
            <p role="status" className="success">
              {notice}
            </p>
          )}
          <button disabled={busy}>
            {busy
              ? 'Please wait…'
              : action === 'signup'
                ? 'Register'
                : action === 'reset-request'
                  ? 'Reset password'
                  : action === 'reset-confirm'
                    ? 'Save password'
                    : 'Sign in'}
          </button>
        </form>
        <hr />
        <div className="row">
          <button
            className="secondary"
            onClick={() => {
              setAction(action === 'signup' ? 'login' : 'signup');
              setError('');
            }}
          >
            {action === 'signup' ? 'Already have an account' : 'Create account'}
          </button>
          <button
            className="secondary"
            onClick={() => {
              setAction('reset-request');
              setError('');
            }}
          >
            Forgot password?
          </button>
        </div>
      </section>
    </Shell>
  );
}
