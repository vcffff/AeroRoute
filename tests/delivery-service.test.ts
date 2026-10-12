import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DeliveryService } from '../src/lib/service';
import { DemoEscrowPayments } from '../src/lib/payments';
import type { Profile, Order, OrderInput, OrderStatus } from '../src/lib/domain';
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
    return value === undefined ? null : (structuredClone(value) as T);
  }

  async list<T>(collection: string): Promise<T[]> {
    return structuredClone([...(this.records.get(collection)?.values() ?? [])]) as T[];
  }

  async transaction<T>(work: (tx: Transaction) => Promise<T>): Promise<T> {
    const previous = this.pending;
    let unlock!: () => void;
    this.pending = new Promise<void>((resolve) => {
      unlock = resolve;
    });
    await previous;
    const working = structuredClone(this.records);
    const tx: Transaction = {
      get: async <V>(collection: string, id: string): Promise<V | null> => {
        const value = working.get(collection)?.get(id);
        return value === undefined ? null : (structuredClone(value) as V);
      },
      list: async <V>(collection: string): Promise<V[]> =>
        structuredClone([...(working.get(collection)?.values() ?? [])]) as V[],
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
    } finally {
      unlock();
    }
  }
}

function fixture(payments?: PaymentAdapter) {
  const repository = new MemoryRepository();
  for (const [id, role] of [
    ['customer', 'customer'],
    ['other-customer', 'customer'],
    ['operator', 'operator'],
    ['other-operator', 'operator'],
    ['undecided', null],
  ] as const) {
    const profile: Profile = { id, username: id, role, createdAt: new Date().toISOString() };
    repository.seed('profiles', id, profile);
  }
  const calls = { hold: 0, release: 0, refund: 0 };
  const fake: PaymentAdapter = {
    mode: 'demo',
    hold: async () => {
      calls.hold++;
      return 'payment-1';
    },
    release: async () => {
      calls.release++;
    },
    refund: async () => {
      calls.refund++;
    },
  };
  return { repository, service: new DeliveryService(repository, payments ?? fake), calls };
}

const input = {
  origin: 'Almaty, Abay avenue 10, apartment 25',
  destination: 'Almaty, Dostyk avenue 20, apartment 41',
  packageDescription: 'Private documents in a sealed envelope',
  packageWeightKg: 0.5,
};
const droneInput = {
  droneModel: 'Courier One',
  serialNumber: 'SN-0000001',
  registrationNumber: 'REG-0000001',
  maxPayloadKg: 2,
};

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
    () => service.orders('undecided'),
    () => service.offers('undecided'),
    () => service.drones('undecided'),
    () => service.createOrder('undecided', input),
    () => service.addDrone('undecided', droneInput),
  ])
    await rejectsStatus(action(), 403);
  await rejectsStatus(service.chooseRole('undecided', 'admin' as 'customer'), 400);
  assert.equal((await service.chooseRole('undecided', 'customer')).role, 'customer');
  await rejectsStatus(service.chooseRole('undecided', 'operator'), 409);
  assert.equal((await service.profile('undecided')).role, 'customer');
  assert.equal((await service.chooseRole('undecided', 'customer')).role, 'customer');
});

test('two concurrent role selections cannot change or overwrite the winning role', async () => {
  const { service } = fixture();
  const results = await Promise.allSettled([
    service.chooseRole('undecided', 'customer'),
    service.chooseRole('undecided', 'operator'),
  ]);
  assert.equal(results.filter((r) => r.status === 'fulfilled').length, 1);
  const rejected = results.find((r) => r.status === 'rejected');
  assert.equal(rejected?.status === 'rejected' && rejected.reason.status, 409);
});

test('creation validates addresses, description and supported weights before saving', async () => {
  const { service, repository } = fixture();
  for (const invalid of [
    { origin: '' },
    { origin: '   ' },
    { destination: '' },
    { packageDescription: '' },
    { packageWeightKg: 0 },
    { packageWeightKg: -1 },
    { packageWeightKg: Number.NaN },
    { packageWeightKg: Number.POSITIVE_INFINITY },
    { packageWeightKg: 5.001 },
    { packageWeightKg: 10000 },
    { packageWeightKg: 'not-a-weight' },
    { destination: input.origin },
    { packageDescription: 'x'.repeat(1001) },
    { origin: 'x'.repeat(241) },
    { priorityLevel: 'overnight' },
    { originLat: 'north' },
  ])
    await rejectsStatus(
      service.createOrder('customer', { ...input, ...invalid } as unknown as OrderInput),
      400,
    );
  assert.deepEqual(await repository.list('orders'), []);
  assert.deepEqual(await repository.list('addresses'), []);
  await rejectsStatus(service.createOrder('operator', input), 403);
});

