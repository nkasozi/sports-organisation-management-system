import { describe, expect, it, vi, beforeEach } from "vitest";

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

const mock_database_tables: Record<string, MockTable> = {};

function create_mock_table(): MockTable {
  return {
    bulkPut: vi.fn().mockResolvedValue(undefined),
  };
}

vi.mock("$lib/adapters/repositories/database", () => ({
  get_database: () => ({
    table: (name: string) => {
      if (!mock_database_tables[name]) {
        mock_database_tables[name] = create_mock_table();
      }
      return mock_database_tables[name];
    },
  }),
}));

vi.mock("./syncState", () => ({
  set_pulling_from_remote: vi.fn(),
}));

let mock_convex_client: {
  query: ReturnType<typeof vi.fn>;
  mutation: ReturnType<typeof vi.fn>;
} | null = null;

vi.mock("./convexSyncService", () => ({
  get_sync_manager: () => ({
    get_convex_client: () => mock_convex_client,
  }),
  TABLE_NAMES: [
    "organizations",
    "competitions",
    "teams",
    "players",
    "fixtures",
  ] as const,
}));

import {
  try_seed_all_tables_from_convex,
  is_convex_client_available,
} from "./convexSeedingService";

function create_mock_convex_records(
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

describe("is_convex_client_available", () => {
  beforeEach(() => {
    mock_convex_client = null;
    Object.keys(mock_database_tables).forEach(
      (key) => delete mock_database_tables[key],
    );
  });

  it("returns false when convex client is null", () => {
    mock_convex_client = null;
    const result = is_convex_client_available();
    expect(result).toBe(false);
  });

  it("returns true when convex client exists", () => {
    mock_convex_client = {
      query: vi.fn(),
      mutation: vi.fn(),
    };
    const result = is_convex_client_available();
    expect(result).toBe(true);
  });
});

describe("try_seed_all_tables_from_convex", () => {
  let progress_messages: Array<{ message: string; percentage: number }>;
  let on_progress: (message: string, percentage: number) => void;

  beforeEach(() => {
    mock_convex_client = null;
    progress_messages = [];
    on_progress = (message: string, percentage: number) => {
      progress_messages.push({ message, percentage });
    };
    Object.keys(mock_database_tables).forEach(
      (key) => delete mock_database_tables[key],
    );
  });

  it("returns failure when convex client is not available", async () => {
    mock_convex_client = null;

    const result = await try_seed_all_tables_from_convex(on_progress);

    expect(result.success).toBe(false);
    expect(result.data_source).toBe("none");
    expect(result.tables_fetched).toBe(0);
    expect(result.total_records).toBe(0);
  });

  it("seeds all tables successfully from convex", async () => {
    mock_convex_client = {
      query: vi
        .fn()
        .mockImplementation((_name: string, args: Record<string, unknown>) => {
          const table_name = args.table_name as string;
          return Promise.resolve(create_mock_convex_records(table_name, 5));
        }),
      mutation: vi.fn(),
    };

    const result = await try_seed_all_tables_from_convex(on_progress);

    expect(result.success).toBe(true);
    expect(result.data_source).toBe("convex");
    expect(result.tables_fetched).toBe(5);
    expect(result.total_records).toBe(25);
    expect(result.failed_tables).toEqual([]);
  });

  it("reports progress for each table", async () => {
    mock_convex_client = {
      query: vi.fn().mockResolvedValue([]),
      mutation: vi.fn(),
    };

    await try_seed_all_tables_from_convex(on_progress);

    expect(progress_messages.length).toBe(5);
    for (const msg of progress_messages) {
      expect(msg.message).toContain("Pulling");
      expect(msg.message).toContain("from server");
    }
  });

  it("returns failure when convex returns no data", async () => {
    mock_convex_client = {
      query: vi.fn().mockResolvedValue([]),
      mutation: vi.fn(),
    };

    const result = await try_seed_all_tables_from_convex(on_progress);

    expect(result.success).toBe(false);
    expect(result.total_records).toBe(0);
  });

  it("handles partial failures gracefully", async () => {
    let call_count = 0;
    mock_convex_client = {
      query: vi
        .fn()
        .mockImplementation((_name: string, args: Record<string, unknown>) => {
          call_count++;
          if (call_count === 1) {
            return Promise.reject(new Error("Network error"));
          }
          const table_name = args.table_name as string;
          return Promise.resolve(create_mock_convex_records(table_name, 3));
        }),
      mutation: vi.fn(),
    };

    const result = await try_seed_all_tables_from_convex(on_progress);

    expect(result.success).toBe(true);
    expect(result.tables_fetched).toBe(4);
    expect(result.total_records).toBe(12);
    expect(result.failed_tables.length).toBe(1);
  });

  it("returns failure when too many tables fail", async () => {
    let call_count = 0;
    mock_convex_client = {
      query: vi.fn().mockImplementation(() => {
        call_count++;
        if (call_count <= 3) {
          return Promise.reject(new Error("Network error"));
        }
        return Promise.resolve(create_mock_convex_records("test", 2));
      }),
      mutation: vi.fn(),
    };

    const result = await try_seed_all_tables_from_convex(on_progress);

    expect(result.success).toBe(false);
    expect(result.failed_tables.length).toBe(3);
  });

  it("stores records in local database after fetching", async () => {
    const org_records = create_mock_convex_records("organizations", 3);
    mock_convex_client = {
      query: vi
        .fn()
        .mockImplementation((_name: string, args: Record<string, unknown>) => {
          const table_name = args.table_name as string;
          if (table_name === "organizations") {
            return Promise.resolve(org_records);
          }
          return Promise.resolve([]);
        }),
      mutation: vi.fn(),
    };

    await try_seed_all_tables_from_convex(on_progress);

    const org_table = mock_database_tables["organizations"];
    expect(org_table).toBeDefined();
    expect(org_table.bulkPut).toHaveBeenCalledOnce();

    const stored_records = org_table.bulkPut.mock.calls[0][0] as Record<
      string,
      unknown
    >[];
    expect(stored_records.length).toBe(3);
    expect(stored_records[0]).toHaveProperty("id", "organizations_0");
    expect(stored_records[0]).not.toHaveProperty("_id");
    expect(stored_records[0]).not.toHaveProperty("local_id");
  });
});
