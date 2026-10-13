import { describe, expect, it, type Mock, vi } from "vitest";

import { create_change_tracking_gate } from "$lib/adapters/repositories/syncOutbox/syncChangeTrackingGate";

import type { PullTableChangesCommand } from "./syncChangePageFetch";
import {
  create_fake_sync_database,
  type FakeSyncDatabase,
} from "./syncFakeDatabase.test_support";
import {
  pull_table_changes_from_convex,
  SYNC_PULL_PAGE_SIZE,
} from "./syncPullService";
import type { ConvexClient } from "./syncTypes";

function build_page(
  overrides: Record<string, unknown>,
): Record<string, unknown> {
  return {
    success: true,
    status: "changes",
    error: "",
    records: [],
    tombstones: [],
    next_cursor: 0,
    has_more: false,
    ...overrides,
  };
}

interface PullCommandHarness {
  fake: FakeSyncDatabase;
  query: Mock;
  command: PullTableChangesCommand;
}

function create_command(pages: unknown[]): PullCommandHarness {
  const fake = create_fake_sync_database();
  const query = vi.fn();
  pages.forEach((page) => query.mockResolvedValueOnce(page));
  const convex_client: ConvexClient = { query, mutation: vi.fn() };
  return {
    fake,
    query,
    command: {
      convex_client,
      database: fake.database,
      gate: create_change_tracking_gate(),
      table_name: "teams" as const,
      correlation_id: "run_1",
    },
  };
}

const REMOTE_TEAM = {
  _id: "convex_1",
  local_id: "team_a",
  name: "Lions",
  version: 3,
  sync_sequence: 7,
  synced_at: "2024-01-01T00:00:00.000Z",
};

describe("pull_table_changes_from_convex", () => {
  it("pulls every page from the persisted server cursor", async () => {
    const { fake, query, command } = create_command([
      build_page({ records: [REMOTE_TEAM], next_cursor: 7, has_more: true }),
      build_page({
        tombstones: [{ local_id: "team_gone", version: 2, sync_sequence: 8 }],
        next_cursor: 8,
      }),
    ]);
    fake.seed("sync_cursors", [{ table_name: "teams", after_sequence: 5 }]);
    fake.seed("teams", [{ id: "team_gone" }]);
    const result = await pull_table_changes_from_convex(command);
    expect(result).toEqual({
      success: true,
      data: { records_pulled: 2, backfill: { status: "complete" } },
    });
    expect(query.mock.calls.map((call) => call[1])).toEqual([
      {
        table_name: "teams",
        after_sequence: 5,
        page_size: SYNC_PULL_PAGE_SIZE,
      },
      {
        table_name: "teams",
        after_sequence: 7,
        page_size: SYNC_PULL_PAGE_SIZE,
      },
    ]);
    expect(fake.rows("teams")).toEqual([{ id: "team_a", name: "Lions" }]);
    expect(fake.rows("sync_cursors")[0].after_sequence).toBe(8);
  });

  it("fails without touching local data when the server rejects the query", async () => {
    const { fake, command } = create_command([
      { success: false, error: "Access denied", records: [], tombstones: [] },
    ]);
    const result = await pull_table_changes_from_convex(command);
    expect(result).toEqual({ success: false, error: "Access denied" });
    expect(fake.rows("sync_cursors")).toEqual([]);
  });

  it("fails on a malformed response", async () => {
    const { command } = create_command([{ unexpected: true }]);
    expect((await pull_table_changes_from_convex(command)).success).toBe(false);
  });

  it("fails instead of looping when the cursor does not advance", async () => {
    const { command } = create_command([
      build_page({ next_cursor: 0, has_more: true }),
    ]);
    expect((await pull_table_changes_from_convex(command)).success).toBe(false);
  });

  it("returns a failure when the query throws", async () => {
    const { query, command } = create_command([]);
    query.mockRejectedValueOnce(new Error("network down"));
    expect(await pull_table_changes_from_convex(command)).toEqual({
      success: false,
      error: "Error: network down",
    });
  });

  it("fails fast when a successful page does not say what it contains", async () => {
    const { command } = create_command([{ ...build_page({}), status: void 0 }]);
    expect((await pull_table_changes_from_convex(command)).success).toBe(false);
  });

  it("waits for the server backfill without touching local data or the cursor", async () => {
    const { fake, query, command } = create_command([
      build_page({
        status: "backfill_in_progress",
        next_cursor: 5,
        retry_after_milliseconds: 30_000,
      }),
    ]);
    fake.seed("sync_cursors", [{ table_name: "teams", after_sequence: 5 }]);
    fake.seed("teams", [{ id: "team_local_only" }]);

    const result = await pull_table_changes_from_convex(command);

    expect(result).toEqual({
      success: true,
      data: {
        records_pulled: 0,
        backfill: { status: "in_progress", retry_after_milliseconds: 30_000 },
      },
    });
    expect(query).toHaveBeenCalledOnce();
    expect(fake.rows("teams")).toEqual([{ id: "team_local_only" }]);
    expect(fake.rows("sync_cursors")[0].after_sequence).toBe(5);
  });

  it("stops a full resync without deleting anything when the backfill restarts", async () => {
    const { fake, command } = create_command([
      build_page({ status: "cursor_expired" }),
      build_page({
        status: "backfill_in_progress",
        retry_after_milliseconds: 1_000,
      }),
    ]);
    fake.seed("sync_cursors", [{ table_name: "teams", after_sequence: 3 }]);
    fake.seed("teams", [{ id: "team_local_only" }]);

    const result = await pull_table_changes_from_convex(command);

    expect(result).toEqual({
      success: true,
      data: {
        records_pulled: 0,
        backfill: { status: "in_progress", retry_after_milliseconds: 1_000 },
      },
    });
    expect(fake.rows("teams")).toEqual([{ id: "team_local_only" }]);
    expect(fake.rows("sync_cursors")[0].after_sequence).toBe(3);
  });
});
