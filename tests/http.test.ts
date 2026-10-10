import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import type { Drone, Order, Profile, Offer } from '../src/lib/domain';

// Opt in against an isolated demo server: AEROROUTE_TEST_URL=http://localhost:3000.
// Each run uses fresh account IDs and never assumes a preexisting user/password.
const baseUrl = process.env.AEROROUTE_TEST_URL;
type Session = { user: { id: string; username: string } | null; profile: Profile | null; mode: string; demoToken?: string };
class Client {
  cookie = '';
  async request<T>(path: string, method = 'GET', body?: unknown, origin?: string) {
    const headers = new Headers();
    if (this.cookie) headers.set('Cookie', this.cookie);
    if (method !== 'GET') {
      headers.set('Origin', origin ?? new URL(baseUrl!).origin);
      headers.set('Content-Type', 'application/json');
    }
    const response = await fetch(new URL(path, baseUrl), {
      method, headers, body: body === undefined ? undefined : JSON.stringify(body), redirect: 'manual',
    });
    const cookie = response.headers.get('set-cookie');
    if (cookie) this.cookie = cookie.split(';')[0];
    const text = await response.text();
    let data: T | null = null;
    try { data = JSON.parse(text) as T; } catch { /* Redirects return HTML, not JSON. */ }
    return { response, data };
  }
  async ok<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
    const result = await this.request<T>(path, method, body);
    assert.equal(result.response.status, 200, `${method} ${path}: ${JSON.stringify(result.data)}`);
    return result.data!;
  }
}

test('HTTP role redirects, authorization, offer privacy, acceptance race and delivery lifecycle', {
  skip: !baseUrl, timeout: 180000,
}, async () => {
  const unique = randomUUID().slice(0, 12);
  const customer = new Client(), stranger = new Client(), operatorA = new Client(), operatorB = new Client();
  const anonymous = new Client();
  const unauthorized = await anonymous.request('/api/orders');
  assert.equal(unauthorized.response.status, 401);
  assert.match(unauthorized.response.headers.get('cache-control') ?? '', /no-store/);
  const unauthRedirect = await anonymous.request('/customer');
  assert.equal(unauthRedirect.response.status, 307);
  assert.equal(unauthRedirect.response.headers.get('location'), '/login');
  const usernames = [`test-customer-${unique}`, `test-stranger-${unique}`, `test-operator-a-${unique}`, `test-operator-b-${unique}`];
  for (const [index, client] of [customer, stranger, operatorA, operatorB].entries()) {
    const session = await client.ok<Session>('/api/auth', 'POST', {
      action: 'signup', username: usernames[index], password: 'test-password',
    });
    assert.equal(session.mode, 'demo', 'HTTP tests require an explicitly isolated demo server');
    assert.equal(session.profile?.role, null);
    assert.ok(client.cookie.startsWith('aeroroute_session='));
    const roleRedirect = await client.request('/dashboard');
    assert.equal(roleRedirect.response.status, 307);
    assert.equal(roleRedirect.response.headers.get('location'), '/choose-role');
    assert.equal((await client.request('/api/orders')).response.status, 403);
    await client.ok('/api/profile/role', 'POST', { role: index < 2 ? 'customer' : 'operator' });
  }
  assert.equal((await customer.request('/api/profile/role', 'POST', { role: 'operator' })).response.status, 409);
  const reload = new Client(); reload.cookie = customer.cookie;
  assert.equal((await reload.ok<Session>('/api/session')).profile?.role, 'customer');
  const wrongDashboard = await customer.request('/operator');
  assert.equal(wrongDashboard.response.status, 307);
  assert.equal(wrongDashboard.response.headers.get('location'), '/customer');
  assert.equal((await customer.request('/api/drones')).response.status, 403);
  assert.equal((await operatorA.request('/api/offers')).response.status, 200);
  const csrf = await customer.request('/api/orders', 'POST', {}, 'https://untrusted.example');
  assert.equal(csrf.response.status, 403);

  const droneA = await operatorA.ok<Drone>('/api/drones', 'POST', { name: 'HTTP Drone Alpha', maxPayloadKg: 2 });
  const droneB = await operatorB.ok<Drone>('/api/drones', 'POST', { name: 'HTTP Drone Beta', maxPayloadKg: 2 });
  const order = await customer.ok<Order>('/api/orders', 'POST', {
    origin: 'Almaty, secret source 10', destination: 'Almaty, secret recipient 20',
    description: 'Private HTTP test parcel', weightKg: 0.5, priceKzt: 1,
  });
  assert.ok(order.priceKzt > 1);
  assert.equal(order.paymentStatus, 'unpaid');
  assert.equal((await stranger.request(`/api/orders/${order.id}`)).response.status, 403);
  assert.equal((await operatorA.request(`/api/orders/${order.id}`)).response.status, 403);
  assert.equal((await operatorA.request(`/api/orders/${order.id}/action`, 'POST', { action: 'accept', droneId: droneA.id })).response.status, 409);
  await customer.ok(`/api/orders/${order.id}/action`, 'POST', { action: 'pay' });
  const offers = await operatorA.ok<Offer[]>('/api/offers');
  const offer = offers.find((candidate) => candidate.id === order.id);
  assert.ok(offer);
  assert.deepEqual(Object.keys(offer).sort(), ['id', 'createdAt', 'weightKg', 'priceKzt', 'originArea', 'destinationArea'].sort());
  const acceptance = await Promise.all([
    operatorA.request<Order>(`/api/orders/${order.id}/action`, 'POST', { action: 'accept', droneId: droneA.id }),
    operatorB.request<Order>(`/api/orders/${order.id}/action`, 'POST', { action: 'accept', droneId: droneB.id }),
  ]);
  assert.deepEqual(acceptance.map((result) => result.response.status).sort(), [200, 409]);
  const winner = acceptance[0].response.status === 200 ? operatorA : operatorB;
  const loser = winner === operatorA ? operatorB : operatorA;
  assert.equal((await loser.request(`/api/orders/${order.id}`)).response.status, 403);
  for (const status of ['picked_up', 'in_transit', 'delivered']) {
    const advanced = await winner.ok<Order>(`/api/orders/${order.id}/action`, 'POST', { action: 'advance', status });
    assert.equal(advanced.deliveryStatus, status);
    assert.equal(advanced.paymentStatus, 'demo_held');
  }
  assert.equal((await winner.request(`/api/orders/${order.id}/action`, 'POST', { action: 'confirm' })).response.status, 403);
  const received = await customer.ok<Order>(`/api/orders/${order.id}/action`, 'POST', { action: 'confirm' });
  assert.equal(received.deliveryStatus, 'received');
  assert.equal(received.paymentStatus, 'demo_released');

  assert.equal((await customer.request(`/api/orders/${order.id}/action`, 'POST', { action: 'confirm' })).response.status, 409);
  assert.equal((await winner.request(`/api/orders/${order.id}/action`, 'POST', { action: 'advance', status: 'picked_up' })).response.status, 409);
});
