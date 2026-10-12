'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { PublicKey } from '@solana/web3.js';
import { api } from '@/lib/api-client';
import { LogoMark } from './logo-mark';
import './aeroroute.css';

export function Shell({
  children,
  username,
  mode = 'demo',
}: {
  children: ReactNode;
  username?: string;
  mode?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const dashboardLabel =
    pathname === '/customer'
      ? 'Customer dashboard'
      : pathname === '/operator'
        ? 'Operator dashboard'
        : pathname === '/choose-role'
          ? 'Choose your role'
          : 'My dashboard';
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function logout() {
    setBusy(true);
    try {
      await api('/api/auth', { action: 'logout' });
      localStorage.removeItem('auth:user');
      if (mode === 'firestore') {
        const { firebaseLogout } = await import('@/lib/firebase-client');
        await firebaseLogout();
      }
      router.push('/login');
      router.refresh();
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="ar">
      <header>
        <Link href="/" className="brand">
          <LogoMark />
          <span>
            Aero<b>Route</b>
          </span>
        </Link>
        <nav>
          {username ? (
            <>
              <Link href="/dashboard">{dashboardLabel}</Link>
              <span className="muted">{username}</span>
              <button className="secondary" disabled={busy} onClick={logout}>
                Sign out
              </button>
            </>
          ) : (
            <Link href="/login" className="button">
              Sign in
            </Link>
          )}
        </nav>
      </header>
      <main>
        <div className="mode">
          {mode === 'demo'
            ? 'Demo mode: orders and stages are stored on this server. Payment and payout are simulated; no real flights or fund movements happen.'
            : 'Cloud Firestore: real accounts and data. Payments run in demo escrow — no real funds move.'}
        </div>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        {children}
      </main>
    </div>
  );
}
export function message(error: unknown) {
  return error instanceof Error ? error.message : 'Action failed';
}
export function Wallet() {
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function connect() {
    setBusy(true);
    setError('');
    try {
      const provider = (
        window as unknown as {
          solana?: {
            isPhantom?: boolean;
            connect: () => Promise<{ publicKey: { toString: () => string } }>;
          };
        }
      ).solana;
      if (!provider?.isPhantom) throw new Error('Install Phantom to connect a Solana wallet.');
      const result = await provider.connect();
      setAddress(new PublicKey(result.publicKey.toString()).toBase58());
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="card">
      <h3>Solana wallet</h3>
      <p className="muted">
        Connected separately from your account for future payments. Connecting a wallet is not a
        payment.
      </p>
      {address ? (
        <p className="wallet success">Connected: {address}</p>
      ) : (
        <button className="secondary" disabled={busy} onClick={connect}>
          {busy ? 'Connecting…' : 'Connect Phantom'}
        </button>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
