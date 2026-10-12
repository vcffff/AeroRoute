import type { Firestore } from 'firebase-admin/firestore';
import type { Repository, Transaction } from '../repository';

export class FirestoreRepository implements Repository {
  constructor(private readonly database: () => Firestore) {}
  async get<T>(collection: string, id: string): Promise<T | null> {
    const snapshot = await this.database().collection(collection).doc(id).get();
    return snapshot.exists ? (snapshot.data() as T) : null;
  }
  async list<T>(collection: string): Promise<T[]> {
    return (await this.database().collection(collection).get()).docs.map((doc) => doc.data() as T);
  }
  async transaction<T>(work: (tx: Transaction) => Promise<T>): Promise<T> {
    const db = this.database();
    return db.runTransaction(async (native) =>
      work({
        get: async <V>(collection: string, id: string) => {
          const document = await native.get(db.collection(collection).doc(id));
          return document.exists ? (document.data() as V) : null;
        },
        list: async <V>(collection: string) =>
          (await native.get(db.collection(collection))).docs.map((doc) => doc.data() as V),
        set: async <V>(collection: string, id: string, value: V) => {
          native.set(db.collection(collection).doc(id), value as FirebaseFirestore.DocumentData);
        },
      }),
    );
  }
}
