import type { AsyncResult } from "$lib/core/types/Result";
import type {
  StorageBackupSummary,
  StorageStartupRecoveryState,
} from "$lib/infrastructure/backup/storageBackupContracts";

import {
  build_startup_storage_recovery_prompt_state,
  STARTUP_STORAGE_RECOVERY_CHOICE,
  STARTUP_STORAGE_RECOVERY_PROMPT_MODE,
  STARTUP_STORAGE_RECOVERY_PROMPT_STATUS,
  type StartupStorageRecoveryChoice,
  type VisibleStartupStorageRecoveryPromptState,
} from "./layoutStorageRecovery";

const RESTORE_PROGRESS_MESSAGE = "Restoring local backup...";
const RESTORE_PROGRESS_PERCENTAGE = 15;
const STARTUP_STORAGE_RECOVERY_SETTLED_EVENT =
  "startup_storage_recovery_settled";
const STARTUP_STORAGE_RESTORE_FAILED_EVENT = "startup_storage_restore_failed";

const STARTUP_STORAGE_RECOVERY_OUTCOME_STATUS = {
  SKIPPED: "skipped",
  DECLINED: "declined",
  BLOCKED_ACKNOWLEDGED: "blocked_acknowledged",
  RESTORED: "restored",
  RESTORE_FAILED: "restore_failed",
} as const;

const OUTCOME_STATUS = STARTUP_STORAGE_RECOVERY_OUTCOME_STATUS;

type StartupStorageRecoveryOutcome =
  | {
      status: typeof OUTCOME_STATUS.SKIPPED;
      recovery_status: StorageStartupRecoveryState["status"];
    }
  | { status: typeof OUTCOME_STATUS.DECLINED }
  | { status: typeof OUTCOME_STATUS.BLOCKED_ACKNOWLEDGED }
  | { status: typeof OUTCOME_STATUS.RESTORED }
  | { status: typeof OUTCOME_STATUS.RESTORE_FAILED; error: string };

export interface StartupStorageRecoveryFlowDependencies {
  evaluate_startup_recovery(): Promise<StorageStartupRecoveryState>;
  restore_from_device_backup(): AsyncResult<StorageBackupSummary>;
  wait_for_choice(
    prompt_state: VisibleStartupStorageRecoveryPromptState,
  ): Promise<StartupStorageRecoveryChoice>;
  show_restore_progress(message: string, percentage: number): boolean;
  hide_restore_progress(): boolean;
}

async function restore_after_user_choice(
  dependencies: StartupStorageRecoveryFlowDependencies,
  prompt_state: VisibleStartupStorageRecoveryPromptState,
): Promise<StartupStorageRecoveryOutcome> {
  const choice = await dependencies.wait_for_choice(prompt_state);

  if (choice !== STARTUP_STORAGE_RECOVERY_CHOICE.RESTORE) {
    return { status: OUTCOME_STATUS.DECLINED };
  }

  dependencies.show_restore_progress(
    RESTORE_PROGRESS_MESSAGE,
    RESTORE_PROGRESS_PERCENTAGE,
  );
  const restore_result = await dependencies.restore_from_device_backup();
  dependencies.hide_restore_progress();

  if (!restore_result.success) {
    console.error("[Layout] Startup storage restore failed", {
      event: STARTUP_STORAGE_RESTORE_FAILED_EVENT,
      error: restore_result.error,
    });
    await dependencies.wait_for_choice({
      status: STARTUP_STORAGE_RECOVERY_PROMPT_STATUS.VISIBLE,
      mode: STARTUP_STORAGE_RECOVERY_PROMPT_MODE.FAILED,
      summary: prompt_state.summary,
    });
    return {
      status: OUTCOME_STATUS.RESTORE_FAILED,
      error: restore_result.error,
    };
  }

  return { status: OUTCOME_STATUS.RESTORED };
}

async function resolve_startup_storage_recovery(
  dependencies: StartupStorageRecoveryFlowDependencies,
  recovery_state: StorageStartupRecoveryState,
): Promise<StartupStorageRecoveryOutcome> {
  const prompt_state =
    build_startup_storage_recovery_prompt_state(recovery_state);

  if (prompt_state.status === STARTUP_STORAGE_RECOVERY_PROMPT_STATUS.HIDDEN) {
    return {
      status: OUTCOME_STATUS.SKIPPED,
      recovery_status: recovery_state.status,
    };
  }

  if (prompt_state.mode === STARTUP_STORAGE_RECOVERY_PROMPT_MODE.BLOCKED) {
    await dependencies.wait_for_choice(prompt_state);
    return { status: OUTCOME_STATUS.BLOCKED_ACKNOWLEDGED };
  }

  return restore_after_user_choice(dependencies, prompt_state);
}

export async function run_startup_storage_recovery(
  dependencies: StartupStorageRecoveryFlowDependencies,
): Promise<StartupStorageRecoveryOutcome> {
  const recovery_state = await dependencies.evaluate_startup_recovery();
  const outcome = await resolve_startup_storage_recovery(
    dependencies,
    recovery_state,
  );

  console.log("[Layout] Startup storage recovery settled", {
    event: STARTUP_STORAGE_RECOVERY_SETTLED_EVENT,
    recovery_status: recovery_state.status,
    outcome_status: outcome.status,
  });
  return outcome;
}
