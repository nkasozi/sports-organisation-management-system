export type FakeRow = { id: string } & Record<string, unknown>;

export const FAKE_TABLE_FAILURE_MESSAGE = "fake table unavailable";

export enum FAKE_TABLE_MODE {
  HEALTHY = "healthy",
  FAILING = "failing",
}

export interface FakeTable {
  name: string;
  rows: FakeRow[];
  mode: FAKE_TABLE_MODE;
  toArray(): Promise<FakeRow[]>;
  get(id: string): Promise<unknown>;
  bulkGet(ids: string[]): Promise<unknown[]>;
  add(row: FakeRow): Promise<string>;
  put(row: FakeRow): Promise<string>;
  bulkPut(rows: FakeRow[]): Promise<string>;
  delete(id: string): Promise<boolean>;
  bulkDelete(ids: string[]): Promise<boolean>;
  count(): Promise<number>;
  clear(): Promise<boolean>;
  where(field: string): {
    equals(value: unknown): { toArray(): Promise<FakeRow[]> };
  };
}

const fake_tables = new Map<string, FakeTable>();

function settle<TValue>(
  table: FakeTable,
  value: () => TValue,
): Promise<TValue> {
  switch (table.mode) {
    case FAKE_TABLE_MODE.FAILING:
      return Promise.reject(new Error(FAKE_TABLE_FAILURE_MESSAGE));
    case FAKE_TABLE_MODE.HEALTHY:
      return Promise.resolve(value());
  }
}

function upsert_row(table: FakeTable, row: FakeRow): string {
  table.rows = [...table.rows.filter((item) => item.id !== row.id), row];
  return row.id;
}

function create_fake_table(name: string): FakeTable {
  const table: FakeTable = {
    name,
    rows: [],
    mode: FAKE_TABLE_MODE.HEALTHY,
    toArray: () => settle(table, () => [...table.rows]),
    get: (id) => settle(table, () => table.rows.find((row) => row.id === id)),
    bulkGet: (ids) =>
      settle(table, () =>
        ids.map((id) => table.rows.find((row) => row.id === id)),
      ),
    add: (row) => settle(table, () => upsert_row(table, row)),
    put: (row) => settle(table, () => upsert_row(table, row)),
    bulkPut: (rows) =>
      settle(table, () => rows.map((row) => upsert_row(table, row)).join(",")),
    delete: (id) =>
      settle(table, () => {
        table.rows = table.rows.filter((row) => row.id !== id);
        return true;
      }),
    bulkDelete: (ids) =>
      settle(table, () => {
        table.rows = table.rows.filter((row) => !ids.includes(row.id));
        return true;
      }),
    count: () => settle(table, () => table.rows.length),
    clear: () =>
      settle(table, () => {
        table.rows = [];
        return true;
      }),
    where: (field) => ({
      equals: (value) => ({
        toArray: () =>
          settle(table, () => table.rows.filter((row) => row[field] === value)),
      }),
    }),
  };
  return table;
}

export function get_fake_table(name: string): FakeTable {
  if (!fake_tables.has(name)) fake_tables.set(name, create_fake_table(name));
  return fake_tables.get(name) as FakeTable;
}

export function seed_fake_table(name: string, rows: FakeRow[]): FakeTable {
  const table = get_fake_table(name);
  table.rows = [...rows];
  table.mode = FAKE_TABLE_MODE.HEALTHY;
  return table;
}

export function fail_fake_table(name: string): FakeTable {
  const table = get_fake_table(name);
  table.mode = FAKE_TABLE_MODE.FAILING;
  return table;
}

export function reset_fake_database(): boolean {
  fake_tables.clear();
  return true;
}

export const fake_database: Record<string, FakeTable> = new Proxy(
  {},
  { get: (_target, name) => get_fake_table(String(name)) },
);
