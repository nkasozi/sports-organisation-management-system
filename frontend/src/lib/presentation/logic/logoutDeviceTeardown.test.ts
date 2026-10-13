import { describe, expect, it } from "vitest";

import type { DeviceBackupDeleteState } from "$lib/infrastructure/backup/storageBackupContracts";

import {
  execute_logout_device_teardown,
  type LogoutDeviceTeardownCommand,
} from "./logoutDeviceTeardown";

const LANDING_REQUEST = { landing_path: "/sign-in" };

interface CommandOptions {
  delete_state: DeviceBackupDeleteState;
  reset_succeeds: boolean;
  sign_out_succeeds: boolean;
}

const DEFAULT_OPTIONS: CommandOptions = {
  delete_state: { status: "deleted" },
  reset_succeeds: true,
  sign_out_succeeds: true,
};

function record(call_order: string[], step: string): boolean {
  call_order.push(step);
  return true;
}

function create_command(
  call_order: string[],
  overrides: Partial<CommandOptions> = {},
): LogoutDeviceTeardownCommand {
  const options = { ...DEFAULT_OPTIONS, ...overrides };
  return {
    stop_background_sync: () => record(call_order, "stop_background_sync"),
    cancel_automatic_device_backup_write: () =>
      record(call_order, "cancel_automatic_device_backup_write"),
    delete_device_backup: async () => {
      record(call_order, "delete_device_backup");
      return options.delete_state;
    },
    reset_local_database: async () => {
      record(call_order, "reset_local_database");
      if (!options.reset_succeeds)
        return Promise.reject(new Error("Database blocked"));
      return true;
    },
    clear_session_sync_flag: async () =>
      record(call_order, "clear_session_sync_flag"),
    logout_auth_store: async () => record(call_order, "logout_auth_store"),
    sign_out: async () => {
      record(call_order, "sign_out");
      return options.sign_out_succeeds
        ? { success: true as const, data: true as const }
        : { success: false as const, error: "Clerk not initialized" };
    },
    reload_into: (landing_path: string) =>
      record(call_order, `reload_into:${landing_path}`),
  };
}

describe("execute_logout_device_teardown", () => {
  it("clears the device before signing out of Clerk and then reloads", async () => {
    const call_order: string[] = [];

    const teardown_state = await execute_logout_device_teardown(
      create_command(call_order),
      LANDING_REQUEST,
    );

    expect(teardown_state).toEqual({ status: "completed" });
    expect(call_order).toEqual([
      "stop_background_sync",
      "cancel_automatic_device_backup_write",
      "delete_device_backup",
      "reset_local_database",
      "clear_session_sync_flag",
      "logout_auth_store",
      "sign_out",
      "reload_into:/sign-in",
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

  it("does not reload when Clerk sign-out fails", async () => {
    const call_order: string[] = [];

    const teardown_state = await execute_logout_device_teardown(
      create_command(call_order, { sign_out_succeeds: false }),
      LANDING_REQUEST,
    );

    expect(teardown_state).toEqual({
      status: "failed",
      failed_step: "clerk_sign_out",
      error: "Clerk not initialized",
    });
    expect(call_order).not.toContain("reload_into:/sign-in");
  });
});
