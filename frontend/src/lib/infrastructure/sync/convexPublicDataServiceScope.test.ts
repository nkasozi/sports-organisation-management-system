import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { create_none_option, create_some_option } from "$lib/core/types/Option";

import { fetch_public_data_from_convex } from "./convexPublicDataService";

const query_calls: Array<Record<string, unknown>> = [];
const query_state = { never_resolves: false };

vi.mock("$lib/adapters/repositories/database", () => ({
  get_database: () => ({}),
}));

vi.mock("./syncRemoteApplyRecords", () => ({
  apply_remote_snapshot_records: async (): Promise<boolean> => true,
  SnapshotRecordScope: { PUBLIC_PROJECTION: "public_projection" },
}));

vi.mock("./convexSyncService", () => ({
  get_sync_manager: () => ({
    get_convex_client: () => ({
      success: true,
      data: {
        query: async (
          _name: string,
          args: Record<string, unknown>,
        ): Promise<unknown> => {
          query_calls.push(args);
          if (query_state.never_resolves) return new Promise(() => {});
          return {
            success: true,
            error: "",
            records: [{ local_id: "a", version: 1 }],
            next_cursor: "",
            has_more: false,
          };
        },
      },
    }),
  }),
}));

describe("fetch_public_data_from_convex organization scope", () => {
  beforeEach(() => {
    query_calls.length = 0;
    query_state.never_resolves = false;
    vi.stubGlobal("navigator", { onLine: true });
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("asks for the selected organization's records on every table", async () => {
    const result = await fetch_public_data_from_convex(
      "calendar",
      create_some_option("org_9"),
    );

    expect(result.success).toBe(true);
    expect(query_calls).toHaveLength(7);
    expect(query_calls.every((args) => args.organization_id === "org_9")).toBe(
      true,
    );
  });

  it("only fetches organization-independent tables when no organization is chosen", async () => {
    const result = await fetch_public_data_from_convex(
      "calendar",
      create_none_option(),
    );

    expect(query_calls.map((args) => args.table_name)).toEqual([
      "organizations",
      "sports",
      "activity_categories",
    ]);
    expect(query_calls.some((args) => "organization_id" in args)).toBe(false);
    expect(result).toEqual({
      success: true,
      tables_fetched: 3,
      total_records: 3,
    });
  });

  it("keeps the per-table timeout when the server never answers", async () => {
    vi.useFakeTimers();
    query_state.never_resolves = true;

    const pending = fetch_public_data_from_convex(
      "calendar",
      create_none_option(),
    );
    await vi.advanceTimersByTimeAsync(8000 * 3);
    const result = await pending;

    expect(result.success).toBe(false);
    expect(result.tables_fetched).toBe(0);
  });
});
