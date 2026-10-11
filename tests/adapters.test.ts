import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, rmdir, unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DemoRepository } from '../src/lib/adapters/demo-store';
import { DeliveryService } from '../src/lib/service';
import { DemoEscrowPayments } from '../src/lib/payments';
import { getMode } from '../src/lib/config';
import type { Profile, Order } from '../src/lib/domain';

async function isolatedStore() {
  const directory = await mkdtemp(join(tmpdir(), 'aeroroute-test-'));
  const file = join(directory, 'demo.json');
  return {
    first: new DemoRepository(file), second: new DemoRepository(file),
    cleanup: async () => {
      for (const path of [file, file + '.tmp']) {
        await unlink(path).catch((error: NodeJS.ErrnoException) => {
          if (error.code !== 'ENOENT') throw error;
        });
      }
      await rmdir(directory);
    },
  };
}

test('real demo adapter serializes acceptance across repository instances and persists the winner', async () => {
  const stores = await isolatedStore();
  try {
    await stores.first.transaction(async (tx) => {
      for (const [id, role] of [['customer', 'customer'], ['operator-a', 'operator'], ['operator-b', 'operator']] as const) {
        const profile: Profile = { id, role, username: id, createdAt: new Date().toISOString() };
        await tx.set('profiles', id, profile);
      }
    });
    const a = new DeliveryService(stores.first, new DemoEscrowPayments());
    const b = new DeliveryService(stores.second, new DemoEscrowPayments());
    const droneA = await a.addDrone('operator-a', { droneModel: 'Drone Alpha', serialNumber: 'SN-A', registrationNumber: 'REG-A', maxPayloadKg: 2 });
    const droneB = await b.addDrone('operator-b', { droneModel: 'Drone Beta', serialNumber: 'SN-B', registrationNumber: 'REG-B', maxPayloadKg: 2 });
    const order = await a.createOrder('customer', {
      origin: 'Almaty, Abay avenue 10', destination: 'Almaty, Dostyk avenue 20',
      packageDescription: 'Sealed parcel', packageWeightKg: 0.5,
    });
    await a.pay('customer', order.id);
    const results = await Promise.allSettled([
      a.accept('operator-a', order.id, droneA.id), b.accept('operator-b', order.id, droneB.id),
    ]);
    assert.equal(results.filter((result) => result.status === 'fulfilled').length, 1);
    const rejection = results.find((result) => result.status === 'rejected');
    assert.equal(rejection?.status === 'rejected' && rejection.reason.status, 409);
    const reopened = new DemoRepository(stores.first.path);
    const persisted = await reopened.get<Order>('orders', order.id);
    assert.equal(persisted?.status, 'assigned');
    assert.equal(persisted?.events.filter((event) => event.status === 'assigned').length, 1);
    assert.deepEqual(await a.offers('operator-a'), []);
    const payments = await reopened.list('payments');
    assert.equal(payments.length, 1);
    assert.equal((payments[0] as { paymentStatus: string }).paymentStatus, 'locked');
  } finally { await stores.cleanup(); }
});

test('demo transaction errors roll back writes and release the queue for later transactions', async () => {
  const stores = await isolatedStore();
  try {
    await assert.rejects(stores.first.transaction(async (tx) => {
      await tx.set('profiles', 'rejected', { role: 'operator' });
      throw new Error('Deliberate rollback');
    }));
    assert.equal(await stores.second.get('profiles', 'rejected'), null);
    await stores.second.transaction(async (tx) => { await tx.set('profiles', 'saved', { role: 'customer' }); });
    assert.deepEqual(await stores.first.get('profiles', 'saved'), { role: 'customer' });
  } finally { await stores.cleanup(); }
});

test('escrow release and refund fail closed on unknown or missing locked payments', async () => {
  const adapter = new DemoEscrowPayments();
  const emptyTx = { get: async () => null, list: async () => [], set: async () => {} };
  for (const operation of [
    () => adapter.release(emptyTx, {} as Order, 'missing'), () => adapter.refund(emptyTx, {} as Order, 'missing'),
  ]) {
    await assert.rejects(operation(), (error: unknown) => {
      assert.equal((error as { status: number }).status, 409);
      return true;
    });
  }
});

test('production requires explicit mode and rejects unsupported modes', () => {
  const previousMode = process.env.AEROROUTE_MODE;
  const previousEnvironment = process.env.NODE_ENV;
  try {
    process.env.NODE_ENV = 'production';
    delete process.env.AEROROUTE_MODE;
    assert.throws(() => getMode(), /explicitly/);
    process.env.AEROROUTE_MODE = 'live';
    assert.throws(() => getMode(), /explicitly/);
    process.env.AEROROUTE_MODE = 'demo';
    assert.equal(getMode(), 'demo');
    process.env.AEROROUTE_MODE = 'firestore';
    assert.equal(getMode(), 'firestore');
  } finally {
    if (previousMode === undefined) delete process.env.AEROROUTE_MODE;
    else process.env.AEROROUTE_MODE = previousMode;
    if (previousEnvironment === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousEnvironment;
  }
});
