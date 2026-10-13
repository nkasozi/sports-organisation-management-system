import { describe, expect, it, vi } from "vitest";

import { sync_all_tables } from "./syncOrchestrator";
import { sync_run_cancellation } from "./syncRunSignals";
import type { ConvexClient } from "./syncTypes";

const table_calls = vi.hoisted(() => ({ table_names: [] as string[] }));

vi.mock("../../presentation/stores/auth", () => ({
  current_user_role: {
    subscribe: (listener: (value: string) => void) => {
      listener("super_admin");
      return () => true;
    },
  },
}));

vi.mock("./syncDataAccess", () => ({ get_database: () => ({}) }));

vi.mock("./syncOrchestratorPendingTables", () => ({
  load_tables_with_pending_changes: async () => ({
    success: true,
    data: new Set<string>(),
  }),
}));

vi.mock("./syncTableSync", () => ({
  sync_table_changes: async (command: { table_name: string }) => {
    table_calls.table_names.push(command.table_name);
    sync_run_cancellation.cancel_active_runs();
    return {
      records_pushed: 0,
      records_pulled: 0,
      errors: [],
      conflicts: [],
      rejected_records: [],
      deleted_remotely: [],
      auth_failed: false,
      success: true,
    };
  },
}));

describe("sync_all_tables cancellation", () => {
  it("stops between tables once the engine cancels the run", async () => {
    const convex_client = {
      query: vi.fn().mockResolvedValue({ authenticated: true }),
      mutation: vi.fn(),
    } as unknown as ConvexClient;

    const result = await sync_all_tables(convex_client, "pull", [
      "teams",
      "players",
    ]);

    expect(table_calls.table_names).toEqual(["teams"]);
    expect(result.success).toBe(false);
    expect(result.errors[0].error).toBe("Sync run cancelled");
  });
});
