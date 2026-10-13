import type {
  DBCore,
  DBCoreMutateRequest,
  DBCoreMutateResponse,
  DBCoreTable,
} from "dexie";
import { type Mock, vi } from "vitest";

import {
  type ChangeTrackingGate,
  create_change_tracking_gate,
} from "./syncChangeTrackingGate";
import { create_sync_outbox_middleware } from "./syncOutboxMiddleware";
import {
  SYNC_OUTBOX_TABLE_NAME,
  SYNC_RECORD_VERSIONS_TABLE_NAME,
} from "./syncOutboxTypes";

const BOOKKEEPING_TABLES = new Set([
  SYNC_OUTBOX_TABLE_NAME,
  SYNC_RECORD_VERSIONS_TABLE_NAME,
]);

type Row = Record<string, unknown>;

interface FakeCore {
  core: DBCore;
  table_rows(name: string): Map<string, Row>;
}

function read_or_create_rows(
  rows: Map<string, Map<string, Row>>,
  name: string,
): Map<string, Row> {
  const existing_rows = rows.get(name);
  if (existing_rows) return existing_rows;
  const created_rows = new Map<string, Row>();
  rows.set(name, created_rows);
  return created_rows;
}

function create_fake_core(failing_keys: Set<string>): FakeCore {
  const rows = new Map<string, Map<string, Row>>();
  const table_rows = (name: string): Map<string, Row> =>
    read_or_create_rows(rows, name);
  const extract_key = (name: string) => (value: Row) =>
    BOOKKEEPING_TABLES.has(name)
      ? [value.table_name, value.local_id]
      : value.id;
  const apply_mutation = (
    name: string,
    request: DBCoreMutateRequest,
  ): DBCoreMutateResponse => {
    const failures: Record<number, Error> = {};
    if (request.type === "put" || request.type === "add")
      request.values.forEach((value, index) => {
        const key = extract_key(name)(value);
        if (failing_keys.has(String(key)))
          return (failures[index] = new Error("constraint"));
        table_rows(name).set(JSON.stringify(key), value);
      });
    if (request.type === "delete")
      request.keys.forEach((key) =>
        table_rows(name).delete(JSON.stringify(key)),
      );
    if (request.type === "deleteRange") table_rows(name).clear();
    return {
      numFailures: Object.keys(failures).length,
      failures,
      lastResult: undefined,
    };
  };
  const table = (name: string): DBCoreTable =>
    ({
      name,
      schema: { primaryKey: { extractKey: extract_key(name) } },
      getMany: async ({ keys }: { keys: unknown[] }) =>
        keys.map((key) => table_rows(name).get(JSON.stringify(key))),
      query: async () => ({
        result: [...table_rows(name).keys()].map((key) => JSON.parse(key)),
      }),
      mutate: async (request: DBCoreMutateRequest) =>
        apply_mutation(name, request),
    }) as unknown as DBCoreTable;
  const core = {
    stack: "dbcore",
    transaction: vi.fn((stores: string[]) => ({ stores, abort: vi.fn() })),
    table,
  } as unknown as DBCore;
  return { core, table_rows };
}

interface OutboxStack extends FakeCore {
  gate: ChangeTrackingGate;
  stack: DBCore;
  on_local_changes_recorded: Mock<() => boolean>;
}

export function create_outbox_stack(
  failing_keys = new Set<string>(),
): OutboxStack {
  const fake = create_fake_core(failing_keys);
  const gate = create_change_tracking_gate();
  const on_local_changes_recorded = vi.fn(() => true);
  let token_counter = 0;
  const middleware = create_sync_outbox_middleware({
    tracked_table_names: ["teams"],
    gate,
    generate_change_token: () => `token_${++token_counter}`,
    now_iso: () => "2024-05-01T00:00:00.000Z",
    on_local_changes_recorded,
  });
  const stack = { ...fake.core, ...middleware.create(fake.core) } as DBCore;
  return { ...fake, gate, stack, on_local_changes_recorded };
}

export function read_outbox_entries(stack: OutboxStack): Row[] {
  return [...stack.table_rows(SYNC_OUTBOX_TABLE_NAME).values()];
}

export async function put_team(
  stack: OutboxStack,
  transaction: object,
  values: Row[],
): Promise<DBCoreMutateResponse> {
  return stack.stack.table("teams").mutate({
    type: "put",
    trans: transaction,
    values,
  } as unknown as DBCoreMutateRequest);
}
