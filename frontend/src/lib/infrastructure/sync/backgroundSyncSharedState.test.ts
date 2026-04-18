import { describe, expect, it } from "vitest";

import { create_success_result } from "$lib/core/types/Result";

import {
  reset_sync_state,
  sync_deps,
  sync_state,
} from "./backgroundSyncSharedState";

describe("backgroundSyncSharedState", () => {
  it("resets timers and dependencies to explicit idle states", () => {
    sync_state.is_running = true;
    sync_state.has_pending_changes = true;
    sync_state.debounce_timer = {
      status: "scheduled",
      timer_id: 1 as unknown as ReturnType<typeof setTimeout>,
    };
    sync_state.offline_retry_timer = {
      status: "scheduled",
      timer_id: 2 as unknown as ReturnType<typeof setInterval>,
    };
    sync_state.scheduled_sync_timer = {
      status: "scheduled",
      timer_id: 3 as unknown as ReturnType<typeof setInterval>,
    };
    sync_deps.orchestrator = {
      status: "configured",
      value: {
        sync_now: async () => ({ success: true, data: { records_pushed: 0 } }),
        is_configured: () => true,
      } as never,
    };
    sync_deps.restoration_handlers = {
      status: "configured",
      value: {
        start_remote_sync: () => create_success_result(true),
        stop_remote_sync: () => create_success_result(true),
      },
    };
    sync_deps.remote_subscriber = {
      status: "configured",
      value: {
        get_cached_table_timestamps: () => ({}),
        is_running: () => false,
        start: () => create_success_result(true),
        stop: () => create_success_result(true),
      } as never,
    };

    reset_sync_state();

    expect(sync_state.is_running).toBe(false);
    expect(sync_state.has_pending_changes).toBe(false);
    expect(sync_state.debounce_timer.status).toBe("idle");
    expect(sync_state.offline_retry_timer.status).toBe("idle");
    expect(sync_state.scheduled_sync_timer.status).toBe("idle");
    expect(sync_deps.orchestrator.status).toBe("unconfigured");
    expect(sync_deps.restoration_handlers.status).toBe("unconfigured");
    expect(sync_deps.remote_subscriber.status).toBe("unconfigured");
  });
});
