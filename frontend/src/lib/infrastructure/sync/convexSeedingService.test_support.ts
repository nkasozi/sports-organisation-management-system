import { vi } from "vitest";

import type { ConvexClient } from "./syncTypes";

interface ConvexRecord {
  _id: string;
  local_id: string;
  synced_at: string;
  version: number;
  [key: string]: unknown;
}

interface MockTable {
  bulkPut: ReturnType<typeof vi.fn>;
}

type MockConvexClientResult =
  | { success: false; error: string }
  | { success: true; data: ConvexClient };

type ConvexQueryImplementation = (
  name: string,
  args: Record<string, unknown>,
) => Promise<unknown>;

const CONVEX_CLIENT_NOT_CONFIGURED = "Convex client not configured";
const EMPTY_ROWS = new Map<string, Record<string, unknown>>();

const MOCK_TABLE_NAMES = [
  "organizations",
  "competitions",
  "teams",
  "players",
  "fixtures",
] as const;

export const seeding_test_state = {
  database_tables: {} as Record<string, MockTable>,
  convex_client_result: {
    success: false,
    error: CONVEX_CLIENT_NOT_CONFIGURED,
  } as MockConvexClientResult,
};

function create_mock_table(): MockTable {
  return {
    bulkPut: vi.fn().mockImplementation(async () => {}),
    bulkGet: vi.fn(async (keys: unknown[]) =>
      keys.map((key) => EMPTY_ROWS.get(String(key))),
    ),
    bulkDelete: vi.fn(async () => {}),
    get: vi.fn(async (key: unknown) => EMPTY_ROWS.get(String(key))),
    put: vi.fn(async () => {}),
  } as MockTable;
}

interface SeedingDatabaseMock {
  get_database: () => {
    table: (name: string) => MockTable;
    transaction: (
      mode: string,
      tables: string[],
      scope: (transaction: { idbtrans: object }) => Promise<unknown>,
    ) => Promise<unknown>;
  };
}

interface SeedingSyncServiceMock {
  get_sync_manager: () => {
    get_convex_client: () => MockConvexClientResult;
  };
  TABLE_NAMES: typeof MOCK_TABLE_NAMES;
}

export function create_database_mock(): SeedingDatabaseMock {
  const tables = seeding_test_state.database_tables;
  return {
    get_database: () => ({
      table: (name: string) => {
        if (!tables[name]) tables[name] = create_mock_table();
        return tables[name];
      },
      transaction: async (
        _mode: string,
        _tables: string[],
        scope: (transaction: { idbtrans: object }) => Promise<unknown>,
      ): Promise<unknown> => scope({ idbtrans: {} }),
    }),
  };
}

export function create_sync_service_mock(): SeedingSyncServiceMock {
  return {
    get_sync_manager: () => ({
      get_convex_client: () => seeding_test_state.convex_client_result,
    }),
    TABLE_NAMES: MOCK_TABLE_NAMES,
  };
}

export function create_mock_convex_records(
  table_name: string,
  count: number,
): ConvexRecord[] {
  return Array.from({ length: count }, (_, index) => ({
    _id: `convex_${table_name}_${index}`,
    local_id: `${table_name}_${index}`,
    synced_at: new Date().toISOString(),
    version: 1,
    name: `${table_name} Record ${index}`,
  }));
}

export function use_convex_query(
  query_implementation: ConvexQueryImplementation,
): boolean {
  seeding_test_state.convex_client_result = {
    success: true,
    data: {
      query: vi.fn().mockImplementation(query_implementation),
      mutation: vi.fn(),
    } as unknown as ConvexClient,
  };
  return true;
}

export function reset_seeding_test_state(): boolean {
  seeding_test_state.convex_client_result = {
    success: false,
    error: CONVEX_CLIENT_NOT_CONFIGURED,
  };
  Object.keys(seeding_test_state.database_tables).forEach(
    (key) => delete seeding_test_state.database_tables[key],
  );
  return true;
}
