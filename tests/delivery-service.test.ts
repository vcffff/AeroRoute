import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DeliveryService } from '../src/lib/service';
import type { Profile, Order, OrderInput } from '../src/lib/domain';
import type { Repository, Transaction } from '../src/lib/repository';
import type { PaymentAdapter } from '../src/lib/payments';

/** Isolated transaction store with rollback and serialization, like the demo adapter. */
class MemoryRepository implements Repository {
  private records = new Map<string, Map<string, unknown>>();
  private pending: Promise<void> = Promise.resolve();

  seed(collection: string, id: string, value: unknown) {
    const records = this.records.get(collection) ?? new Map<string, unknown>();
    records.set(id, structuredClone(value));
    this.records.set(collection, records);
  }

  async get<T>(collection: string, id: string): Promise<T | null> {
    const value = this.records.get(collection)?.get(id);
    return value === undefined ? null : structuredClone(value) as T;
  }

  async list<T>(collection: string): Promise<T[]> {
    return structuredClone([...this.records.get(collection)?.values() ?? []]) as T[];
  }

  async transaction<T>(work: (tx: Transaction) => Promise<T>): Promise<T> {
    const previous = this.pending;
    let unlock!: () => void;
    this.pending = new Promise<void>((resolve) => { unlock = resolve; });
    await previous;
    const working = structuredClone(this.records);
    const tx: Transaction = {
      get: async <V>(collection: string, id: string): Promise<V | null> => {
        const value = working.get(collection)?.get(id);
        return value === undefined ? null : structuredClone(value) as V;
      },
      list: async <V>(collection: string): Promise<V[]> =>
        structuredClone([...working.get(collection)?.values() ?? []]) as V[],
      set: async (collection: string, id: string, value: unknown) => {
        const records = working.get(collection) ?? new Map<string, unknown>();
        records.set(id, structuredClone(value));
        working.set(collection, records);
      },
    };
    try {
      const result = await work(tx);
      this.records = working;
      return result;
    } finally { unlock(); }
  }
}

function fixture() {
  const repository = new MemoryRepository();
  for (const [id, role] of [
    ['customer', 'customer'], ['other-customer', 'customer'],
    ['operator', 'operator'], ['other-operator', 'operator'], ['undecided', null],
  ] as const) {
    const profile: Profile = { id, username: id, role, createdAt: new Date().toISOString() };
    repository.seed('profiles', id, profile);
  }
  const calls = { hold: 0, release: 0 };
  const payments: PaymentAdapter = {
    mode: 'demo',
    hold: async () => { calls.hold++; return 'demo_held'; },
    release: async () => { calls.release++; return 'demo_released'; },
  };
  return { repository, service: new DeliveryService(repository, payments), calls };
}

const input = {
  origin: 'Almaty, Abay avenue 10, apartment 25',
  destination: 'Almaty, Dostyk avenue 20, apartment 41',
  description: 'Private documents in a sealed envelope', weightKg: 0.5,
};
const droneInput = { name: 'Courier One', maxPayloadKg: 2 };

async function rejectsStatus(action: Promise<unknown>, status: number) {
  await assert.rejects(action, (error: unknown) => {
    assert.equal((error as { status?: number }).status, status);
    return true;
  });
}

async function acceptedOrder(f: ReturnType<typeof fixture>) {
  const drone = await f.service.addDrone('operator', droneInput);
  const order = await f.service.createOrder('customer', input);
  await f.service.pay('customer', order.id);
  return f.service.accept('operator', order.id, drone.id);
}

test('role selection is one-time and users without a role cannot use either dashboard', async () => {
  const { service } = fixture();
  for (const action of [
    () => service.orders('undecided'), () => service.offers('undecided'), () => service.drones('undecided'),
    () => service.createOrder('undecided', input), () => service.addDrone('undecided', droneInput),
  ]) await rejectsStatus(action(), 403);
  await rejectsStatus(service.chooseRole('undecided', 'admin' as 'customer'), 400);
  assert.equal((await service.chooseRole('undecided', 'customer')).role, 'customer');
  await rejectsStatus(service.chooseRole('undecided', 'operator'), 409);
  assert.equal((await service.profile('undecided')).role, 'customer');
  assert.equal((await service.chooseRole('undecided', 'customer')).role, 'customer');
});

