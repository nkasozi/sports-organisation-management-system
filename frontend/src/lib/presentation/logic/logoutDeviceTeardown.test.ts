import { beforeEach, describe, expect, it, vi } from "vitest";

import { execute_logout_device_teardown } from "./logoutDeviceTeardown";
import {
  create_command,
  LANDING_REQUEST,
} from "./logoutDeviceTeardown.test_support";

describe("execute_logout_device_teardown", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("wipes the device, signs out of Clerk, seeds fresh demo data and reloads into the demo", async () => {
    const call_order: string[] = [];

    const teardown_state = await execute_logout_device_teardown(
      create_command(call_order),
      LANDING_REQUEST,
    );

    expect(teardown_state).toEqual({ status: "completed" });
    expect(call_order).toEqual([
      "stop_background_sync",
      "background_sync_idle",
      "cancel_automatic_device_backup_write",
      "delete_device_backup",
      "reset_local_database",
      "replace_local_data_key",
      "clear_session_sync_flag",
      "logout_auth_store",
      "sign_out",
      "seed_signed_out_demo_data",
      "mark_anonymous_demo_session",
      "reload_into:/",
    ]);
  });

  it("treats an already missing or unsupported device backup as removed", async () => {
    for (const delete_state of [
      { status: "already_missing" as const },
      { status: "unsupported" as const },
    ]) {
      const call_order: string[] = [];

      expect(
        await execute_logout_device_teardown(
          create_command(call_order, { delete_state }),
          LANDING_REQUEST,
        ),
      ).toEqual({ status: "completed" });
      expect(call_order).toContain("reset_local_database");
    }
  });

  it("stays signed in when the device backup cannot be deleted", async () => {
    const call_order: string[] = [];

    const teardown_state = await execute_logout_device_teardown(
      create_command(call_order, {
        delete_state: { status: "failed", error: "Locked" },
      }),
      LANDING_REQUEST,
    );

    expect(teardown_state).toEqual({
      status: "failed",
      failed_step: "delete_device_backup",
      error: "Locked",
    });
    expect(call_order).not.toContain("reset_local_database");
    expect(call_order).not.toContain("sign_out");
  });

  it("stays signed in when the local database cannot be reset", async () => {
    const call_order: string[] = [];

    const teardown_state = await execute_logout_device_teardown(
      create_command(call_order, { reset_succeeds: false }),
      LANDING_REQUEST,
    );

    expect(teardown_state).toEqual({
      status: "failed",
      failed_step: "reset_local_database",
      error: "Error: Database blocked",
    });
    expect(call_order).not.toContain("clear_session_sync_flag");
    expect(call_order).not.toContain("sign_out");
  });

  it("still wipes the device and lands in the demo when Clerk cannot be reached, deferring the Clerk sign-out", async () => {
    const call_order: string[] = [];

    const teardown_state = await execute_logout_device_teardown(
      create_command(call_order, { sign_out_succeeds: false }),
      LANDING_REQUEST,
    );

    expect(teardown_state).toEqual({ status: "completed" });
    expect(call_order.slice(-5)).toEqual([
      "sign_out",
      "seed_signed_out_demo_data",
      "mark_anonymous_demo_session",
      "mark_pending_clerk_sign_out",
      "reload_into:/",
    ]);
    expect(call_order).toContain("reset_local_database");
  });

  it("reloads without the demo marker when demo seeding fails so the first-time flow seeds again", async () => {
    const call_order: string[] = [];

    const teardown_state = await execute_logout_device_teardown(
      create_command(call_order, { demo_seed_succeeds: false }),
      LANDING_REQUEST,
    );

    expect(teardown_state).toEqual({ status: "completed" });
    expect(call_order).not.toContain("mark_anonymous_demo_session");
    expect(call_order.at(-1)).toBe("reload_into:/");
    expect(console.error).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ event: "logout_demo_seed_failed" }),
    );
  });
});
