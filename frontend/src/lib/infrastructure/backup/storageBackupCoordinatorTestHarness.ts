import { type Mock, vi } from "vitest";

import {
  type AsyncResult,
  create_success_result,
} from "$lib/core/types/Result";
import type { RecoverableSessionSyncMarkerState } from "$lib/presentation/stores/recoverableSessionSyncMarker";

import type {
  DeviceBackupDeleteState,
  DeviceBackupStoragePort,
  PendingLocalChangeStatePort,
} from "./storageBackupContracts";
import {
  create_storage_backup_coordinator,
  type StorageBackupCoordinator,
} from "./storageBackupCoordinator";
import {
  type CoordinatorTestConfiguration,
  type CoordinatorTestRecorder,
  create_recorder,
  create_test_bootstrap_state_port,
  create_test_database_port,
  create_test_sync_suspension_port,
  record_call,
} from "./storageBackupCoordinatorTestPorts";
import {
  build_storage_backup_envelope,
  serialize_storage_backup_envelope,
} from "./storageBackupFormat";
import { create_empty_storage_backup_sync_bookkeeping } from "./storageBackupSyncBookkeeping";

export type {
  CoordinatorTestConfiguration,
  CoordinatorTestRecorder,
} from "./storageBackupCoordinatorTestPorts";

export const created_backup_timestamp = "2026-05-17T12:00:00.000Z";

export const verified_session_marker_state: RecoverableSessionSyncMarkerState =
  { status: "present", marker: { mode: "verified", session_id: "session-1" } };

export const verified_user_marker_state: RecoverableSessionSyncMarkerState = {
  status: "present",
  marker: { mode: "verified_user", session_id: "session-1", user_id: "user-1" },
};

export function create_default_coordinator_test_configuration(): CoordinatorTestConfiguration {
  return {
    capability: { status: "supported" },
    read_state: { status: "missing" },
    delete_state: { status: "deleted" },
    restore_safety: {
      status: "safe_matching_verified_session",
      session_id: "session-1",
    },
    pending_local_change_state: { status: "no_pending_local_changes" },
    replace_result: create_success_result(true),
    total_record_count: 0,
    background_sync_was_running: true,
    remote_sync_was_running: true,
    sync_bookkeeping: create_empty_storage_backup_sync_bookkeeping(),
    bootstrap_persist_succeeds: true,
  };
}

export function serialize_test_backup(
  records: unknown[],
  marker_state: RecoverableSessionSyncMarkerState = verified_session_marker_state,
): string {
  return serialize_storage_backup_envelope(
    build_storage_backup_envelope({
      created_at: created_backup_timestamp,
      source: "manual_export",
      app_initialized: true,
      seeding_complete: true,
      session_sync_marker_state: marker_state,
      table_snapshots: [
        { table_name: "teams", records: records as Record<string, unknown>[] },
      ],
      sync_bookkeeping: create_empty_storage_backup_sync_bookkeeping(),
    }),
  );
}

export interface CoordinatorTestSubject {
  subject: StorageBackupCoordinator;
  recorder: CoordinatorTestRecorder;
  write_backup_json_mock: Mock<
    (serialized_backup: string) => AsyncResult<boolean>
  >;
  delete_backup_mock: Mock<() => Promise<DeviceBackupDeleteState>>;
}

function create_test_pending_change_port(
  configuration: CoordinatorTestConfiguration,
): PendingLocalChangeStatePort {
  return {
    get_pending_local_change_state: async () =>
      configuration.pending_local_change_state,
  };
}

function create_test_device_storage(
  configuration: CoordinatorTestConfiguration,
  recorder: CoordinatorTestRecorder,
  write_backup_json: (serialized_backup: string) => AsyncResult<boolean>,
): Pick<
  CoordinatorTestSubject,
  "write_backup_json_mock" | "delete_backup_mock"
> & {
  port: DeviceBackupStoragePort;
} {
  const write_backup_json_mock = vi.fn(async (serialized_backup: string) => {
    recorder.written_backups.push(serialized_backup);
    return write_backup_json(serialized_backup);
  });
  const delete_backup_mock = vi.fn(async () =>
    record_call(recorder, "delete_backup", configuration.delete_state),
  );
  return {
    write_backup_json_mock,
    delete_backup_mock,
    port: {
      get_capability: () => configuration.capability,
      read_backup_json: async () => configuration.read_state,
      write_backup_json: write_backup_json_mock,
      delete_backup: delete_backup_mock,
    },
  };
}

export function create_coordinator_test_subject(
  configuration: CoordinatorTestConfiguration,
  write_backup_json: (
    serialized_backup: string,
  ) => AsyncResult<boolean> = async () => create_success_result(true),
): CoordinatorTestSubject {
  const recorder = create_recorder();
  const device_storage = create_test_device_storage(
    configuration,
    recorder,
    write_backup_json,
  );
  const subject = create_storage_backup_coordinator({
    database_port: create_test_database_port(configuration, recorder),
    bootstrap_state_port: create_test_bootstrap_state_port(
      configuration,
      recorder,
    ),
    device_backup_storage_port: device_storage.port,
    pending_local_change_state_port:
      create_test_pending_change_port(configuration),
    sync_suspension_port: create_test_sync_suspension_port(
      configuration,
      recorder,
    ),
    get_session_sync_marker_state: async () => verified_session_marker_state,
    persist_session_sync_marker_state: async (marker_state) => {
      recorder.persisted_marker_states.push(marker_state);
      return true;
    },
    evaluate_restore_safety: async () => configuration.restore_safety,
    now: () => created_backup_timestamp,
  });

  return {
    subject,
    recorder,
    write_backup_json_mock: device_storage.write_backup_json_mock,
    delete_backup_mock: device_storage.delete_backup_mock,
  };
}
