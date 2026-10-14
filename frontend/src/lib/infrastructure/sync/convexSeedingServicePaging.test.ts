import { beforeEach, describe, expect, it, vi } from "vitest";

import { try_seed_all_tables_from_convex } from "./convexSeedingService";
import {
  create_mock_convex_records,
  reset_seeding_test_state,
  seeding_test_state,
  use_raw_convex_query,
} from "./convexSeedingService.test_support";

vi.mock("$lib/adapters/repositories/database", async () =>
  (await import("./convexSeedingService.test_support")).create_database_mock(),
);
vi.mock("./convexSyncService", async () =>
  (
    await import("./convexSeedingService.test_support")
  ).create_sync_service_mock(),
);

const query_calls: Array<{ name: string; args: Record<string, unknown> }> = [];

function ignore_progress(): boolean {
  return true;
}

function build_page(
  table_name: string,
  after_local_id: unknown,
): Record<string, unknown> {
  const is_first_page = after_local_id === "";
  const records = create_mock_convex_records(table_name, 2).map((record) => ({
    ...record,
    local_id: `${record.local_id}_${is_first_page ? "first" : "second"}`,
  }));
  return {
    success: true,
    error: "",
    records,
    next_cursor: records[records.length - 1].local_id,
    has_more: is_first_page,
  };
}

describe("try_seed_all_tables_from_convex record paging", () => {
  beforeEach(() => {
    reset_seeding_test_state();
    query_calls.length = 0;
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  it("pages every table through get_records_page", async () => {
    use_raw_convex_query(async (name, args) => {
      query_calls.push({ name, args });
      return build_page(String(args.table_name), args.after_local_id);
    });

    const result = await try_seed_all_tables_from_convex(ignore_progress);

    expect(result.success).toBe(true);
    expect(result.total_records).toBe(20);
    expect(new Set(query_calls.map((call) => call.name))).toEqual(
      new Set(["sync:get_records_page"]),
    );
    expect(
      query_calls.filter((call) => call.args.table_name === "teams"),
    ).toHaveLength(2);
    expect(
      seeding_test_state.database_tables["teams"].bulkPut,
    ).toHaveBeenCalled();
  });

  it("counts a table whose page request fails as failed", async () => {
    use_raw_convex_query(async (_name, args) =>
      args.table_name === "teams"
        ? { success: false, error: "Invalid request" }
        : build_page(String(args.table_name), "last"),
    );

    const result = await try_seed_all_tables_from_convex(ignore_progress);

    expect(result.failed_tables).toEqual(["teams"]);
    expect(result.tables_fetched).toBe(4);
  });
});
