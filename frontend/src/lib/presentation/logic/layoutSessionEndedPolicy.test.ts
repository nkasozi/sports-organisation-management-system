import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  handle_device_session_after_sign_out,
  handle_ended_verified_session,
  SESSION_ENDED_OUTCOME,
  type SessionEndedPolicyDependencies,
} from "./layoutSessionEndedPolicy";

const VERIFIED_SYNC = {
  status: "verified_user",
  session_id: "session-1",
  user_id: "user-1",
} as const;

function create_dependencies(
  overrides: Partial<SessionEndedPolicyDependencies> = {},
): SessionEndedPolicyDependencies {
  return {
    resolve_current_device_session: vi.fn(async () => ({
      status: "session_ended" as const,
      verified_sync: VERIFIED_SYNC,
    })),
    get_unsynced_local_change_count: vi.fn(async () => ({
      success: true as const,
      data: 0,
    })),
    sign_out_and_tear_down_device: vi.fn(async () => ({
      success: true as const,
      data: true,
    })),
    lock_to_public_viewer: vi.fn(async () => true),
    show_session_ended_notice: vi.fn(() => true),
    show_session_ended_notice_without_count: vi.fn(() => true),
    show_session_notice: vi.fn(() => true),
    ...overrides,
  };
}

describe("handle_ended_verified_session", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  it("runs the normal logout teardown when nothing is waiting to sync", async () => {
    const dependencies = create_dependencies();

    const result = await handle_ended_verified_session(dependencies);

    expect(result).toEqual({
      success: true,
      data: SESSION_ENDED_OUTCOME.TORN_DOWN,
    });
    expect(dependencies.sign_out_and_tear_down_device).toHaveBeenCalledWith(
      "/",
    );
    expect(dependencies.lock_to_public_viewer).not.toHaveBeenCalled();
  });

  it("keeps unsynced changes, locks to the public viewer and explains how to recover them", async () => {
    const dependencies = create_dependencies({
      get_unsynced_local_change_count: vi.fn(async () => ({
        success: true as const,
        data: 5,
      })),
    });

    const result = await handle_ended_verified_session(dependencies);

    expect(result).toEqual({
      success: true,
      data: SESSION_ENDED_OUTCOME.LOCKED_WITH_UNSYNCED_CHANGES,
    });
    expect(dependencies.sign_out_and_tear_down_device).not.toHaveBeenCalled();
    expect(dependencies.lock_to_public_viewer).toHaveBeenCalledTimes(1);
    expect(dependencies.show_session_ended_notice).toHaveBeenCalledWith(5);
  });

  it("never wipes the device when the unsynced count cannot be read", async () => {
    const dependencies = create_dependencies({
      get_unsynced_local_change_count: vi.fn(async () => ({
        success: false as const,
        error: "outbox unreadable",
      })),
    });

    const result = await handle_ended_verified_session(dependencies);

    expect(result).toEqual({
      success: true,
      data: SESSION_ENDED_OUTCOME.LOCKED_COUNT_UNAVAILABLE,
    });
    expect(dependencies.sign_out_and_tear_down_device).not.toHaveBeenCalled();
    expect(dependencies.lock_to_public_viewer).toHaveBeenCalledTimes(1);
    expect(
      dependencies.show_session_ended_notice_without_count,
    ).toHaveBeenCalledTimes(1);
    expect(dependencies.show_session_notice).not.toHaveBeenCalled();
  });

  it("locks the device and reports a failed teardown", async () => {
    const dependencies = create_dependencies({
      sign_out_and_tear_down_device: vi.fn(async () => ({
        success: false as const,
        error: "reset_local_database: blocked",
      })),
    });

    const result = await handle_ended_verified_session(dependencies);

    expect(result.success).toBe(false);
    expect(dependencies.lock_to_public_viewer).toHaveBeenCalledTimes(1);
    expect(dependencies.show_session_notice).toHaveBeenCalledWith(
      "sign_out_cleanup_failed",
    );
  });
});

describe("handle_device_session_after_sign_out", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  it("keeps the user working offline when Clerk is merely unreachable", async () => {
    const dependencies = create_dependencies({
      resolve_current_device_session: vi.fn(async () => ({
        status: "offline_verified" as const,
        verified_sync: VERIFIED_SYNC,
      })),
    });

    const result = await handle_device_session_after_sign_out(dependencies);

    expect(result).toEqual({
      success: true,
      data: SESSION_ENDED_OUTCOME.CONTINUED_OFFLINE,
    });
    expect(dependencies.get_unsynced_local_change_count).not.toHaveBeenCalled();
    expect(dependencies.sign_out_and_tear_down_device).not.toHaveBeenCalled();
    expect(dependencies.lock_to_public_viewer).not.toHaveBeenCalled();
  });

  it("applies the ended-session policy when Clerk confirms the sign-out", async () => {
    const dependencies = create_dependencies();

    const result = await handle_device_session_after_sign_out(dependencies);

    expect(result).toEqual({
      success: true,
      data: SESSION_ENDED_OUTCOME.TORN_DOWN,
    });
  });

  it.each([
    { status: "anonymous" as const },
    {
      status: "signed_in" as const,
      identity: {
        status: "signed_in" as const,
        session_id: "session-2",
        user_id: "user-1",
      },
    },
  ])("leaves a $status device alone", async (device_session) => {
    const dependencies = create_dependencies({
      resolve_current_device_session: vi.fn(async () => device_session),
    });

    const result = await handle_device_session_after_sign_out(dependencies);

    expect(result).toEqual({
      success: true,
      data: SESSION_ENDED_OUTCOME.NO_ACTION,
    });
    expect(dependencies.sign_out_and_tear_down_device).not.toHaveBeenCalled();
  });
});
