import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import type { Drone, Order, Profile, Offer } from '../src/lib/domain';

// Opt in against an isolated demo server: AEROROUTE_TEST_URL=http://localhost:3000.
// Each run uses fresh account IDs and never assumes a preexisting user/password.
const baseUrl = process.env.AEROROUTE_TEST_URL;
type Session = {
  user: { id: string; username: string } | null;
  profile: Profile | null;
  mode: string;
  demoToken?: string;
};
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
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      redirect: 'manual',
    });
    const cookie = response.headers.get('set-cookie');
    if (cookie) this.cookie = cookie.split(';')[0];
    const text = await response.text();
    let data: T | null = null;
    try {
      data = JSON.parse(text) as T;
    } catch {
      /* Redirects return HTML, not JSON. */
    }
    return { response, data, text };
  }
  async ok<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
    const result = await this.request<T>(path, method, body);
    assert.equal(result.response.status, 200, `${method} ${path}: ${JSON.stringify(result.data)}`);
    return result.data!;
  }
}

test('headers reflect the server session through sign-in, role choice and sign-out', {
  skip: !baseUrl,
  timeout: 180000,
}, async () => {
  const header = async (client: Client, path = '/') => {
    const result = await client.request(path);
    assert.equal(result.response.status, 200);
    const match = result.text.match(/<header\b[^>]*>([\s\S]*?)<\/header>/);
    assert.ok(match, `Missing header on ${path}`);
    assert.match(match[1], /src="\/logo_without_name\.png"/);
    return match[1];
  };
  const anonymous = new Client();
  assert.match(await header(anonymous), /Sign in/);
  assert.doesNotMatch(await header(anonymous), /My dashboard/);
  const logo = await anonymous.request('/logo_without_name.png');
  assert.equal(logo.response.status, 200);
  assert.match(logo.response.headers.get('content-type') ?? '', /image\/png/);

  for (const role of ['customer', 'operator'] as const) {
    const account = new Client();
    const username = `header-${role}-${randomUUID().slice(0, 12)}`;
    const credentials = { username, password: 'test-password' };
    await account.ok('/api/auth', 'POST', { action: 'signup', ...credentials });
    const beforeRole = await header(account);
    assert.match(beforeRole, new RegExp(username));
    assert.match(beforeRole, /My dashboard/);
    assert.doesNotMatch(beforeRole, /Sign in/);
    assert.match(await header(account, '/choose-role'), /Choose your role/);
    await account.ok('/api/profile/role', 'POST', { role });

    const signedIn = new Client();
    await signedIn.ok('/api/auth', 'POST', { action: 'login', ...credentials });
    const homeHeader = await header(signedIn);
    assert.match(homeHeader, new RegExp(username));
    assert.match(homeHeader, /href="\/dashboard"/);
    assert.doesNotMatch(homeHeader, /Sign in/);
    const dashboardHeader = await header(signedIn, '/' + role);
    assert.match(dashboardHeader, new RegExp(`${role === 'customer' ? 'Customer' : 'Operator'} dashboard`));
    assert.match(dashboardHeader, /Sign out/);
    await signedIn.ok('/api/auth', 'POST', { action: 'logout' });
    const signedOutHeader = await header(signedIn);
    assert.match(signedOutHeader, /Sign in/);
    assert.doesNotMatch(signedOutHeader, new RegExp(username));
    assert.doesNotMatch(signedOutHeader, /My dashboard/);
  }
});

