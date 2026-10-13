import type { Result } from "$lib/core/types/Result";
import { DEBOUNCE_DELAY_MS } from "$lib/infrastructure/sync/backgroundSyncSharedState";

import type { DeviceBackupWriteOutcome } from "./storageBackupContracts";
import type { StorageBackupCoordinator } from "./storageBackupCoordinator";
import {
  create_persistent_storage_requester,
  get_navigator_persistent_storage_access,
  type PersistentStorageRequestState,
} from "./storageBackupPersistence";
import { get_storage_backup_coordinator } from "./storageBackupRuntime";
import { DEVICE_BACKUP_CAPABILITY_STATUS } from "./storageBackupStatus";

const AUTOMATIC_BACKUP_WRITE_FAILED_EVENT = "automatic_backup_write_failed";
const AUTOMATIC_BACKUP_WRITE_SETTLED_EVENT = "automatic_backup_write_settled";
const UNDEFINED_TYPE_NAME = "undefined";

const TIMER_STATUS = { IDLE: "idle", SCHEDULED: "scheduled" } as const;

type TimerState =
  | { status: typeof TIMER_STATUS.IDLE }
  | {
      status: typeof TIMER_STATUS.SCHEDULED;
      timer_id: ReturnType<typeof setTimeout>;
    };

interface StorageBackupSchedulerDependencies {
  get_coordinator: () => Pick<
    StorageBackupCoordinator,
    "get_device_backup_capability" | "write_device_backup"
  >;
  request_persistent_storage_once: () => Promise<PersistentStorageRequestState>;
  is_browser_environment: () => boolean;
  schedule_delay_ms: number;
}

interface StorageBackupScheduler {
  schedule(): boolean;
  cancel(): boolean;
}

function create_idle_timer_state(): TimerState {
  return { status: TIMER_STATUS.IDLE };
}

function log_automatic_backup_write_result(
  write_result: Result<DeviceBackupWriteOutcome>,
): boolean {
  if (!write_result.success) {
    console.warn("[StorageBackup] Automatic backup write failed", {
      event: AUTOMATIC_BACKUP_WRITE_FAILED_EVENT,
      error: write_result.error,
    });
    return false;
  }

  console.debug("[StorageBackup] Automatic backup write settled", {
    event: AUTOMATIC_BACKUP_WRITE_SETTLED_EVENT,
    status: write_result.data.status,
  });
  return true;
}

async function run_automatic_backup_write(
  coordinator: Pick<StorageBackupCoordinator, "write_device_backup">,
): Promise<boolean> {
  return log_automatic_backup_write_result(
    await coordinator.write_device_backup(),
  );
}

export function create_storage_backup_scheduler(
  dependencies: StorageBackupSchedulerDependencies,
): StorageBackupScheduler {
  let timer_state = create_idle_timer_state();

  function cancel(): boolean {
    if (timer_state.status !== TIMER_STATUS.SCHEDULED) {
      return false;
    }

    clearTimeout(timer_state.timer_id);
    timer_state = create_idle_timer_state();
    return true;
  }

  function schedule(): boolean {
    if (!dependencies.is_browser_environment()) {
      return false;
    }

    const coordinator = dependencies.get_coordinator();

    if (
      coordinator.get_device_backup_capability().status ===
      DEVICE_BACKUP_CAPABILITY_STATUS.UNSUPPORTED
    ) {
      return false;
    }

    void dependencies.request_persistent_storage_once();
    cancel();
    timer_state = {
      status: TIMER_STATUS.SCHEDULED,
      timer_id: setTimeout(() => {
        timer_state = create_idle_timer_state();
        void run_automatic_backup_write(coordinator);
      }, dependencies.schedule_delay_ms),
    };
    return true;
  }

  return { schedule, cancel };
}

const persistent_storage_requester = create_persistent_storage_requester(
  get_navigator_persistent_storage_access,
);

const storage_backup_scheduler = create_storage_backup_scheduler({
  get_coordinator: get_storage_backup_coordinator,
  request_persistent_storage_once: () =>
    persistent_storage_requester.request_once(),
  is_browser_environment: () => typeof window !== UNDEFINED_TYPE_NAME,
  schedule_delay_ms: DEBOUNCE_DELAY_MS,
});

export function schedule_automatic_device_backup_write(): boolean {
  return storage_backup_scheduler.schedule();
}

export function cancel_automatic_device_backup_write(): boolean {
  return storage_backup_scheduler.cancel();
}