test('two concurrent role selections cannot change or overwrite the winning role', async () => {
  const { service } = fixture();
  const results = await Promise.allSettled([
    service.chooseRole('undecided', 'customer'), service.chooseRole('undecided', 'operator'),
  ]);
  assert.equal(results.filter((r) => r.status === 'fulfilled').length, 1);
  const rejected = results.find((r) => r.status === 'rejected');
  assert.equal(rejected?.status === 'rejected' && rejected.reason.status, 409);
});

test('creation validates addresses, description and supported weights before saving', async () => {
  const { service, repository } = fixture();
  for (const invalid of [
    { origin: '' }, { origin: '   ' }, { destination: '' }, { description: '' },
    { weightKg: 0 }, { weightKg: -1 }, { weightKg: Number.NaN },
    { weightKg: Number.POSITIVE_INFINITY }, { weightKg: 5.001 }, { weightKg: 10000 },
    { weightKg: 'not-a-weight' },
    { destination: input.origin }, { description: 'x'.repeat(1001) }, { origin: 'x'.repeat(241) },
  ]) await rejectsStatus(service.createOrder('customer', { ...input, ...invalid } as OrderInput), 400);
  assert.deepEqual(await repository.list('orders'), []);
  await rejectsStatus(service.createOrder('operator', input), 403);
});

test('the server derives price and ownership and creates unpaid orders', async () => {
  const { service } = fixture();
  const tampered = {
    ...input, priceKzt: 1, customerId: 'other-customer', operatorId: 'operator',
    deliveryStatus: 'searching', paymentStatus: 'demo_held',
  };
  const a = await service.createOrder('customer', tampered);
  const otherPrice = { ...input, priceKzt: 999999999 };
  const b = await service.createOrder('customer', otherPrice);
  assert.ok(a.priceKzt > 0);
  assert.equal(a.priceKzt, b.priceKzt);
  assert.equal(a.customerId, 'customer');
  assert.equal(a.operatorId, null);
  assert.equal(a.deliveryStatus, 'awaiting_payment');
  assert.equal(a.paymentStatus, 'unpaid');
});

test('payment must be confirmed before an order is offered or accepted', async () => {
  const { service, calls } = fixture();
  const drone = await service.addDrone('operator', droneInput);
  const order = await service.createOrder('customer', input);
  assert.deepEqual(await service.offers('operator'), []);
  await rejectsStatus(service.accept('operator', order.id, drone.id), 409);
  await rejectsStatus(service.pay('operator', order.id), 403);
  await rejectsStatus(service.pay('other-customer', order.id), 403);
  assert.equal(calls.hold, 0);
  const paid = await service.pay('customer', order.id);
  assert.equal(paid.paymentStatus, 'demo_held');
  assert.equal(paid.deliveryStatus, 'searching');
  assert.equal(calls.hold, 1);
  assert.equal((await service.offers('operator')).length, 1);
});

test('offers expose only the public allowlist and no exact addresses or private payload', async () => {
  const { service } = fixture();
  const order = await service.createOrder('customer', input);
  await service.pay('customer', order.id);
  const offers = await service.offers('operator');
  assert.equal(offers.length, 1);
  assert.deepEqual(Object.keys(offers[0]).sort(),
    ['id', 'weightKg', 'priceKzt', 'createdAt', 'originArea', 'destinationArea'].sort());
  const serialized = JSON.stringify(offers);
  for (const secret of [input.origin, input.destination, input.description, 'apartment']) {
    assert.equal(serialized.includes(secret), false, `offer leaked ${secret}`);
  }
  await rejectsStatus(service.offers('customer'), 403);
  await rejectsStatus(service.order('operator', order.id), 403);
});

test('customers and operators can list and read only their own orders', async () => {
  const f = fixture();
  const owned = await acceptedOrder(f);
  const other = await f.service.createOrder('other-customer', input);
  assert.deepEqual((await f.service.orders('customer')).map((o) => o.id), [owned.id]);
  assert.deepEqual((await f.service.orders('operator')).map((o) => o.id), [owned.id]);
  assert.deepEqual(await f.service.orders('other-operator'), []);
  await rejectsStatus(f.service.order('other-customer', owned.id), 403);
  await rejectsStatus(f.service.order('other-operator', owned.id), 403);
  await rejectsStatus(f.service.order('customer', other.id), 403);
  assert.equal((await f.service.order('operator', owned.id)).description, input.description);
});

