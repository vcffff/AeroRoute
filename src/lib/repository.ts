export interface Transaction {
  get<T>(collection: string, id: string): Promise<T | null>;
  list<T>(collection: string): Promise<T[]>;
  set<T>(collection: string, id: string, value: T): Promise<void>;
}
export interface Repository {
  get<T>(collection: string, id: string): Promise<T | null>;
  list<T>(collection: string): Promise<T[]>;
  transaction<T>(work: (tx: Transaction) => Promise<T>): Promise<T>;
}
