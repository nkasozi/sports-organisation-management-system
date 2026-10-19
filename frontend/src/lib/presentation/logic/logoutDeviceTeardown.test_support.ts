import type { DeviceBackupDeleteState } from "$lib/infrastructure/backup/storageBackupContracts";

import type { LogoutDeviceTeardownCommand } from "./logoutDeviceTeardown";

export const LANDING_REQUEST = { landing_path: "/" };

interface CommandOptions {
  delete_state: DeviceBackupDeleteState;
  reset_succeeds: boolean;
  key_replacement_succeeds: boolean;
  sign_out_succeeds: boolean;
  demo_seed_succeeds: boolean;
}

const DEFAULT_OPTIONS: CommandOptions = {
  delete_state: { status: "deleted" },
  reset_succeeds: true,
  key_replacement_succeeds: true,
  sign_out_succeeds: true,
  demo_seed_succeeds: true,
};

function record(call_order: string[], step: string): boolean {
  call_order.push(step);
  return true;
}

export function create_command(
  call_order: string[],
  overrides: Partial<CommandOptions> = {},
): LogoutDeviceTeardownCommand {
  const options = { ...DEFAULT_OPTIONS, ...overrides };
  return {
    stop_background_sync: async () => {
      record(call_order, "stop_background_sync");
      await new Promise((resolve) => setTimeout(resolve, 0));
      return record(call_order, "background_sync_idle");
    },
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
    replace_local_data_key: async () => {
      record(call_order, "replace_local_data_key");
      return options.key_replacement_succeeds
        ? { success: true as const, data: "device" }
        : { success: false as const, error: "Key storage blocked" };
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
    seed_signed_out_demo_data: async () => {
      record(call_order, "seed_signed_out_demo_data");
      return options.demo_seed_succeeds
        ? { success: true as const, data: true }
        : { success: false as const, error: "seed failed" };
    },
    mark_anonymous_demo_session: async () =>
      record(call_order, "mark_anonymous_demo_session"),
    mark_pending_clerk_sign_out: async () =>
      record(call_order, "mark_pending_clerk_sign_out"),
    reload_into: (landing_path: string) =>
      record(call_order, `reload_into:${landing_path}`),
  };
}
