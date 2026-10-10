import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';

const base = process.env.BASE_URL || process.env.AEROROUTE_TEST_URL || 'http://localhost:3000';
const origin = new URL(base).origin;
let cookie = '';
async function request(path, data, options = {}) {
  const headers = { ...(cookie ? { Cookie: cookie } : {}) };
  if (data !== undefined) Object.assign(headers, { 'Content-Type': 'application/json', Origin: origin });
  Object.assign(headers, options.headers || {});
  const response = await fetch(base + path, { method: data === undefined ? 'GET' : 'POST', headers, body: data === undefined ? undefined : JSON.stringify(data), redirect: 'manual' });
  const setCookie = response.headers.get('set-cookie');
  if (setCookie) cookie = setCookie.split(';')[0];
  return { status: response.status, data: await response.json(), response, setCookie };
}
const username = `auth-test-${Date.now()}-${Math.random().toString(16).slice(2)}`;
const password = 'test-password';
let result = await request('/api/session');
assert.equal(result.data.mode, 'demo', 'These tests require explicit demo mode');
assert.equal(result.data.user, null);
assert.match(result.response.headers.get('cache-control'), /no-store/);
assert.equal((await request('/api/orders')).status, 401);
assert.equal((await request('/api/auth', { action: 'signup', username, password }, { headers: { Origin: 'https://attacker.invalid' } })).status, 403);
result = await request('/api/auth', { action: 'signup', username, password });
assert.equal(result.status, 200);
const identity = result.data.user.id;
assert.equal(result.data.profile.role, null);
assert.match(result.setCookie, /HttpOnly/i);
assert.match(result.setCookie, /SameSite=lax/i);
assert.equal((await request('/api/session')).data.user.id, identity, 'Session survives a fresh request');
assert.equal((await request('/api/orders')).status, 403, 'Role-less users cannot access deliveries');
assert.equal((await request('/api/profile/role', { role: 'administrator' })).status, 400);
assert.equal((await request('/api/profile/role', { role: 'customer' })).status, 200);
assert.equal((await request('/api/profile/role', { role: 'operator' })).status, 409);
assert.equal((await request('/api/offers')).status, 403);
assert.equal((await request('/api/drones')).status, 403);
const firstCookie = cookie;
assert.equal((await request('/api/auth', { action: 'logout' })).status, 200);
cookie = firstCookie;
assert.equal((await request('/api/session')).data.user, null, 'Logged out server session is revoked');
cookie = '';
assert.equal((await request('/api/auth', { action: 'login', username, password: 'wrong-password' })).status, 401);
result = await request('/api/auth', { action: 'login', username, password });
assert.equal(result.data.profile.role, 'customer');
const beforeReset = cookie;
result = await request('/api/auth', { action: 'reset-request', username });
assert.match(result.data.message, /DEMO/);
const token = result.data.demoToken;
assert.equal(typeof token, 'string');
assert.equal((await request('/api/auth', { action: 'reset-confirm', token, password: 'replacement-password' })).status, 200);
cookie = beforeReset;
assert.equal((await request('/api/session')).data.user, null, 'Password reset revokes pre-existing sessions');
assert.equal((await request('/api/auth', { action: 'reset-confirm', token, password })).status, 400, 'Reset token is single use');
cookie = '';
assert.equal((await request('/api/auth', { action: 'login', username, password })).status, 401);
assert.equal((await request('/api/auth', { action: 'login', username, password: 'replacement-password' })).status, 200);
if (process.env.AEROROUTE_AUTH_TEST_STORE) {
  // Explicitly supplied isolated server fixture only; no production store access.
  const file = process.env.AEROROUTE_AUTH_TEST_STORE;
  const store = JSON.parse(await readFile(file, 'utf8'));
  const sessionId = createHash('sha256').update(cookie.slice(cookie.indexOf('=') + 1)).digest('hex');
  assert.ok(store.sessions[sessionId]);
  store.sessions[sessionId].expiresAt = Date.now() - 1000;
  await writeFile(file, JSON.stringify(store));
  assert.equal((await request('/api/session')).data.user, null, 'Expired server session is rejected');
  assert.equal((await request('/api/auth', { action: 'login', username, password: 'replacement-password' })).status, 200);
}
assert.equal((await request('/api/auth', { action: 'migrate', username, password, legacyRecord: password })).status, 409, 'Legacy migration cannot overwrite credentials');
await request('/api/auth', { action: 'logout' });
for (const legacyRecord of [password, { password, role: 'operator', farmId: 'legacy-farm' }]) {
  const legacyUsername = `${username}-legacy-${typeof legacyRecord}`;
  assert.equal((await request('/api/auth', { action: 'migrate', username: legacyUsername, password, legacyRecord })).status, 200);
  assert.equal((await request('/api/session')).data.profile.role, null, 'Legacy role is never trusted');
  await request('/api/auth', { action: 'logout' });
}
assert.equal((await request('/api/auth', { action: 'migrate', username: username + '-forged', password, legacyRecord: { password: 'different' } })).status, 400);
cookie = 'aeroroute_session=invalid-or-expired-token';
assert.equal((await request('/api/session')).data.user, null);
console.log('Auth HTTP checks passed: signup/login/reload/logout, migration, role isolation, reset/replay, cookie/origin guards.' + (process.env.AEROROUTE_AUTH_TEST_STORE ? ' Expired server session checked.' : ' Expiration boundary skipped: set AEROROUTE_AUTH_TEST_STORE to isolated server fixture.'));
