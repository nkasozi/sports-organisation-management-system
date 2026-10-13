import type { AppSettingsPort } from "$lib/core/interfaces/ports";
import {
  evaluate_recoverable_session_sync_marker_state,
  get_recoverable_session_sync_marker_state,
  persist_recoverable_session_sync_marker_state,
} from "$lib/presentation/stores/recoverableSessionSyncMarker";

import { get_database } from "../../adapters/repositories/database";
import {
  sync_change_tracking_gate,
  UntrackedWriteReason,
} from "../../adapters/repositories/syncOutbox/syncChangeTrackingGate";
import { get_app_settings_storage } from "../container";
import {
  get_unsynced_local_change_count,
  set_pulling_from_remote,
  start_background_sync,
  stop_background_sync,
} from "../sync/backgroundSyncService";
import { get_realtime_sync_adapter } from "../sync/convexRealtimeSync";
import type {
  PendingLocalChangeState,
  PendingLocalChangeStatePort,
  StorageBackupBootstrapStatePort,
  StorageBackupSyncSuspensionPort,
} from "./storageBackupContracts";
import {
  create_storage_backup_coordinator,
  type StorageBackupCoordinator,
} from "./storageBackupCoordinator";
import {
  create_device_backup_storage_port,
  get_navigator_device_backup_directory_access,
} from "./storageBackupDeviceStorage";
import { create_storage_backup_dexie_database_port } from "./storageBackupDexieDatabasePort";
import { PENDING_LOCAL_CHANGE_STATUS } from "./storageBackupStatus";

const APP_INITIALIZED_KEY = "sports_org_app_initialized";
const SEEDING_COMPLETE_KEY = "sports_org_seeding_complete_v16";
const TRUE_SETTING_VALUE = "true";

const COORDINATOR_STATE_STATUS = {
  UNINITIALIZED: "uninitialized",
  READY: "ready",
} as const;

type CoordinatorState =
  | { status: typeof COORDINATOR_STATE_STATUS.UNINITIALIZED }
  | {
      status: typeof COORDINATOR_STATE_STATUS.READY;
      coordinator: StorageBackupCoordinator;
    };

let coordinator_state: CoordinatorState = {
  status: COORDINATOR_STATE_STATUS.UNINITIALIZED,
};

async function persist_boolean_setting(
  app_settings: AppSettingsPort,
  setting_key: string,
  is_enabled: boolean,
): Promise<boolean> {
  if (is_enabled) {
    await app_settings.set_setting(setting_key, TRUE_SETTING_VALUE);
    return true;
  }

  await app_settings.remove_setting(setting_key);
  return true;
}

function create_storage_backup_bootstrap_state_port(
  app_settings: AppSettingsPort,
): StorageBackupBootstrapStatePort {
  return {
    load_bootstrap_state: async () => ({
      app_initialized:
        (await app_settings.get_setting(APP_INITIALIZED_KEY)) ===
        TRUE_SETTING_VALUE,
      seeding_complete:
        (await app_settings.get_setting(SEEDING_COMPLETE_KEY)) ===
        TRUE_SETTING_VALUE,
    }),
    persist_bootstrap_state: async (bootstrap_state) => {
      await persist_boolean_setting(
        app_settings,
        APP_INITIALIZED_KEY,
        bootstrap_state.app_initialized,
      );
      return persist_boolean_setting(
        app_settings,
        SEEDING_COMPLETE_KEY,
        bootstrap_state.seeding_complete,
      );
    },
  };
}

async function read_pending_local_change_state(): Promise<PendingLocalChangeState> {
  const count_result = await get_unsynced_local_change_count();
  if (!count_result.success)
    return {
      status: PENDING_LOCAL_CHANGE_STATUS.COUNT_UNAVAILABLE,
      error: count_result.error,
    };
  return count_result.data > 0
    ? { status: PENDING_LOCAL_CHANGE_STATUS.PENDING_LOCAL_CHANGES_PRESENT }
    : { status: PENDING_LOCAL_CHANGE_STATUS.NO_PENDING_LOCAL_CHANGES };
}

function create_background_sync_pending_local_change_state_port(): PendingLocalChangeStatePort {
  return { get_pending_local_change_state: read_pending_local_change_state };
}

function create_runtime_sync_suspension_port(): StorageBackupSyncSuspensionPort {
  const realtime_sync_adapter = get_realtime_sync_adapter();

  return {
    stop_background_sync,
    start_background_sync,
    stop_remote_sync: () => realtime_sync_adapter.stop().success,
    start_remote_sync: () => realtime_sync_adapter.start().success,
    set_pulling_from_remote: (is_pulling_from_remote: boolean) => {
      set_pulling_from_remote(is_pulling_from_remote);
      return true;
    },
  };
}

export function get_storage_backup_coordinator(): StorageBackupCoordinator {
  if (coordinator_state.status === COORDINATOR_STATE_STATUS.READY) {
    return coordinator_state.coordinator;
  }

  const coordinator = create_storage_backup_coordinator({
    database_port: create_storage_backup_dexie_database_port(
      get_database,
      (low_level_transaction: object): boolean =>
        sync_change_tracking_gate.mark_untracked_transaction(
          low_level_transaction,
          UntrackedWriteReason.BACKUP_RESTORE,
        ),
    ),
    bootstrap_state_port: create_storage_backup_bootstrap_state_port(
      get_app_settings_storage(),
    ),
    device_backup_storage_port: create_device_backup_storage_port(
      get_navigator_device_backup_directory_access,
    ),
    pending_local_change_state_port:
      create_background_sync_pending_local_change_state_port(),
    sync_suspension_port: create_runtime_sync_suspension_port(),
    get_session_sync_marker_state: get_recoverable_session_sync_marker_state,
    persist_session_sync_marker_state:
      persist_recoverable_session_sync_marker_state,
    evaluate_restore_safety: evaluate_recoverable_session_sync_marker_state,
    now: () => new Date().toISOString(),
  });

  coordinator_state = { status: COORDINATOR_STATE_STATUS.READY, coordinator };
  return coordinator;
}
