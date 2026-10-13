import type { SportSyncDatabase } from "$lib/adapters/repositories/database";

type Row = Record<string, unknown>;

const COMPOUND_KEY_TABLES = new Set(["sync_outbox", "sync_record_versions"]);
const TABLE_NAME_KEY_TABLES = new Set(["sync_cursors"]);

export interface FakeSyncDatabase {
  database: SportSyncDatabase;
  rows(table_name: string): Row[];
  seed(table_name: string, rows: Row[]): void;
  transaction_markers: object[];
}

function extract_primary_key(table_name: string, row: Row): unknown {
  if (COMPOUND_KEY_TABLES.has(table_name))
    return [row.table_name, row.local_id];
  if (TABLE_NAME_KEY_TABLES.has(table_name)) return row.table_name;
  return row.id;
}

interface FakeIndexQuery {
  toArray(): Promise<Row[]>;
  count(): Promise<number>;
}

interface FakeTable {
  get(key: unknown): Promise<unknown>;
  put(row: Row): Promise<unknown>;
  bulkPut(rows: Row[]): Promise<unknown[]>;
  bulkGet(keys: unknown[]): Promise<unknown[]>;
  delete(key: unknown): Promise<boolean>;
  bulkDelete(keys: unknown[]): Promise<void>;
  toArray(): Promise<Row[]>;
  count(): Promise<number>;
  toCollection(): { primaryKeys(): Promise<unknown[]> };
  where(index_name: string): { equals(value: unknown): FakeIndexQuery };
}

function create_fake_table(
  table_name: string,
  store: Map<string, Row>,
): FakeTable {
  const key_of = (key: unknown): string => JSON.stringify(key);
  const put = async (row: Row): Promise<unknown> => {
    store.set(key_of(extract_primary_key(table_name, row)), { ...row });
    return extract_primary_key(table_name, row);
  };
  const all = (): Row[] => [...store.values()].map((row) => ({ ...row }));
  return {
    get: async (key: unknown) => store.get(key_of(key)),
    put,
    bulkPut: async (rows: Row[]) => Promise.all(rows.map(put)),
    bulkGet: async (keys: unknown[]) =>
      keys.map((key) => store.get(key_of(key))),
    delete: async (key: unknown) => store.delete(key_of(key)),
    bulkDelete: async (keys: unknown[]) =>
      keys.forEach((key) => store.delete(key_of(key))),
    toArray: async () => all(),
    count: async () => store.size,
    toCollection: () => ({
      primaryKeys: async () =>
        all().map((row) => extract_primary_key(table_name, row)),
    }),
    where: (index_name: string) => ({
      equals: (value: unknown) => {
        const matching = (): Row[] =>
          all().filter((row) => row[index_name] === value);
        return {
          toArray: async () => matching(),
          count: async () => matching().length,
        };
      },
    }),
  };
}

export function create_fake_sync_database(): FakeSyncDatabase {
  const stores = new Map<string, Map<string, Row>>();
  const store_for = (table_name: string): Map<string, Row> => {
    const existing_store = stores.get(table_name);
    if (existing_store) return existing_store;
    const created_store = new Map<string, Row>();
    stores.set(table_name, created_store);
    return created_store;
  };
  const transaction_markers: object[] = [];
  const database = {
    table: (table_name: string) =>
      create_fake_table(table_name, store_for(table_name)),
    transaction: async (
      _mode: string,
      _tables: string[],
      scope: (transaction: { idbtrans: object }) => Promise<unknown>,
    ) => {
      const marker = { transaction_index: transaction_markers.length };
      transaction_markers.push(marker);
      return scope({ idbtrans: marker });
    },
  } as unknown as SportSyncDatabase;
  return {
    database,
    rows: (table_name: string) => [...store_for(table_name).values()],
    seed: (table_name: string, rows: Row[]) =>
      rows.forEach((row) =>
        store_for(table_name).set(
          JSON.stringify(extract_primary_key(table_name, row)),
          row,
        ),
      ),
    transaction_markers,
  };
}