test('the server derives price, order number, addresses and ownership for unpaid orders', async () => {
  const { service, repository } = fixture();
  const tampered = {
    ...input,
    priceAmount: 1,
    customerId: 'other-customer',
    operatorId: 'operator',
    status: 'delivered',
    paymentStatus: 'completed',
  };
  const a = await service.createOrder('customer', tampered);
  const otherPrice = { ...input, priceAmount: 999999999 };
  const b = await service.createOrder('customer', otherPrice);
  assert.ok(a.priceAmount > 0);
  assert.equal(a.priceAmount, b.priceAmount);
  assert.equal(a.customerId, 'customer');
  assert.equal(a.operatorId, null);
  assert.equal(a.status, 'pending');
  assert.equal(a.paymentStatus, 'pending');
  assert.match(a.orderNumber, /^AR-\d{8}-[A-Z0-9]{6}$/);
  assert.notEqual(a.orderNumber, b.orderNumber);
  const addresses = await repository.list<{ id: string; label: string; addressText: string }>(
    'addresses',
  );
  assert.equal(addresses.length, 4);
  const pickup = addresses.find((address) => address.id === a.pickupAddressId);
  const delivery = addresses.find((address) => address.id === a.deliveryAddressId);
  assert.equal(pickup?.label, 'pickup');
  assert.equal(delivery?.label, 'delivery');
  assert.equal(pickup?.addressText, input.origin);
  const located = await service.createOrder('customer', {
    ...input,
    originLat: 43.238,
    originLng: 76.889,
    destinationLat: 43.218,
    destinationLng: 76.917,
  });
  assert.ok(located.estimatedDistanceKm > 2 && located.estimatedDistanceKm < 5);
  assert.ok(located.estimatedDurationMinutes >= 5);
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
  assert.equal(paid.paymentStatus, 'locked');
  assert.equal(paid.status, 'payment_locked');
  assert.ok(paid.paymentId);
  assert.equal(calls.hold, 1);
  assert.equal((await service.offers('operator')).length, 1);
});

test('offers expose only the public allowlist and no exact addresses or private payload', async () => {
  const { service } = fixture();
  const order = await service.createOrder('customer', input);
  await service.pay('customer', order.id);
  const offers = await service.offers('operator');
  assert.equal(offers.length, 1);
  assert.deepEqual(
    Object.keys(offers[0]).sort(),
    ['id', 'packageWeightKg', 'priceAmount', 'createdAt', 'originArea', 'destinationArea'].sort(),
  );
  const serialized = JSON.stringify(offers);
  for (const secret of [input.origin, input.destination, input.packageDescription, 'apartment']) {
    assert.equal(serialized.includes(secret), false, `offer leaked ${secret}`);
  }
  await rejectsStatus(service.offers('customer'), 403);
  await rejectsStatus(service.order('operator', order.id), 403);
});

test('customers and operators can list and read only their own orders', async () => {
  const f = fixture();
  const owned = await acceptedOrder(f);
  const other = await f.service.createOrder('other-customer', input);
  assert.deepEqual(
    (await f.service.orders('customer')).map((o) => o.id),
    [owned.id],
  );
  assert.deepEqual(
    (await f.service.orders('operator')).map((o) => o.id),
    [owned.id],
  );
  assert.deepEqual(await f.service.orders('other-operator'), []);
  await rejectsStatus(f.service.order('other-customer', owned.id), 403);
  await rejectsStatus(f.service.order('other-operator', owned.id), 403);
  await rejectsStatus(f.service.order('customer', other.id), 403);
  assert.equal(
    (await f.service.order('operator', owned.id)).packageDescription,
    input.packageDescription,
  );
});

