import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { getMode } from './config';
import { DomainError, type Profile } from './domain';
import { getStore } from './store';
import { getPayments } from './payments';
import { firebaseAuth } from './firebase-admin';
import { body, checkOrigin } from './http';

type Credential = { id: string; username: string; salt: string; hash: string };
type Session = { id: string; userId: string; username: string; expiresAt: number; revoked: boolean };
type Reset = { id: string; userId: string; expiresAt: number; used: boolean };
const cookieName = 'aeroroute_session';
const duration = 5 * 24 * 60 * 60 * 1000;
const digest = (value: string) => createHash('sha256').update(value).digest('hex');
const userId = (username: string) => `demo_${digest(username).slice(0, 32)}`;
function usernameValue(value: unknown) {
  if (typeof value !== 'string' || value.trim().length < 1 || value.trim().length > 80) throw new DomainError(400, 'Username must contain 1–80 characters');
  return value.trim();
}
function passwordValue(value: unknown) {
  if (typeof value !== 'string' || value.length < 4 || value.length > 256) throw new DomainError(400, 'Password must contain 4–256 characters');
  return value;
}
function credentialFor(id: string, username: string, password: string): Credential {
  const salt = randomBytes(16).toString('hex');
  return { id, username, salt, hash: scryptSync(password, salt, 64).toString('hex') };
}
function matches(credential: Credential, password: string) {
  const expected = Buffer.from(credential.hash, 'hex');
  const actual = scryptSync(password, credential.salt, 64);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
async function setCookie(value: string, maxAge = duration / 1000) {
  (await cookies()).set(cookieName, value, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge });
}
async function createSession(credential: Credential) {
  const token = randomBytes(32).toString('hex');
  const session: Session = { id: digest(token), userId: credential.id, username: credential.username, expiresAt: Date.now() + duration, revoked: false };
  await getStore().transaction(async tx => {
    const current = await tx.get<Credential>('credentials', credential.id);
    if (!current || current.hash !== credential.hash) throw new DomainError(401, 'Credentials changed. Sign in again.');
    await tx.set('sessions', session.id, session);
  });
  await setCookie(token);
}
export async function currentUser(): Promise<{ id: string; username: string } | null> {
  const token = (await cookies()).get(cookieName)?.value;
  if (!token) return null;
  if (getMode() === 'firestore') {
    try {
      // checkRevoked stays off: it adds a Google network round-trip to every
      // render and silently logs users out on flaky connectivity. Logout clears
      // the cookie and revokes refresh tokens server-side instead.
      const decoded = await firebaseAuth().verifySessionCookie(token);
      return { id: decoded.uid, username: decoded.email ?? decoded.uid };
    } catch { return null; }
  }
  const session = await getStore().get<Session>('sessions', digest(token));
  return session && !session.revoked && session.expiresAt > Date.now() ? { id: session.userId, username: session.username } : null;
}
export async function requireUser() {
  const user = await currentUser();
  if (!user) throw new DomainError(401, 'Sign in required');
  return user;
}
export async function sessionInfo() {
  const user = await currentUser();
  const profile = user ? await getStore().get<Profile>('profiles', user.id) : null;
  return { user, profile, mode: getMode(), paymentMode: getPayments().mode };
}
export async function handleAuth(request: Request) {
  checkOrigin(request);
  const data = await body(request);
  const action = data.action;
  if (getMode() === 'demo' && process.env.NODE_ENV === 'production' && (action === 'reset-request' || action === 'reset-confirm' || action === 'migrate')) {
    throw new DomainError(503, 'Demo import and shown recovery tokens are only available on the development server. Use Firebase for real accounts.');
  }
  if (action === 'logout') {
    const token = (await cookies()).get(cookieName)?.value;
    if (token && getMode() === 'demo') await getStore().transaction(async tx => {
      const session = await tx.get<Session>('sessions', digest(token));
      if (session) await tx.set('sessions', session.id, { ...session, revoked: true });
    });
    if (token && getMode() === 'firestore') {
      try { const decoded = await firebaseAuth().verifySessionCookie(token, true); await firebaseAuth().revokeRefreshTokens(decoded.uid); } catch { /* Expired cookies can always be cleared. */ }
    }
    await setCookie('', 0);
    return sessionInfo();
  }
  if (getMode() === 'firestore') {
    if (action !== 'firebase' || typeof data.idToken !== 'string') throw new DomainError(400, 'Use Firebase login and password reset');
    const admin = firebaseAuth();
    let decoded;
    // Revocation check skipped (network resilience); the auth_time freshness
    // window below already bounds token replay.
    try { decoded = await admin.verifyIdToken(data.idToken); }
    catch { throw new DomainError(401, 'Invalid Firebase login token'); }
    if (Date.now() / 1000 - decoded.auth_time > 300) throw new DomainError(401, 'Recent sign-in required');
    await getStore().transaction(async tx => {
      if (!await tx.get<Profile>('profiles', decoded.uid)) await tx.set('profiles', decoded.uid, { id: decoded.uid, username: decoded.email ?? decoded.uid, role: null, createdAt: new Date().toISOString() });
    });
    await setCookie(await firebaseAuth().createSessionCookie(data.idToken, { expiresIn: duration }));
    return sessionInfo();
  }
  if (action === 'reset-confirm') {
    if (typeof data.token !== 'string') throw new DomainError(400, 'Reset token required');
    const password = passwordValue(data.password);
    if (data.confirm !== undefined && data.confirm !== password) throw new DomainError(400, 'Passwords do not match');
    await getStore().transaction(async tx => {
      const reset = await tx.get<Reset>('resets', digest(data.token as string));
      if (!reset || reset.used || reset.expiresAt <= Date.now()) throw new DomainError(400, 'Reset token expired or already used');
      const old = await tx.get<Credential>('credentials', reset.userId);
      if (!old) throw new DomainError(400, 'Invalid reset token');
      const sessions = await tx.list<Session>('sessions');
      await tx.set('credentials', old.id, credentialFor(old.id, old.username, password));
      await tx.set('resets', reset.id, { ...reset, used: true });
      for (const session of sessions.filter(s => s.userId === old.id)) await tx.set('sessions', session.id, { ...session, revoked: true });
    });
    await setCookie('', 0);
    return sessionInfo();
  }
  const username = usernameValue(data.username);
  const id = userId(username);
  if (action === 'reset-request') {
    const token = randomBytes(32).toString('hex');
    await getStore().transaction(async tx => {
      if (!await tx.get<Credential>('credentials', id)) throw new DomainError(404, 'Demo account not found');
      await tx.set('resets', digest(token), { id: digest(token), userId: id, expiresAt: Date.now() + 15 * 60 * 1000, used: false });
    });
    return { ...await sessionInfo(), demoToken: token, demoResetToken: token, message: 'DEMO only: no email sent. Use this token within 15 minutes.' };
  }
  const password = passwordValue(data.password);
  if (action === 'signup' && data.confirm !== undefined && data.confirm !== password) throw new DomainError(400, 'Passwords do not match');
  let credential: Credential;
  if (action === 'signup' || action === 'migrate') {
    if (action === 'migrate') {
      const legacy = data.legacyRecord;
      const record = legacy && typeof legacy === 'object' ? legacy as Record<string, unknown> : null;
      const legacyPassword = typeof legacy === 'string' ? legacy : record?.password;
      if (legacyPassword !== password || (record?.username !== undefined && record.username !== username)) throw new DomainError(400, 'Legacy record and matching password required');
    }
    credential = credentialFor(id, username, password);
    await getStore().transaction(async tx => {
      if (await tx.get<Credential>('credentials', id)) throw new DomainError(409, 'Account already exists. Sign in instead.');
      await tx.set('credentials', id, credential);
      await tx.set('profiles', id, { id, username, role: null, createdAt: new Date().toISOString() });
    });
  } else if (action === 'login') {
    const found = await getStore().get<Credential>('credentials', id);
    if (!found || !matches(found, password)) throw new DomainError(401, 'Incorrect username or password');
    credential = found;
  } else throw new DomainError(400, 'Unknown auth action');
  await createSession(credential);
  return sessionInfo();
}