test(
  'HTTP role redirects, authorization, offer privacy, acceptance race and delivery lifecycle',
  {
    skip: !baseUrl,
    timeout: 180000,
  },
  async () => {
    const unique = randomUUID().slice(0, 12);
    const customer = new Client(),
      stranger = new Client(),
      operatorA = new Client(),
      operatorB = new Client();
    const anonymous = new Client();
    const unauthorized = await anonymous.request('/api/orders');
    assert.equal(unauthorized.response.status, 401);
    assert.match(unauthorized.response.headers.get('cache-control') ?? '', /no-store/);
    const unauthRedirect = await anonymous.request('/customer');
    assert.equal(unauthRedirect.response.status, 307);
    assert.equal(unauthRedirect.response.headers.get('location'), '/login');
    const usernames = [
      `test-customer-${unique}`,
      `test-stranger-${unique}`,
      `test-operator-a-${unique}`,
      `test-operator-b-${unique}`,
    ];
    for (const [index, client] of [customer, stranger, operatorA, operatorB].entries()) {
      const session = await client.ok<Session>('/api/auth', 'POST', {
        action: 'signup',
        username: usernames[index],
        password: 'test-password',
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
    assert.equal(
      (await customer.request('/api/profile/role', 'POST', { role: 'operator' })).response.status,
      409,
    );
    const reload = new Client();
    reload.cookie = customer.cookie;
    assert.equal((await reload.ok<Session>('/api/session')).profile?.role, 'customer');
    const wrongDashboard = await customer.request('/operator');
    assert.equal(wrongDashboard.response.status, 307);
    assert.equal(wrongDashboard.response.headers.get('location'), '/customer');
    assert.equal((await customer.request('/api/drones')).response.status, 403);
    assert.equal((await operatorA.request('/api/offers')).response.status, 200);
    const csrf = await customer.request('/api/orders', 'POST', {}, 'https://untrusted.example');
    assert.equal(csrf.response.status, 403);

    const droneA = await operatorA.ok<Drone>('/api/drones', 'POST', {
      droneModel: 'HTTP Drone Alpha',
      serialNumber: `SN-${unique}-A`,
      registrationNumber: `REG-${unique}-A`,
      maxPayloadKg: 2,
    });
    const droneB = await operatorB.ok<Drone>('/api/drones', 'POST', {
      droneModel: 'HTTP Drone Beta',
      serialNumber: `SN-${unique}-B`,
      registrationNumber: `REG-${unique}-B`,
      maxPayloadKg: 2,
    });
    const order = await customer.ok<Order>('/api/orders', 'POST', {
      origin: 'Almaty, secret source 10',
      destination: 'Almaty, secret recipient 20',
      packageDescription: 'Private HTTP test parcel',
      packageWeightKg: 0.5,
      priceAmount: 1,
    });
    assert.equal(order.priceAmount, 0.065);
    assert.equal(order.priceCurrency, 'SOL');
    assert.equal(order.paymentStatus, 'pending');
    assert.equal((await stranger.request(`/api/orders/${order.id}`)).response.status, 403);
    assert.equal((await operatorA.request(`/api/orders/${order.id}`)).response.status, 403);
    assert.equal(
      (
        await operatorA.request(`/api/orders/${order.id}/action`, 'POST', {
          action: 'accept',
          droneId: droneA.id,
        })
      ).response.status,
      409,
    );
    await customer.ok(`/api/orders/${order.id}/action`, 'POST', { action: 'pay' });
    const offers = await operatorA.ok<Offer[]>('/api/offers');
    const offer = offers.find((candidate) => candidate.id === order.id);
    assert.ok(offer);
    assert.deepEqual(
      Object.keys(offer).sort(),
      ['id', 'createdAt', 'packageWeightKg', 'priceAmount', 'originArea', 'destinationArea'].sort(),
    );
    const acceptance = await Promise.all([
      operatorA.request<Order>(`/api/orders/${order.id}/action`, 'POST', {
        action: 'accept',
        droneId: droneA.id,
      }),
      operatorB.request<Order>(`/api/orders/${order.id}/action`, 'POST', {
        action: 'accept',
        droneId: droneB.id,
      }),
    ]);
    assert.deepEqual(acceptance.map((result) => result.response.status).sort(), [200, 409]);
    const winner = acceptance[0].response.status === 200 ? operatorA : operatorB;
    const loser = winner === operatorA ? operatorB : operatorA;
    assert.equal((await loser.request(`/api/orders/${order.id}`)).response.status, 403);
    for (const status of ['in_transit', 'delivered']) {
      const advanced = await winner.ok<Order>(`/api/orders/${order.id}/action`, 'POST', {
        action: 'advance',
        status,
      });
      assert.equal(advanced.status, status);
      assert.equal(advanced.paymentStatus, 'locked');
    }
    assert.equal(
      (await winner.request(`/api/orders/${order.id}/action`, 'POST', { action: 'confirm' }))
        .response.status,
      403,
    );
    const received = await customer.ok<Order>(`/api/orders/${order.id}/action`, 'POST', {
      action: 'confirm',
    });
    assert.equal(received.status, 'delivered');
    assert.equal(received.paymentStatus, 'completed');
    assert.ok(received.receiptConfirmedAt);

    assert.equal(
      (await customer.request(`/api/orders/${order.id}/action`, 'POST', { action: 'confirm' }))
        .response.status,
      409,
    );
    assert.equal(
      (
        await winner.request(`/api/orders/${order.id}/action`, 'POST', {
          action: 'advance',
          status: 'pending',
        })
      ).response.status,
      409,
    );
  },
);