test('drone creation and listing enforce operator role, payload and unique numbers', async () => {
  const { service } = fixture();
  await rejectsStatus(service.addDrone('customer', droneInput), 403);
  await rejectsStatus(service.drones('customer'), 403);
  for (const invalid of [
    { droneModel: '' },
    { serialNumber: '' },
    { registrationNumber: '' },
    { maxPayloadKg: 0 },
    { maxPayloadKg: -1 },
    { maxPayloadKg: Number.NaN },
    { maxPayloadKg: 10000 },
  ]) {
    await rejectsStatus(service.addDrone('operator', { ...droneInput, ...invalid }), 400);
  }
  const tampered = { ...droneInput, operatorId: 'other-operator' };
  const drone = await service.addDrone('operator', tampered);
  assert.equal(drone.operatorId, 'operator');
  assert.equal(drone.status, 'available');
  assert.equal(drone.certificationStatus, 'certified');
  assert.equal(drone.totalFlights, 0);
  assert.deepEqual(
    (await service.drones('operator')).map((d) => d.id),
    [drone.id],
  );
  assert.deepEqual(await service.drones('other-operator'), []);
  await rejectsStatus(service.addDrone('operator', droneInput), 409);
  await rejectsStatus(
    service.addDrone('operator', { ...droneInput, serialNumber: 'SN-OTHER' }),
    409,
  );
  await rejectsStatus(service.addDrone('other-operator', droneInput), 409);
});

test('acceptance requires an owned, available and certified drone able to carry the parcel', async () => {
  const { service, repository } = fixture();
  const order = await service.createOrder('customer', input);
  await service.pay('customer', order.id);
  const foreign = await service.addDrone('other-operator', droneInput);
  const tooSmall = await service.addDrone('operator', {
    ...droneInput,
    serialNumber: 'SN-2',
    registrationNumber: 'REG-2',
    maxPayloadKg: 0.1,
  });
  const offline = await service.addDrone('operator', {
    ...droneInput,
    serialNumber: 'SN-3',
    registrationNumber: 'REG-3',
  });
  repository.seed('drones', offline.id, { ...offline, status: 'offline' });
  const uncertified = await service.addDrone('operator', {
    ...droneInput,
    serialNumber: 'SN-4',
    registrationNumber: 'REG-4',
  });
  repository.seed('drones', uncertified.id, { ...uncertified, certificationStatus: 'pending' });
  await rejectsStatus(service.accept('customer', order.id, foreign.id), 403);
  await rejectsStatus(service.accept('operator', order.id, foreign.id), 403);
  await rejectsStatus(service.accept('operator', order.id, tooSmall.id), 409);
  await rejectsStatus(service.accept('operator', order.id, offline.id), 409);
  await rejectsStatus(service.accept('operator', order.id, uncertified.id), 409);
  assert.equal((await service.order('customer', order.id)).status, 'payment_locked');
});

