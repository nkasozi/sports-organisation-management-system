import { beforeEach, describe, expect, it, vi } from "vitest";

import { try_seed_all_tables_from_convex } from "./convexSeedingService";
import {
  create_mock_convex_records,
  reset_seeding_test_state,
  seeding_test_state,
  use_convex_query,
} from "./convexSeedingService.test_support";

vi.mock("$lib/adapters/repositories/database", async () =>
  (await import("./convexSeedingService.test_support")).create_database_mock(),
);
vi.mock("./convexSyncService", async () =>
  (
    await import("./convexSeedingService.test_support")
  ).create_sync_service_mock(),
);

const NETWORK_ERROR_MESSAGE = "Network error";

function ignore_progress(): boolean {
  return true;
}

describe("try_seed_all_tables_from_convex failures and storage", () => {
  beforeEach(() => {
    reset_seeding_test_state();
  });

  it("handles partial failures gracefully", async () => {
    let call_count = 0;
    use_convex_query((_name: string, args: Record<string, unknown>) => {
      call_count++;
      if (call_count === 1)
        return Promise.reject(new Error(NETWORK_ERROR_MESSAGE));
      return Promise.resolve(
        create_mock_convex_records(args.table_name as string, 3),
      );
    });

    const result = await try_seed_all_tables_from_convex(ignore_progress);

    expect(result.success).toBe(true);
    expect(result.tables_fetched).toBe(4);
    expect(result.total_records).toBe(12);
    expect(result.failed_tables.length).toBe(1);
  });

  it("returns failure when too many tables fail", async () => {
    let call_count = 0;
    use_convex_query(() => {
      call_count++;
      if (call_count <= 3)
        return Promise.reject(new Error(NETWORK_ERROR_MESSAGE));
      return Promise.resolve(create_mock_convex_records("test", 2));
    });

    const result = await try_seed_all_tables_from_convex(ignore_progress);

    expect(result.success).toBe(false);
    expect(result.failed_tables.length).toBe(3);
  });

  it("stores records in local database after fetching", async () => {
    const org_records = create_mock_convex_records("organizations", 3);
    use_convex_query((_name: string, args: Record<string, unknown>) =>
      Promise.resolve(args.table_name === "organizations" ? org_records : []),
    );

    await try_seed_all_tables_from_convex(ignore_progress);

    const org_table = seeding_test_state.database_tables["organizations"];
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
