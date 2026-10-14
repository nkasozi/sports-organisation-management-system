import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  create_logout_sync_stop_control,
  evaluate_logout_request_with_stop,
  LOGOUT_DISCARD_REASON,
  LOGOUT_WARNING_MODAL_STATE,
  type LogoutWarningSyncPort,
} from "./logoutWarningModalLogic";

function create_hanging_sync_port(): LogoutWarningSyncPort {
  return {
    get_unsynced_local_change_count: vi.fn(async () => ({
      success: true as const,
      data: 2,
    })),
    is_online: vi.fn(() => true),
    flush_pending_changes: vi.fn(() => new Promise<never>(() => {})),
  };
}

describe("evaluate_logout_request_with_stop", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("moves to the discard warning when the user stops a slow sync", async () => {
    const stop_control = create_logout_sync_stop_control();
    const on_syncing = vi.fn(() => true);
    const pending = evaluate_logout_request_with_stop(
      create_hanging_sync_port(),
      on_syncing,
      stop_control,
    );
    await vi.waitFor(() => expect(on_syncing).toHaveBeenCalled());
    stop_control.stop();

    await expect(pending).resolves.toEqual({
      state: LOGOUT_WARNING_MODAL_STATE.DISCARD_WARNING,
      unsynced_change_count: 2,
      reason: LOGOUT_DISCARD_REASON.SYNC_STOPPED,
    });
  });

  it("gives up on a sync that hangs and warns about the unsynced changes", async () => {
    vi.useFakeTimers();
    const pending = evaluate_logout_request_with_stop(
      create_hanging_sync_port(),
      () => true,
      create_logout_sync_stop_control(),
    );
    await vi.advanceTimersByTimeAsync(20_000);

    await expect(pending).resolves.toEqual({
      state: LOGOUT_WARNING_MODAL_STATE.DISCARD_WARNING,
      unsynced_change_count: 2,
      reason: LOGOUT_DISCARD_REASON.SYNC_FAILED,
    });
  });
});
