import { getMode } from './config';
import { DemoRepository } from './adapters/demo-store';
import { FirestoreRepository } from './adapters/firestore-store';
import { getAdminFirestore } from './firebase-admin';
import type { Repository } from './repository';
export type { Repository, Transaction } from './repository';

const stores = new Map<string, Repository>();
export function getStore(): Repository {
  const mode = getMode();
  const key = mode + (process.env.AEROROUTE_DEMO_FILE || '');
  let store = stores.get(key);
  if (!store) {
    store = mode === 'demo' ? new DemoRepository() : new FirestoreRepository(getAdminFirestore);
    stores.set(key, store);
  }
  return store;
}
