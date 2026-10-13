import type { AsyncResult } from "$lib/core/types/Result";
import type { DeviceBackupDeleteState } from "$lib/infrastructure/backup/storageBackupContracts";
import { DEVICE_BACKUP_DELETE_STATUS } from "$lib/infrastructure/backup/storageBackupStatus";

export const LOGOUT_DEVICE_TEARDOWN_STATUS = {
  COMPLETED: "completed",
  FAILED: "failed",
} as const;

const LOGOUT_DEVICE_TEARDOWN_STEP = {
  DELETE_DEVICE_BACKUP: "delete_device_backup",
  RESET_LOCAL_DATABASE: "reset_local_database",
  CLEAR_SESSION_SYNC_MARKER: "clear_session_sync_marker",
  CLEAR_AUTH_STORE: "clear_auth_store",
  CLERK_SIGN_OUT: "clerk_sign_out",
} as const;

const LOGOUT_DEVICE_TEARDOWN_COMPLETED_EVENT =
  "logout_device_teardown_completed";
const LOGOUT_DEVICE_TEARDOWN_FAILED_EVENT = "logout_device_teardown_failed";

type LogoutDeviceTeardownStep =
  (typeof LOGOUT_DEVICE_TEARDOWN_STEP)[keyof typeof LOGOUT_DEVICE_TEARDOWN_STEP];

type LogoutDeviceTeardownState =
  | { status: typeof LOGOUT_DEVICE_TEARDOWN_STATUS.COMPLETED }
  | {
      status: typeof LOGOUT_DEVICE_TEARDOWN_STATUS.FAILED;
      failed_step: LogoutDeviceTeardownStep;
      error: string;
    };

export interface LogoutDeviceTeardownCommand {
  stop_background_sync(): boolean;
  cancel_automatic_device_backup_write(): boolean;
  delete_device_backup(): Promise<DeviceBackupDeleteState>;
  reset_local_database(): Promise<boolean>;
  clear_session_sync_flag(): Promise<unknown>;
  logout_auth_store(): Promise<unknown>;
  sign_out(): AsyncResult<true>;
  reload_into(landing_path: string): boolean;
}

interface LogoutDeviceTeardownRequest {
  landing_path: string;
}

const COMPLETED_STATE: LogoutDeviceTeardownState = {
  status: LOGOUT_DEVICE_TEARDOWN_STATUS.COMPLETED,
};

function fail_teardown(
  failed_step: LogoutDeviceTeardownStep,
  error: string,
): LogoutDeviceTeardownState {
  console.error("[Logout] Device teardown failed", {
    event: LOGOUT_DEVICE_TEARDOWN_FAILED_EVENT,
    failed_step,
    error,
  });
  return { status: LOGOUT_DEVICE_TEARDOWN_STATUS.FAILED, failed_step, error };
}

async function run_teardown_step(
  step: LogoutDeviceTeardownStep,
  action: () => Promise<unknown>,
): Promise<LogoutDeviceTeardownState> {
  try {
    await action();
    return COMPLETED_STATE;
  } catch (error) {
    return fail_teardown(step, String(error));
  }
}

async function delete_device_backup_step(
  command: LogoutDeviceTeardownCommand,
): Promise<LogoutDeviceTeardownState> {
  const delete_state = await command.delete_device_backup();
  return delete_state.status === DEVICE_BACKUP_DELETE_STATUS.FAILED
    ? fail_teardown(
        LOGOUT_DEVICE_TEARDOWN_STEP.DELETE_DEVICE_BACKUP,
        delete_state.error,
      )
    : COMPLETED_STATE;
}

async function clerk_sign_out_step(
  command: LogoutDeviceTeardownCommand,
): Promise<LogoutDeviceTeardownState> {
  const sign_out_result = await command.sign_out();
  return sign_out_result.success
    ? COMPLETED_STATE
    : fail_teardown(
        LOGOUT_DEVICE_TEARDOWN_STEP.CLERK_SIGN_OUT,
        sign_out_result.error,
      );
}

function build_ordered_teardown_steps(
  command: LogoutDeviceTeardownCommand,
): Array<() => Promise<LogoutDeviceTeardownState>> {
  const STEP = LOGOUT_DEVICE_TEARDOWN_STEP;
  return [
    () => delete_device_backup_step(command),
    () =>
      run_teardown_step(STEP.RESET_LOCAL_DATABASE, () =>
        command.reset_local_database(),
      ),
    () =>
      run_teardown_step(STEP.CLEAR_SESSION_SYNC_MARKER, () =>
        command.clear_session_sync_flag(),
      ),
    () =>
      run_teardown_step(STEP.CLEAR_AUTH_STORE, () =>
        command.logout_auth_store(),
      ),
    () => clerk_sign_out_step(command),
  ];
}

export async function execute_logout_device_teardown(
  command: LogoutDeviceTeardownCommand,
  request: LogoutDeviceTeardownRequest,
): Promise<LogoutDeviceTeardownState> {
  command.stop_background_sync();
  command.cancel_automatic_device_backup_write();
  for (const run_step of build_ordered_teardown_steps(command)) {
    const step_state = await run_step();
    if (step_state.status === LOGOUT_DEVICE_TEARDOWN_STATUS.FAILED)
      return step_state;
  }
  console.log("[Logout] Device teardown completed", {
    event: LOGOUT_DEVICE_TEARDOWN_COMPLETED_EVENT,
    landing_path: request.landing_path,
  });
  command.reload_into(request.landing_path);
  return COMPLETED_STATE;
}
