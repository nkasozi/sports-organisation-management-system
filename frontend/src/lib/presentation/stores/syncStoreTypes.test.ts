import { describe, expect, it } from "vitest";

import { SYNC_INITIAL_STATE } from "./syncStoreTypes";

describe("syncStoreTypes", () => {
  it("defines an idle and unconfigured initial sync state", () => {
    expect(SYNC_INITIAL_STATE).toEqual({
      is_configured: false,
      is_syncing: false,
      last_sync_at: { status: "never" },
      last_sync_result: { status: "empty" },
      current_progress: { status: "idle" },
      auto_sync_enabled: false,
      error_message: { status: "clear" },
      has_pending_conflicts: false,
    });
  });
});
