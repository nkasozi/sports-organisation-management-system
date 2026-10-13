import { vi } from "vitest";

import type { StorageBackupDexieDatabase } from "./storageBackupDexieDatabasePort";

export const EMPTY_SYNC_BOOKKEEPING = {
  outbox_entries: [],
  record_versions: [],
};

interface FakeDatabaseHarness {
  database: StorageBackupDexieDatabase;
  call_order: string[];
  transaction_requests: Array<{ mode: string; table_names: string[] }>;
  low_level_transaction: object;
}

export function create_untracked_marker_spy(
  call_order: string[],
): (low_level_transaction: object) => boolean {
  return (): boolean => {
    call_order.push("marked_untracked");
    return true;
  };
}

function create_fake_table(
  table_name: string,
  bulk_put_failure_table: string,
  call_order: string[],
): Record<string, (...args: never[]) => Promise<unknown>> {
  return {
    bulkPut: async (records: unknown[]): Promise<unknown> => {
      if (table_name === bulk_put_failure_table)
        return Promise.reject(new Error("ConstraintError"));
      call_order.push(`bulk_put:${table_name}:${records.length}`);
      return true;
    },
    clear: async (): Promise<unknown> => {
      call_order.push(`dexie_clear:${table_name}`);
      return true;
    },
    toArray: async (): Promise<unknown> => [{ id: `${table_name}-1` }],
    count: async (): Promise<unknown> => 2,
  };
}

function create_fake_transaction(call_order: string[]): {
  idbtrans: { objectStore: (store_name: string) => { clear: () => object } };
} {
  return {
    idbtrans: {
      objectStore: (store_name: string) => ({
        clear: () => {
          call_order.push(`raw_clear:${store_name}`);
          return {};
        },
      }),
    },
  };
}

export function create_fake_database(
  bulk_put_failure_table: string = "",
): FakeDatabaseHarness {
  const call_order: string[] = [];
  const transaction_requests: FakeDatabaseHarness["transaction_requests"] = [];
  const fake_transaction = create_fake_transaction(call_order);
  const database = {
    transaction: vi.fn(
      async (
        mode: string,
        table_names: string[],
        scope: (transaction: typeof fake_transaction) => Promise<unknown>,
      ) => {
        transaction_requests.push({ mode, table_names });
        call_order.push("transaction_started");
        await scope(fake_transaction);
        call_order.push("transaction_committed");
      },
    ),
    table: (table_name: string) =>
      create_fake_table(table_name, bulk_put_failure_table, call_order),
  };

  return {
    database: database as unknown as StorageBackupDexieDatabase,
    call_order,
    transaction_requests,
    low_level_transaction: fake_transaction.idbtrans,
  };
}
