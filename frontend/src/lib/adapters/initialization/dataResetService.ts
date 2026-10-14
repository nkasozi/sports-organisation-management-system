import { get } from "svelte/store";

import { is_signed_in } from "$lib/adapters/iam/clerkAuthService";
import { create_system_write_origin } from "$lib/adapters/repositories/InBrowserRepositoryWriteOrigin";
import {
  sync_change_tracking_gate,
  UntrackedWriteReason,
} from "$lib/adapters/repositories/syncOutbox/syncChangeTrackingGate";
import { create_recreate_base_version } from "$lib/adapters/repositories/syncOutbox/syncOutboxTypes";
import { run_untracked_write_scope } from "$lib/adapters/repositories/syncOutbox/untrackedWriteScope";
import type { UntrackedWriteScope } from "$lib/adapters/repositories/syncOutbox/untrackedWriteScopeToken";
import type { AsyncResult } from "$lib/core/types/Result";
import {
  create_failure_result,
  create_success_result,
} from "$lib/core/types/Result";
import { get_app_settings_storage } from "$lib/infrastructure/container";
import {
  enqueue_all_local_records_for_push,
  pause_remote_change_subscriptions,
  reset_local_sync_bookkeeping,
  resume_remote_change_subscriptions,
  set_pulling_from_remote,
  start_background_sync,
} from "$lib/infrastructure/sync/backgroundSyncService";
import { clear_all_demo_data_in_convex } from "$lib/infrastructure/sync/convexSyncService";
import {
  resume_in_flight_sync_work,
  stop_background_sync_for_maintenance,
} from "$lib/infrastructure/sync/syncSessionQuiesce";
import { clear_session_sync_flag } from "$lib/presentation/stores/initialSyncStore";
import { sync_store } from "$lib/presentation/stores/syncStore";

import { reset_all_local_repositories } from "./dataResetRepositoryResets";
import { seed_all_data_if_needed } from "./seedingService";

type ResetProgressReporter = (message: string, percentage: number) => void;

const PUSH_SYNC_DIRECTION = "push";
const SIGNED_OUT_DEMO_REBUILD_FAILED_MESSAGE =
  "Demo data could not be prepared after signing out.";
const BROWSER_GLOBAL_TYPE_UNDEFINED = "undefined";

const ResetProgress = {
  STOPPING_SYNC: { message: "Stopping background sync...", percentage: 5 },
  CLEARING_SERVER: { message: "Clearing server data...", percentage: 10 },
  SKIPPING_SERVER: {
    message: "Skipping server clear (not signed in)...",
    percentage: 10,
  },
  CLEARING_SETTINGS: { message: "Clearing app settings...", percentage: 20 },
  RESETTING_STORES: { message: "Resetting data stores...", percentage: 35 },
  SEEDING: { message: "Seeding demo data...", percentage: 65 },
  FINISHING: { message: "Finishing up...", percentage: 95 },
  PUSHING: { message: "Pushing data to server...", percentage: 97 },
} as const;

type ResetProgressStep = (typeof ResetProgress)[keyof typeof ResetProgress];

function create_progress_reporter(
  on_progress: ResetProgressReporter,
): (step: ResetProgressStep) => boolean {
  return (step: ResetProgressStep): boolean => {
    on_progress(step.message, step.percentage);
    return true;
  };
}

async function clear_server_data_when_signed_in(
  report: (step: ResetProgressStep) => boolean,
): Promise<boolean> {
  if (!get(is_signed_in)) {
    report(ResetProgress.SKIPPING_SERVER);
    console.log("[DataReset] Skipping Convex clear for a signed-out user", {
      event: "data_reset_server_clear_skipped",
    });
    return true;
  }
  report(ResetProgress.CLEARING_SERVER);
  const cleared = await clear_all_demo_data_in_convex();
  if (!cleared)
    console.error("[DataReset] Server clear failed; local data left intact", {
      event: "data_reset_server_clear_failed",
    });
  return cleared;
}

