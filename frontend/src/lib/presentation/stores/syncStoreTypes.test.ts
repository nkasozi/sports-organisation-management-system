import { describe, expect, it } from "vitest";

import { SYNC_INITIAL_STATE } from "./syncStoreTypes";

describe("syncStoreTypes", () => {
  it("defines an idle and unconfigured initial sync state", () => {
    expect(SYNC_INITIAL_STATE).toEqual({
      is_configured: false,
      is_syncing: false,
      last_sync_at: null,
      last_sync_result: null,
      current_progress: null,
      auto_sync_enabled: false,
      error_message: null,
      has_pending_conflicts: false,
    });
  });
});
