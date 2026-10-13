import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { fetch_public_data_from_convex } from "./convexPublicDataService";

const applied_tables: Array<{ table_name: string; count: number }> = [];
const queried_tables: string[] = [];
const client_state = {
  is_configured: true,
  failing_tables: new Set<string>(),
  empty_tables: new Set<string>(),
};

vi.mock("$lib/adapters/repositories/database", () => ({
  get_database: () => ({}),
}));

vi.mock("./syncRemoteApplyRecords", () => ({
  apply_remote_snapshot_records: async (
    _context: unknown,
    table_name: string,
    records: unknown[],
  ): Promise<boolean> => {
    applied_tables.push({ table_name, count: records.length });
    return true;
  },
  SnapshotCursorPolicy: { KEEP_CURSOR: "keep_cursor" },
}));

vi.mock("./convexSyncService", () => ({
  get_sync_manager: () => ({
    get_convex_client: () =>
      client_state.is_configured
        ? {
            success: true,
            data: {
              query: async (
                _name: string,
                args: { table_name: string },
              ): Promise<unknown> => {
                queried_tables.push(args.table_name);
                if (client_state.failing_tables.has(args.table_name)) {
                  return Promise.reject(new Error("boom"));
                }
                if (client_state.empty_tables.has(args.table_name)) {
                  return [];
                }
                return [{ _id: "a", local_id: "a", synced_at: "", version: 1 }];
              },
            },
          }
        : { success: false, error: "not configured" },
  }),
}));

const CALENDAR_TABLES = [
  "organizations",
  "competitions",
  "teams",
  "fixtures",
  "activities",
  "activity_categories",
];

describe("fetch_public_data_from_convex", () => {
  beforeEach(() => {
    applied_tables.length = 0;
    queried_tables.length = 0;
    client_state.is_configured = true;
    client_state.failing_tables = new Set();
    client_state.empty_tables = new Set();
    vi.stubGlobal("navigator", { onLine: true });
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("returns offline failure when the device is offline", async () => {
    vi.stubGlobal("navigator", { onLine: false });

    const result = await fetch_public_data_from_convex("calendar");

    expect(result).toEqual({
      success: false,
      tables_fetched: 0,
      total_records: 0,
      error: "offline",
    });
    expect(queried_tables).toEqual([]);
  });

  it("returns convex_not_available when the client is missing", async () => {
    client_state.is_configured = false;

    const result = await fetch_public_data_from_convex("calendar");

    expect(result).toEqual({
      success: false,
      tables_fetched: 0,
      total_records: 0,
      error: "convex_not_available",
    });
  });

  it("fetches calendar tables in order and counts records", async () => {
    client_state.empty_tables = new Set(["teams"]);

    const result = await fetch_public_data_from_convex("calendar");

    expect(queried_tables).toEqual(CALENDAR_TABLES);
    expect(applied_tables.map((entry) => entry.table_name)).toEqual(
      CALENDAR_TABLES.filter((table_name) => table_name !== "teams"),
    );
    expect(result).toEqual({
      success: true,
      tables_fetched: 6,
      total_records: 5,
    });
  });

  it("uses the table list for each page type", async () => {
    const results_fetch = await fetch_public_data_from_convex(
      "competition_results",
    );
    expect(results_fetch.success).toBe(true);
    expect(queried_tables).toHaveLength(13);
    expect(queried_tables).toContain("competition_teams");

    queried_tables.length = 0;
    const report_fetch = await fetch_public_data_from_convex("match_report");
    expect(report_fetch.success).toBe(true);
    expect(queried_tables).toHaveLength(15);
    expect(queried_tables).toContain("player_team_memberships");
  });

  it("continues past failed tables and reports them", async () => {
    client_state.failing_tables = new Set(["teams", "activities"]);

    const result = await fetch_public_data_from_convex("calendar");

    expect(queried_tables).toEqual(CALENDAR_TABLES);
    expect(result).toEqual({
      success: false,
      tables_fetched: 4,
      total_records: 4,
      error: "Failed tables: teams, activities",
    });
    expect(console.warn).toHaveBeenCalledWith(
      "[PublicData] Failed to fetch table",
      {
        event: "public_data_fetch_table_failed",
        table_name: "teams",
        error: "boom",
      },
    );
    expect(console.log).toHaveBeenLastCalledWith(
      "[PublicData] Fetch complete",
      {
        event: "public_data_fetch_completed",
        tables_fetched: 4,
        table_count: 6,
        total_records: 4,
        failed_tables: ["teams", "activities"],
      },
    );
  });
});