async function rebuild_local_data_in_scope(
  scope: UntrackedWriteScope,
  report: (step: ResetProgressStep) => boolean,
): Promise<boolean> {
  report(ResetProgress.RESETTING_STORES);
  if (!(await reset_local_sync_bookkeeping())) return false;
  const repositories_reset = await reset_all_local_repositories(
    create_system_write_origin(scope),
    scope.scope_id,
  );
  if (!repositories_reset) return false;
  report(ResetProgress.SEEDING);
  return (await seed_all_data_if_needed()).success;
}

async function rebuild_local_data_without_tracking(
  report: (step: ResetProgressStep) => boolean,
): Promise<boolean> {
  const rebuild_result = await run_untracked_write_scope(
    sync_change_tracking_gate,
    UntrackedWriteReason.DATA_RESET,
    (scope: UntrackedWriteScope) => rebuild_local_data_in_scope(scope, report),
  );
  return rebuild_result.success && rebuild_result.data;
}

async function resume_sync_and_push_when_signed_in(
  report: (step: ResetProgressStep) => boolean,
): Promise<boolean> {
  if (!get(is_signed_in)) {
    console.log(
      "[DataReset] Background sync not restarted for signed-out user",
      { event: "data_reset_sync_restart_skipped" },
    );
    return true;
  }
  start_background_sync();
  report(ResetProgress.PUSHING);
  await enqueue_all_local_records_for_push(create_recreate_base_version());
  const push_result = await sync_store.sync_now(PUSH_SYNC_DIRECTION);
  if (!push_result.success)
    console.error("[DataReset] Reseeded data could not be pushed", {
      event: "data_reset_push_failed",
    });
  return push_result.success;
}

async function rebuild_after_server_clear(
  report: (step: ResetProgressStep) => boolean,
): Promise<boolean> {
  report(ResetProgress.CLEARING_SETTINGS);
  await get_app_settings_storage().clear_all_settings();
  await clear_session_sync_flag();
  const rebuilt = await rebuild_local_data_without_tracking(report);
  report(ResetProgress.FINISHING);
  if (!rebuilt)
    console.error("[DataReset] Local rebuild failed; nothing was pushed", {
      event: "data_reset_local_rebuild_failed",
    });
  return rebuilt;
}

async function run_reset_steps(
  report: (step: ResetProgressStep) => boolean,
): Promise<boolean> {
  const cleared = await clear_server_data_when_signed_in(report);
  const rebuilt = cleared && (await rebuild_after_server_clear(report));
  set_pulling_from_remote(false);
  resume_in_flight_sync_work();
  return rebuilt && (await resume_sync_and_push_when_signed_in(report));
}

export async function reset_all_data(
  on_progress: ResetProgressReporter,
): Promise<boolean> {
  if (typeof window === BROWSER_GLOBAL_TYPE_UNDEFINED) return false;
  const report = create_progress_reporter(on_progress);
  report(ResetProgress.STOPPING_SYNC);
  await stop_background_sync_for_maintenance();
  pause_remote_change_subscriptions();
  set_pulling_from_remote(true);
  const succeeded = await run_reset_steps(report);
  resume_remote_change_subscriptions();
  console.log("[DataReset] Data reset finished", {
    event: succeeded ? "data_reset_finished" : "data_reset_failed",
  });
  return succeeded;
}

export async function rebuild_signed_out_demo_data(): AsyncResult<boolean> {
  if (typeof window === BROWSER_GLOBAL_TYPE_UNDEFINED)
    return create_failure_result(SIGNED_OUT_DEMO_REBUILD_FAILED_MESSAGE);
  pause_remote_change_subscriptions();
  set_pulling_from_remote(true);
  await get_app_settings_storage().clear_all_settings();
  const rebuilt = await rebuild_local_data_without_tracking(() => true);
  set_pulling_from_remote(false);
  resume_remote_change_subscriptions();
  console.log("[DataReset] Signed-out demo data rebuilt", {
    event: rebuilt
      ? "signed_out_demo_data_rebuilt"
      : "signed_out_demo_data_rebuild_failed",
  });
  return rebuilt
    ? create_success_result(true)
    : create_failure_result(SIGNED_OUT_DEMO_REBUILD_FAILED_MESSAGE);
}
