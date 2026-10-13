import type { Result } from "$lib/core/types/Result";
import type {
  RecoverableSessionSyncMarkerSafety,
  RecoverableSessionSyncMarkerState,
} from "$lib/presentation/stores/recoverableSessionSyncMarker";

import type {
  DeviceBackupCapabilityState,
  DeviceBackupDeleteState,
  DeviceBackupReadState,
  PendingLocalChangeState,
  ReplaceAllTablesAtomicallyCommand,
  StorageBackupBootstrapState,
  StorageBackupBootstrapStatePort,
  StorageBackupDatabasePort,
  StorageBackupSyncSuspensionPort,
} from "./storageBackupContracts";
import type { StorageBackupSyncBookkeeping } from "./storageBackupSyncBookkeeping";

export interface CoordinatorTestConfiguration {
  capability: DeviceBackupCapabilityState;
  read_state: DeviceBackupReadState;
  delete_state: DeviceBackupDeleteState;
  restore_safety: RecoverableSessionSyncMarkerSafety;
  pending_local_change_state: PendingLocalChangeState;
  replace_result: Result<boolean>;
  total_record_count: number;
  background_sync_was_running: boolean;
  remote_sync_was_running: boolean;
  sync_bookkeeping: StorageBackupSyncBookkeeping;
  bootstrap_persist_succeeds: boolean;
}

export interface CoordinatorTestRecorder {
  call_order: string[];
  replace_commands: ReplaceAllTablesAtomicallyCommand[];
  persisted_bootstrap_states: StorageBackupBootstrapState[];
  persisted_marker_states: RecoverableSessionSyncMarkerState[];
  written_backups: string[];
}

export function create_recorder(): CoordinatorTestRecorder {
  return {
    call_order: [],
    replace_commands: [],
    persisted_bootstrap_states: [],
    persisted_marker_states: [],
    written_backups: [],
  };
}

export function record_call<TValue>(
  recorder: CoordinatorTestRecorder,
  call_name: string,
  value: TValue,
): TValue {
  recorder.call_order.push(call_name);
  return value;
}

export function create_test_database_port(
  configuration: CoordinatorTestConfiguration,
  recorder: CoordinatorTestRecorder,
): StorageBackupDatabasePort {
  return {
    export_table_snapshots: async () => [
      { table_name: "teams", records: [{ id: "team-1", name: "Cranes" }] },
      { table_name: "players", records: [{ id: "player-1", name: "Ayo" }] },
    ],
    export_sync_bookkeeping: async () => configuration.sync_bookkeeping,
    replace_all_tables_atomically: async (command) => {
      recorder.replace_commands.push(command);
      record_call(recorder, "replace_all_tables_atomically", true);
      await command.persist_settings_within_transaction();
      return configuration.replace_result;
    },
    get_total_record_count: async () => configuration.total_record_count,
  };
}

export function create_test_bootstrap_state_port(
  configuration: CoordinatorTestConfiguration,
  recorder: CoordinatorTestRecorder,
): StorageBackupBootstrapStatePort {
  return {
    load_bootstrap_state: async () => ({
      app_initialized: true,
      seeding_complete: true,
    }),
    persist_bootstrap_state: async (bootstrap_state) => {
      recorder.persisted_bootstrap_states.push(bootstrap_state);
      return configuration.bootstrap_persist_succeeds;
    },
  };
}

export function create_test_sync_suspension_port(
  configuration: CoordinatorTestConfiguration,
  recorder: CoordinatorTestRecorder,
): StorageBackupSyncSuspensionPort {
  return {
    stop_background_sync: () =>
      record_call(
        recorder,
        "stop_background_sync",
        configuration.background_sync_was_running,
      ),
    start_background_sync: () =>
      record_call(recorder, "start_background_sync", true),
    stop_remote_sync: () =>
      record_call(
        recorder,
        "stop_remote_sync",
        configuration.remote_sync_was_running,
      ),
    start_remote_sync: () => record_call(recorder, "start_remote_sync", true),
    set_pulling_from_remote: (is_pulling_from_remote: boolean) =>
      record_call(
        recorder,
        `set_pulling_from_remote:${is_pulling_from_remote}`,
        true,
      ),
  };
}
