import { mkdir, readFile, rename, writeFile, rmdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import type { Repository, Transaction } from '../repository';

type Data = Record<string, Record<string, unknown>>;
type Queue = { tail: Promise<void> };
const queues = new Map<string, Queue>();

// Local demo only. A filesystem lock also serializes processes on the same disk.
// Cloud/serverless installations must use Firestore instead of local storage.
export class DemoRepository implements Repository {
  readonly path: string;
  constructor(path = process.env.AEROROUTE_DEMO_FILE || '.aeroroute/demo.json') {
    this.path = resolve(path);
  }
  private async read(): Promise<Data> {
    try {
      return JSON.parse(await readFile(this.path, 'utf8')) as Data;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return {};
      throw error;
    }
  }
  async get<T>(collection: string, id: string): Promise<T | null> {
    const data = await this.read();
    return structuredClone((data[collection]?.[id] as T | undefined) ?? null);
  }
  async list<T>(collection: string): Promise<T[]> {
    return structuredClone(Object.values((await this.read())[collection] || {}) as T[]);
  }
  private async acquireLock(): Promise<() => Promise<void>> {
    await mkdir(dirname(this.path), { recursive: true });
    const lock = this.path + '.lock';
    const deadline = Date.now() + 10000;
    for (;;) {
      try {
        await mkdir(lock);
        return () => rmdir(lock);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
        if (Date.now() >= deadline)
          throw new Error(
            'Demo storage lock timeout. Stop demo servers before recovering a stale lock.',
          );
        await new Promise((resolveWait) => setTimeout(resolveWait, 25));
      }
    }
  }
  async transaction<T>(work: (tx: Transaction) => Promise<T>): Promise<T> {
    const queue = queues.get(this.path) || { tail: Promise.resolve() };
    queues.set(this.path, queue);
    const previous = queue.tail;
    let release!: () => void;
    queue.tail = new Promise<void>((resolveWait) => {
      release = resolveWait;
    });
    await previous;
    let unlock: (() => Promise<void>) | undefined;
    try {
      unlock = await this.acquireLock();
      const data = await this.read();
      const tx: Transaction = {
        get: async <V>(collection: string, id: string) =>
          structuredClone((data[collection]?.[id] as V | undefined) ?? null),
        list: async <V>(collection: string) =>
          structuredClone(Object.values(data[collection] || {}) as V[]),
        set: async <V>(collection: string, id: string, value: V) => {
          data[collection] ||= {};
          data[collection][id] = structuredClone(value);
        },
      };
      const result = await work(tx);
      await mkdir(dirname(this.path), { recursive: true });
      const temporary = this.path + '.tmp';
      await writeFile(temporary, JSON.stringify(data), { mode: 0o600 });
      await rename(temporary, this.path);
      return result;
    } finally {
      try {
        if (unlock) await unlock();
      } finally {
        release();
      }
    }
  }
}
