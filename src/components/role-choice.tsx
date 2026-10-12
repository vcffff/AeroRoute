'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import { message, Shell } from './shell';
export function RoleChoice({ username, mode }: { username: string; mode: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function choose(role: string) {
    setBusy(true);
    setError('');
    try {
      const profile = await api<{ id: string; username: string; role: string }>(
        '/api/profile/role',
        { role },
      );
      try {
        localStorage.setItem(
          'auth:user',
          JSON.stringify({ id: profile.id, username: profile.username, role: profile.role }),
        );
      } catch {
        /* Legacy browser storage is optional; invalid JSON or unavailable storage must not prevent server authentication. */
      }
      router.push('/' + role);
      router.refresh();
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Shell username={username} mode={mode}>
      <section className="auth card">
        <span className="pill">First sign-in</span>
        <h1>How do you use AeroRoute?</h1>
        <p className="muted">
          The role is stored in your account profile. For the MVP the choice is permanent.
        </p>
        <div className="role">
          <button disabled={busy} onClick={() => choose('customer')}>
            <strong>Customer</strong>Send small parcels and follow your delivery.
          </button>
          <button className="secondary" disabled={busy} onClick={() => choose('operator')}>
            <strong>Drone operator</strong>Add drones and accept delivery orders.
          </button>
        </div>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
      </section>
    </Shell>
  );
}