test('concurrent acceptance by different operators has exactly one winner and one conflict', async () => {
  const { service } = fixture();
  const drones = await Promise.all([
    service.addDrone('operator', droneInput),
    service.addDrone('other-operator', {
      ...droneInput,
      serialNumber: 'SN-OTHER-1',
      registrationNumber: 'REG-OTHER-1',
    }),
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
  assert.equal(stored.status, 'assigned');
  assert.equal(stored.operatorId, fulfilled[0].value.operatorId);
  assert.equal(stored.events.filter((event) => event.status === 'assigned').length, 1);
  assert.equal((await service.offers('operator')).length, 0);
  const drones_after = await service.drones(stored.operatorId as string);
  assert.equal(drones_after.find((d) => d.id === stored.droneId)?.status, 'in_flight');
});

test('one drone cannot be assigned concurrently to two active deliveries', async () => {
  const { service } = fixture();
  const drone = await service.addDrone('operator', droneInput);
  const orders = await Promise.all([
    service.createOrder('customer', input),
    service.createOrder('other-customer', input),
  ]);
  await Promise.all([
    service.pay('customer', orders[0].id),
    service.pay('other-customer', orders[1].id),
  ]);
  const results = await Promise.allSettled(
    orders.map((order) => service.accept('operator', order.id, drone.id)),
  );
  assert.equal(results.filter((result) => result.status === 'fulfilled').length, 1);
  const rejected = results.find((result) => result.status === 'rejected');
  assert.equal(rejected?.status === 'rejected' && rejected.reason.status, 409);
  assert.equal((await service.orders('operator')).length, 1);
  assert.equal((await service.offers('other-operator')).length, 1);
});

test('delivery transitions are sequential and only the assigned operator can advance', async () => {
  const f = fixture();
  const order = await acceptedOrder(f);
  await rejectsStatus(f.service.advance('customer', order.id, 'in_transit'), 403);
  await rejectsStatus(f.service.advance('other-operator', order.id, 'in_transit'), 403);
  await rejectsStatus(f.service.advance('operator', order.id, 'delivered'), 409);
  await rejectsStatus(f.service.advance('operator', order.id, 'pending'), 409);
  await rejectsStatus(f.service.advance('operator', order.id, 'cancelled'), 409);
  await rejectsStatus(f.service.advance('operator', order.id, 'picked_up' as OrderStatus), 409);
  for (const status of ['in_transit', 'delivered'] as const) {
    const updated = await f.service.advance('operator', order.id, status);
    assert.equal(updated.status, status);
    assert.equal(updated.paymentStatus, 'locked');
    assert.equal(updated.events.at(-1)?.actorId, 'operator');
    assert.equal(updated.events.at(-1)?.status, status);
    await rejectsStatus(f.service.advance('operator', order.id, status), 409);
  }
  const delivered = await f.service.order('customer', order.id);
  assert.ok(delivered.pickupTimeActual && delivered.deliveryTimeActual);
  assert.equal(f.calls.release, 0);
});

test('in-transit advance records tracking telemetry for drones that report coordinates', async () => {
  const f = fixture();
  const drone = await f.service.addDrone('operator', droneInput);
  await f.repository.seed('drones', drone.id, {
    ...drone,
    currentLatitude: 43.238,
    currentLongitude: 76.889,
    currentAltitudeM: 120,
    currentBatteryPercent: 80,
  });
  const order = await f.service.createOrder('customer', input);
  await f.service.pay('customer', order.id);
  await f.service.accept('operator', order.id, drone.id);
  assert.deepEqual(await f.repository.list('orderTracking'), []);
  await f.service.advance('operator', order.id, 'in_transit');
  const tracking = await f.repository.list('orderTracking');
  assert.equal(tracking.length, 1);
  const entry = tracking[0] as {
    orderId: string;
    latitude: number;
    longitude: number;
    batteryPercent: number | null;
  };
  assert.equal(entry.orderId, order.id);
  assert.equal(entry.latitude, 43.238);
  assert.equal(entry.longitude, 76.889);
  assert.equal(entry.batteryPercent, 80);
  await f.service.advance('operator', order.id, 'delivered');
  assert.equal((await f.repository.list('orderTracking')).length, 1);
  const flown = (await f.service.drones('operator')).find((d) => d.id === drone.id);
  assert.equal(flown?.status, 'available');
  assert.equal(flown?.totalFlights, 1);
  assert.ok(flown && flown.totalDistanceKm > 0);
});

test('only the owning customer can confirm delivered parcels and release held payment', async () => {
  const f = fixture();
  const order = await acceptedOrder(f);
  await rejectsStatus(f.service.confirmReceipt('customer', order.id), 409);
  await rejectsStatus(f.service.confirmReceipt('operator', order.id), 403);
  for (const status of ['in_transit', 'delivered'] as const) {
    await f.service.advance('operator', order.id, status);
  }
  await rejectsStatus(f.service.confirmReceipt('operator', order.id), 403);
  await rejectsStatus(f.service.confirmReceipt('other-customer', order.id), 403);
  assert.equal(f.calls.release, 0);
  const received = await f.service.confirmReceipt('customer', order.id);
  assert.equal(received.status, 'delivered');
  assert.equal(received.paymentStatus, 'completed');
  assert.ok(received.receiptConfirmedAt);
  assert.equal(received.events.at(-1)?.actorId, 'customer');
  assert.equal(f.calls.release, 1);
  await rejectsStatus(f.service.confirmReceipt('customer', order.id), 409);
  assert.equal(f.calls.release, 1);
});

test('customers can cancel unpaid orders and paid orders are refunded', async () => {
  const f = fixture();
  const unpaid = await f.service.createOrder('customer', input);
  const cancelledUnpaid = await f.service.cancelOrder('customer', unpaid.id);
  assert.equal(cancelledUnpaid.status, 'cancelled');
  assert.equal(cancelledUnpaid.paymentStatus, 'pending');
  assert.equal(f.calls.refund, 0);
  await rejectsStatus(f.service.cancelOrder('customer', unpaid.id), 409);
  const paid = await f.service.createOrder('customer', input);
  await f.service.pay('customer', paid.id);
  const cancelledPaid = await f.service.cancelOrder('customer', paid.id);
  assert.equal(cancelledPaid.status, 'cancelled');
  assert.equal(cancelledPaid.paymentStatus, 'refunded');
  assert.equal(f.calls.refund, 1);
  assert.equal((await f.service.offers('operator')).length, 0);
  await rejectsStatus(f.service.cancelOrder('operator', paid.id), 403);
  const assigned = await acceptedOrder(f);
  await rejectsStatus(f.service.cancelOrder('customer', assigned.id), 409);
  assert.equal(f.calls.refund, 1);
});

test('repeated or concurrent payments do not hold funds twice', async () => {
  const { service, calls } = fixture();
  const order = await service.createOrder('customer', input);
  const results = await Promise.allSettled([
    service.pay('customer', order.id),
    service.pay('customer', order.id),
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
  for (const status of ['in_transit', 'delivered'] as const) {
    await f.service.advance('operator', order.id, status);
  }
  const results = await Promise.allSettled([
    f.service.confirmReceipt('customer', order.id),
    f.service.confirmReceipt('customer', order.id),
  ]);
  assert.equal(results.filter((result) => result.status === 'fulfilled').length, 1);
  const rejected = results.find((result) => result.status === 'rejected');
  assert.equal(rejected?.status === 'rejected' && rejected.reason.status, 409);
  assert.equal(f.calls.release, 1);
  assert.ok((await f.service.order('customer', order.id)).receiptConfirmedAt);
});

test('failed payment or release adapters leave order state unchanged', async () => {
  const f = fixture();
  const unavailable: PaymentAdapter = {
    mode: 'firestore',
    hold: async () => {
      throw new Error('Escrow not configured');
    },
    release: async () => {
      throw new Error('Escrow not configured');
    },
    refund: async () => {
      throw new Error('Escrow not configured');
    },
  };
  const service = new DeliveryService(f.repository, unavailable);
  const unpaid = await service.createOrder('customer', input);
  await assert.rejects(service.pay('customer', unpaid.id));
  const stillUnpaid = await service.order('customer', unpaid.id);
  assert.equal(stillUnpaid.paymentStatus, 'pending');
  assert.equal(stillUnpaid.status, 'pending');
  const accepted = await acceptedOrder(f);
  for (const status of ['in_transit', 'delivered'] as const) {
    await f.service.advance('operator', accepted.id, status);
  }
  await assert.rejects(service.confirmReceipt('customer', accepted.id));
  const stillDelivered: Order = await service.order('customer', accepted.id);
  assert.equal(stillDelivered.status, 'delivered');
  assert.equal(stillDelivered.paymentStatus, 'locked');
});

test('demo escrow records the full payment lifecycle in the payments collection', async () => {
  const { repository, service } = fixture(new DemoEscrowPayments());
  const drone = await service.addDrone('operator', droneInput);
  const order = await service.createOrder('customer', input);
  const paid = await service.pay('customer', order.id);
  await service.accept('operator', order.id, drone.id);
  let records = await repository.list('payments');
  assert.equal(records.length, 1);
  const locked = records[0] as {
    id: string;
    paymentStatus: string;
    amount: number;
    platformFeeAmount: number;
    operatorPayoutAmount: number;
    completedAt: string | null;
    payeeId: string | null;
  };
  assert.equal(locked.id, paid.paymentId);
  assert.equal(locked.paymentStatus, 'locked');
  assert.equal(locked.amount, paid.priceAmount);
  const fee = Math.round(paid.priceAmount * 0.1 * 10000) / 10000;
  assert.equal(locked.platformFeeAmount, fee);
  assert.equal(locked.operatorPayoutAmount, paid.priceAmount - fee);
  assert.equal(locked.completedAt, null);
  assert.equal(locked.payeeId, null);
  for (const status of ['in_transit', 'delivered'] as const) {
    await service.advance('operator', order.id, status);
  }
  await service.confirmReceipt('customer', order.id);
  records = await repository.list('payments');
  const released = records[0] as {
    paymentStatus: string;
    completedAt: string | null;
    payeeId: string | null;
  };
  assert.equal(released.paymentStatus, 'completed');
  assert.ok(released.completedAt);
  assert.equal(released.payeeId, 'operator');
  const refundCase = await service.createOrder('customer', input);
  await service.pay('customer', refundCase.id);
  await service.cancelOrder('customer', refundCase.id);
  records = await repository.list('payments');
  assert.equal(records.length, 2);
  assert.equal(
    (records as { paymentStatus: string }[]).some((record) => record.paymentStatus === 'refunded'),
    true,
  );
});
