import { sign_out } from "$lib/adapters/iam/clerkAuthService";
import { rebuild_signed_out_demo_data } from "$lib/adapters/initialization/dataResetService";
import { reset_database } from "$lib/adapters/repositories/database";
import {
  type AsyncResult,
  create_failure_result,
  create_success_result,
} from "$lib/core/types/Result";
import { get_storage_backup_coordinator } from "$lib/infrastructure/backup/storageBackupRuntime";
import { cancel_automatic_device_backup_write } from "$lib/infrastructure/backup/storageBackupScheduler";
import { stop_background_sync_and_wait_for_idle } from "$lib/infrastructure/sync/syncSessionQuiesce";
import { auth_store } from "$lib/presentation/stores/auth";
import { clear_session_sync_flag } from "$lib/presentation/stores/initialSyncStore";
import { mark_pending_clerk_sign_out } from "$lib/presentation/stores/pendingClerkSignOut";
import {
  build_anonymous_session_sync_marker,
  write_session_sync_marker,
} from "$lib/presentation/stores/sessionSyncMarker";

import {
  execute_logout_device_teardown,
  LOGOUT_DEVICE_TEARDOWN_STATUS,
  type LogoutDeviceTeardownCommand,
} from "./logoutDeviceTeardown";

function create_runtime_logout_device_teardown_command(): LogoutDeviceTeardownCommand {
  return {
    stop_background_sync: stop_background_sync_and_wait_for_idle,
    cancel_automatic_device_backup_write,
    delete_device_backup: () =>
      get_storage_backup_coordinator().delete_device_backup(),
    reset_local_database: async () => {
      await reset_database();
      return true;
    },
    clear_session_sync_flag,
    logout_auth_store: () => auth_store.logout(),
    sign_out,
    seed_signed_out_demo_data: rebuild_signed_out_demo_data,
    mark_anonymous_demo_session: () =>
      write_session_sync_marker(build_anonymous_session_sync_marker()),
    mark_pending_clerk_sign_out,
    reload_into: (landing_path: string) => {
      window.location.replace(landing_path);
      return true;
    },
  };
}

export async function sign_out_and_tear_down_device(
  landing_path: string,
): AsyncResult<boolean> {
  const teardown_state = await execute_logout_device_teardown(
    create_runtime_logout_device_teardown_command(),
    { landing_path },
  );
  return teardown_state.status === LOGOUT_DEVICE_TEARDOWN_STATUS.COMPLETED
    ? create_success_result(true)
    : create_failure_result(
        `${teardown_state.failed_step}: ${teardown_state.error}`,
      );
}
