import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  build_logout_discard_message,
  evaluate_logout_request,
  LOGOUT_DISCARD_REASON,
  LOGOUT_WARNING_MODAL_STATE,
  type LogoutWarningSyncPort,
} from "./logoutWarningModalLogic";

function create_sync_port(
  counts: number[],
  overrides: Partial<LogoutWarningSyncPort> = {},
): LogoutWarningSyncPort {
  const remaining_counts = [...counts];
  return {
    get_unsynced_local_change_count: vi.fn(async () => ({
      success: true as const,
      data:
        remaining_counts.length > 1
          ? (remaining_counts.shift() ?? 0)
          : (remaining_counts[0] ?? 0),
    })),
    is_online: vi.fn(() => true),
    flush_pending_changes: vi.fn(async () => ({
      success: true as const,
      data: { skipped_offline: false },
    })),
    ...overrides,
  };
}

describe("evaluate_logout_request", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  it("signs out straight away when nothing is waiting to sync", async () => {
    const sync_port = create_sync_port([0]);
    const on_syncing = vi.fn(() => true);

    await expect(
      evaluate_logout_request(sync_port, on_syncing),
    ).resolves.toEqual({ state: LOGOUT_WARNING_MODAL_STATE.READY_TO_SIGN_OUT });
    expect(sync_port.flush_pending_changes).not.toHaveBeenCalled();
    expect(on_syncing).not.toHaveBeenCalled();
  });

  it("warns with the unsynced count without trying to sync while offline", async () => {
    const sync_port = create_sync_port([3], { is_online: vi.fn(() => false) });

    await expect(
      evaluate_logout_request(sync_port, () => true),
    ).resolves.toEqual({
      state: LOGOUT_WARNING_MODAL_STATE.DISCARD_WARNING,
      unsynced_change_count: 3,
      reason: LOGOUT_DISCARD_REASON.OFFLINE,
    });
    expect(sync_port.flush_pending_changes).not.toHaveBeenCalled();
  });

  it("syncs first when online and signs out once everything was pushed", async () => {
    const sync_port = create_sync_port([2, 0]);
    const on_syncing = vi.fn(() => true);

    await expect(
      evaluate_logout_request(sync_port, on_syncing),
    ).resolves.toEqual({ state: LOGOUT_WARNING_MODAL_STATE.READY_TO_SIGN_OUT });
    expect(on_syncing).toHaveBeenCalledTimes(1);
    expect(sync_port.flush_pending_changes).toHaveBeenCalledTimes(1);
  });

  it("warns with the remaining count when the sync fails", async () => {
    const sync_port = create_sync_port([4, 1], {
      flush_pending_changes: vi.fn(async () => ({
        success: false as const,
        error: "1 changes still unsynced",
      })),
    });

    await expect(
      evaluate_logout_request(sync_port, () => true),
    ).resolves.toEqual({
      state: LOGOUT_WARNING_MODAL_STATE.DISCARD_WARNING,
      unsynced_change_count: 1,
      reason: LOGOUT_DISCARD_REASON.SYNC_FAILED,
    });
  });

  it("treats a sync skipped for being offline as an offline warning", async () => {
    const sync_port = create_sync_port([2, 2], {
      flush_pending_changes: vi.fn(async () => ({
        success: true as const,
        data: { skipped_offline: true },
      })),
    });

    await expect(
      evaluate_logout_request(sync_port, () => true),
    ).resolves.toEqual({
      state: LOGOUT_WARNING_MODAL_STATE.DISCARD_WARNING,
      unsynced_change_count: 2,
      reason: LOGOUT_DISCARD_REASON.OFFLINE,
    });
  });

  it("asks for confirmation when the unsynced count cannot be read", async () => {
    const sync_port = create_sync_port([0], {
      get_unsynced_local_change_count: vi.fn(async () => ({
        success: false as const,
        error: "outbox unreadable",
      })),
    });

    await expect(
      evaluate_logout_request(sync_port, () => true),
    ).resolves.toEqual({
      state: LOGOUT_WARNING_MODAL_STATE.COUNT_UNAVAILABLE,
    });
  });
});

describe("build_logout_discard_message", () => {
  it("states how many changes will be permanently deleted", () => {
    expect(build_logout_discard_message(3)).toBe(
      "You have 3 changes that have not been synced. Signing out will permanently delete them from this device.",
    );
    expect(build_logout_discard_message(1)).toBe(
      "You have 1 change that has not been synced. Signing out will permanently delete it from this device.",
    );
  });
});
