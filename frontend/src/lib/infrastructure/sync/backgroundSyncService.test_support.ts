import { type Mock, vi } from "vitest";

import type { SyncOrchestratorPort } from "$lib/core/interfaces/ports";
import { create_success_result } from "$lib/core/types/Result";

export const PENDING_ENTRY = {
  table_name: "teams",
  local_id: "team_a",
  operation: "upsert",
  base_version: { kind: "unknown" },
  change_token: "token",
  enqueued_at: "2024-01-01T00:00:00.000Z",
  status: "pending",
};

export const SUCCESSFUL_PUSH_RESULT = create_success_result({
  tables_synced: 1,
  records_pushed: 1,
  records_pulled: 0,
  duration_ms: 1,
  conflicts: [],
});

interface OrchestratorMock {
  sync_now: Mock<SyncOrchestratorPort["sync_now"]>;
  is_configured(): boolean;
}

export function create_orchestrator(succeeds = true): OrchestratorMock {
  return {
    sync_now: vi.fn<SyncOrchestratorPort["sync_now"]>(async () =>
      succeeds
        ? create_success_result({
            tables_synced: 1,
            records_pushed: 1,
            records_pulled: 0,
            duration_ms: 1,
            conflicts: [],
          })
        : {
            success: false as const,
            error: { failed_tables: [], message: "down" },
          },
    ),
    is_configured: () => true,
  };
}

export async function flush_async_work(): Promise<void> {
  for (let index = 0; index < 5; index++) await Promise.resolve();
}

export function stub_browser_globals(): boolean {
  vi.stubGlobal("window", {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  });
  vi.stubGlobal("navigator", { onLine: true });
  return true;
}