test('drone creation and listing enforce operator role and payload validation', async () => {
  const { service } = fixture();
  await rejectsStatus(service.addDrone('customer', droneInput), 403);
  await rejectsStatus(service.drones('customer'), 403);
  for (const invalid of [{ name: '' }, { maxPayloadKg: 0 }, { maxPayloadKg: -1 },
    { maxPayloadKg: Number.NaN }, { maxPayloadKg: 10000 }]) {
    await rejectsStatus(service.addDrone('operator', { ...droneInput, ...invalid }), 400);
  }
  const tampered = { ...droneInput, operatorId: 'other-operator' };
  const drone = await service.addDrone('operator', tampered);
  assert.equal(drone.operatorId, 'operator');
  assert.equal(drone.active, true);
  assert.deepEqual((await service.drones('operator')).map((d) => d.id), [drone.id]);
  assert.deepEqual(await service.drones('other-operator'), []);
});

test('acceptance requires an owned, active drone able to carry the parcel', async () => {
  const { service, repository } = fixture();
  const order = await service.createOrder('customer', input);
  await service.pay('customer', order.id);
  const foreign = await service.addDrone('other-operator', droneInput);
  const tooSmall = await service.addDrone('operator', { ...droneInput, maxPayloadKg: 0.1 });
  const inactive = await service.addDrone('operator', droneInput);
  repository.seed('drones', inactive.id, { ...inactive, active: false });
  await rejectsStatus(service.accept('customer', order.id, foreign.id), 403);
  await rejectsStatus(service.accept('operator', order.id, foreign.id), 403);
  await rejectsStatus(service.accept('operator', order.id, tooSmall.id), 409);
  await rejectsStatus(service.accept('operator', order.id, inactive.id), 409);
  assert.equal((await service.order('customer', order.id)).deliveryStatus, 'searching');
});

test('concurrent acceptance by different operators has exactly one winner and one conflict', async () => {
  const { service } = fixture();
  const drones = await Promise.all([
    service.addDrone('operator', droneInput), service.addDrone('other-operator', droneInput),
  ]);
  const order = await service.createOrder('customer', input);
  await service.pay('customer', order.id);
  const results = await Promise.allSettled([
    service.accept('operator', order.id, drones[0].id),
    service.accept('other-operator', order.id, drones[1].id),
  ]);
  const fulfilled = results.filter((r) => r.status === 'fulfilled');
  const rejected = results.filter((r) => r.status === 'rejected');
  assert.equal(fulfilled.length, 1);
  assert.equal(rejected.length, 1);
  assert.equal(rejected[0].reason.status, 409);
  const stored = await service.order('customer', order.id);
  assert.equal(stored.deliveryStatus, 'accepted');
  assert.equal(stored.operatorId, fulfilled[0].value.operatorId);
  assert.equal(stored.events.filter((event) => event.status === 'accepted').length, 1);
  assert.equal((await service.offers('operator')).length, 0);
});

test('one drone cannot be assigned concurrently to two active deliveries', async () => {
  const { service } = fixture();
  const drone = await service.addDrone('operator', droneInput);
  const orders = await Promise.all([
    service.createOrder('customer', input), service.createOrder('other-customer', input),
  ]);
  await Promise.all([service.pay('customer', orders[0].id), service.pay('other-customer', orders[1].id)]);
  const results = await Promise.allSettled(orders.map((order) => service.accept('operator', order.id, drone.id)));
  assert.equal(results.filter((result) => result.status === 'fulfilled').length, 1);
  const rejected = results.find((result) => result.status === 'rejected');
  assert.equal(rejected?.status === 'rejected' && rejected.reason.status, 409);
  assert.equal((await service.orders('operator')).length, 1);
  assert.equal((await service.offers('other-operator')).length, 1);
});

