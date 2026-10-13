import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";

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

function ignore_progress(): boolean {
  return true;
}

describe("try_seed_all_tables_from_convex change cursor", () => {
  beforeEach(() => {
    reset_seeding_test_state();
  });

  it("never advances a table cursor past changes the snapshot did not apply", async () => {
    use_convex_query((_name: string, args: Record<string, unknown>) =>
      Promise.resolve(
        create_mock_convex_records(args.table_name as string, 2).map(
          (record, index) => ({ ...record, sync_sequence: 50 + index }),
        ),
      ),
    );

    await try_seed_all_tables_from_convex(ignore_progress);

    const tables = seeding_test_state.database_tables as unknown as Record<
      string,
      { put: Mock }
    >;
    const cursor_write_count =
      "sync_cursors" in tables ? tables.sync_cursors.put.mock.calls.length : 0;
    expect(cursor_write_count).toBe(0);
    expect(
      seeding_test_state.database_tables["organizations"].bulkPut,
    ).toHaveBeenCalled();
  });
});