test('delivery transitions are sequential and only the assigned operator can advance', async () => {
  const f = fixture();
  const order = await acceptedOrder(f);
  await rejectsStatus(f.service.advance('customer', order.id, 'picked_up'), 403);
  await rejectsStatus(f.service.advance('other-operator', order.id, 'picked_up'), 403);
  await rejectsStatus(f.service.advance('operator', order.id, 'delivered'), 409);
  await rejectsStatus(f.service.advance('operator', order.id, 'searching'), 409);
  await rejectsStatus(f.service.advance('operator', order.id, 'received'), 409);
  for (const status of ['picked_up', 'in_transit', 'delivered'] as const) {
    const updated = await f.service.advance('operator', order.id, status);
    assert.equal(updated.deliveryStatus, status);
    assert.equal(updated.paymentStatus, 'demo_held');
    assert.equal(updated.events.at(-1)?.actorId, 'operator');
    assert.equal(updated.events.at(-1)?.status, status);
    await rejectsStatus(f.service.advance('operator', order.id, status), 409);
  }
  assert.equal(f.calls.release, 0);
});

test('only the owning customer can confirm delivered parcels and release held payment', async () => {
  const f = fixture();
  const order = await acceptedOrder(f);
  await rejectsStatus(f.service.confirmReceipt('customer', order.id), 409);
  await rejectsStatus(f.service.confirmReceipt('operator', order.id), 403);
  for (const status of ['picked_up', 'in_transit', 'delivered'] as const) {
    await f.service.advance('operator', order.id, status);
  }
  await rejectsStatus(f.service.confirmReceipt('operator', order.id), 403);
  await rejectsStatus(f.service.confirmReceipt('other-customer', order.id), 403);
  assert.equal(f.calls.release, 0);
  const received = await f.service.confirmReceipt('customer', order.id);
  assert.equal(received.deliveryStatus, 'received');
  assert.equal(received.paymentStatus, 'demo_released');
  assert.equal(received.events.at(-1)?.actorId, 'customer');
  assert.equal(f.calls.release, 1);
  await rejectsStatus(f.service.confirmReceipt('customer', order.id), 409);
  assert.equal(f.calls.release, 1);
});

test('repeated or concurrent payments do not hold funds twice', async () => {
  const { service, calls } = fixture();
  const order = await service.createOrder('customer', input);
  const results = await Promise.allSettled([
    service.pay('customer', order.id), service.pay('customer', order.id),
  ]);
  assert.equal(results.filter((r) => r.status === 'fulfilled').length, 1);
  const rejected = results.find((r) => r.status === 'rejected');
  assert.equal(rejected?.status === 'rejected' && rejected.reason.status, 409);
  await rejectsStatus(service.pay('customer', order.id), 409);
  assert.equal(calls.hold, 1);
});

test('concurrent receipt confirmations release payment exactly once', async () => {
  const f = fixture();
  const order = await acceptedOrder(f);
  for (const status of ['picked_up', 'in_transit', 'delivered'] as const) {
    await f.service.advance('operator', order.id, status);
  }
  const results = await Promise.allSettled([
    f.service.confirmReceipt('customer', order.id), f.service.confirmReceipt('customer', order.id),
  ]);
  assert.equal(results.filter((result) => result.status === 'fulfilled').length, 1);
  const rejected = results.find((result) => result.status === 'rejected');
  assert.equal(rejected?.status === 'rejected' && rejected.reason.status, 409);
  assert.equal(f.calls.release, 1);
  assert.equal((await f.service.order('customer', order.id)).events.filter((event) => event.status === 'received').length, 1);
});

test('failed payment or release adapters leave order state unchanged', async () => {
  const f = fixture();
  const unavailable: PaymentAdapter = {
    mode: 'unconfigured', hold: async () => { throw new Error('Escrow not configured'); },
    release: async () => { throw new Error('Escrow not configured'); },
  };
  const service = new DeliveryService(f.repository, unavailable);
  const unpaid = await service.createOrder('customer', input);
  await assert.rejects(service.pay('customer', unpaid.id));
  const stillUnpaid = await service.order('customer', unpaid.id);
  assert.equal(stillUnpaid.paymentStatus, 'unpaid');
  assert.equal(stillUnpaid.deliveryStatus, 'awaiting_payment');
  const accepted = await acceptedOrder(f);
  for (const status of ['picked_up', 'in_transit', 'delivered'] as const) {
    await f.service.advance('operator', accepted.id, status);
  }
  await assert.rejects(service.confirmReceipt('customer', accepted.id));
  const stillDelivered: Order = await service.order('customer', accepted.id);
  assert.equal(stillDelivered.deliveryStatus, 'delivered');
  assert.equal(stillDelivered.paymentStatus, 'demo_held');
});
