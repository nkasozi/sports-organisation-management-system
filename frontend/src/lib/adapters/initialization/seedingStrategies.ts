import {
  type ProgressCallback,
  try_seed_all_tables_from_convex,
} from "../../infrastructure/sync/convexSeedingService";
import {
  create_seeding_run_id,
  is_browser_environment,
  SEEDING_COMPLETION_STATE,
  type SeedingCompletionState,
} from "./initializationConstants";
import {
  INITIALIZATION_ERROR_CODE,
  INITIALIZATION_EVENT,
} from "./initializationEvents";
import {
  INITIALIZATION_ERROR_MESSAGE,
  INITIALIZATION_PROGRESS_MESSAGE,
  INITIALIZATION_PROGRESS_PERCENT,
} from "./initializationMessages";
import { seed_all_data_if_needed } from "./seedingService";
import {
  continue_offline_with_saved_data,
  fail_convex_required,
  fail_unreadable_seeding_state,
  reuse_completed_local_seed,
} from "./seedingStrategyOutcomes";
import { handle_convex_success } from "./seedingStrategySupport";
import { is_seeding_already_complete, type SeedResult } from "./seedingTypes";
import {
  create_failed_seed_result,
  create_local_success_seed_result,
  create_skipped_seed_result,
} from "./seedResults";

export function handle_skip_seeding(): SeedResult {
  console.log("[Seeding] Skip strategy, no seeding needed", {
    event: INITIALIZATION_EVENT.SEEDING_SKIPPED,
  });
  return create_skipped_seed_result();
}

function fail_outside_browser(seeding_run_id: string): SeedResult {
  console.error("[Seeding] Seeding requires a browser environment", {
    event: INITIALIZATION_EVENT.SEEDING_NOT_IN_BROWSER,
    error_code: INITIALIZATION_ERROR_CODE.NOT_IN_BROWSER,
    seeding_run_id,
  });
  return create_failed_seed_result(INITIALIZATION_ERROR_MESSAGE.NOT_IN_BROWSER);
}

export async function handle_local_only_seeding(
  on_progress: ProgressCallback,
): Promise<SeedResult> {
  const seeding_run_id = create_seeding_run_id();
  on_progress(
    INITIALIZATION_PROGRESS_MESSAGE.LOADING_OFFLINE_DATA,
    INITIALIZATION_PROGRESS_PERCENT.LOCAL_ONLY_STARTED,
  );
  const local_seed_result = await seed_all_data_if_needed();
  if (!local_seed_result.success) {
    console.error("[Seeding] Local-only seeding failed", {
      event: INITIALIZATION_EVENT.LOCAL_ONLY_SEEDING_FAILED,
      error_code: INITIALIZATION_ERROR_CODE.LOCAL_SEEDING_FAILED,
      seeding_run_id,
      error: local_seed_result.error,
    });
    return create_failed_seed_result(
      INITIALIZATION_ERROR_MESSAGE.LOCAL_SEEDING_FAILED,
    );
  }
  on_progress(
    INITIALIZATION_PROGRESS_MESSAGE.OFFLINE_DATA_READY,
    INITIALIZATION_PROGRESS_PERCENT.DATA_READY,
  );
  console.log("[Seeding] Local-only seeding completed", {
    event: INITIALIZATION_EVENT.LOCAL_ONLY_SEEDING_COMPLETED,
    seeding_run_id,
  });
  return create_local_success_seed_result();
}

async function seed_locally_after_convex_failure(
  on_progress: ProgressCallback,
  seeding_run_id: string,
): Promise<SeedResult> {
  console.warn("[Seeding] Convex unavailable, falling back to local data", {
    event: INITIALIZATION_EVENT.CONVEX_UNAVAILABLE_LOCAL_FALLBACK,
    error_code: INITIALIZATION_ERROR_CODE.CONVEX_UNAVAILABLE,
    seeding_run_id,
  });
  on_progress(
    INITIALIZATION_PROGRESS_MESSAGE.SERVER_UNAVAILABLE_LOADING_DEMO,
    INITIALIZATION_PROGRESS_PERCENT.LOCAL_FALLBACK_STARTED,
  );
  const local_seed_result = await seed_all_data_if_needed();
  if (local_seed_result.success) return create_local_success_seed_result();
  console.error("[Seeding] Local fallback seeding failed", {
    event: INITIALIZATION_EVENT.LOCAL_FALLBACK_SEEDING_FAILED,
    error_code: INITIALIZATION_ERROR_CODE.LOCAL_SEEDING_FAILED,
    seeding_run_id,
    error: local_seed_result.error,
  });
  return create_failed_seed_result(
    INITIALIZATION_ERROR_MESSAGE.CONVEX_AND_LOCAL_FAILED,
  );
}

export async function handle_convex_with_local_fallback(
  on_progress: ProgressCallback,
): Promise<SeedResult> {
  const seeding_run_id = create_seeding_run_id();
  const completion_state = await is_seeding_already_complete();
  switch (completion_state) {
    case SEEDING_COMPLETION_STATE.COMPLETE:
      return reuse_completed_local_seed(seeding_run_id);
    case SEEDING_COMPLETION_STATE.UNREADABLE:
      return fail_unreadable_seeding_state(seeding_run_id);
    case SEEDING_COMPLETION_STATE.NOT_COMPLETE:
      return seed_from_convex_with_local_fallback(on_progress, seeding_run_id);
  }
}

async function seed_from_convex_with_local_fallback(
  on_progress: ProgressCallback,
  seeding_run_id: string,
): Promise<SeedResult> {
  if (!is_browser_environment()) return fail_outside_browser(seeding_run_id);
  on_progress(
    INITIALIZATION_PROGRESS_MESSAGE.CONNECTING_TO_SERVER,
    INITIALIZATION_PROGRESS_PERCENT.CONVEX_CONNECTING,
  );
  const convex_result = await try_seed_all_tables_from_convex(on_progress);
  if (convex_result.success) {
    return handle_convex_success(on_progress, convex_result, seeding_run_id);
  }
  return seed_locally_after_convex_failure(on_progress, seeding_run_id);
}

async function resolve_convex_unavailable(
  completion_state: SeedingCompletionState,
  seeding_run_id: string,
): Promise<SeedResult> {
  switch (completion_state) {
    case SEEDING_COMPLETION_STATE.COMPLETE:
      return continue_offline_with_saved_data(seeding_run_id);
    case SEEDING_COMPLETION_STATE.UNREADABLE:
      return fail_unreadable_seeding_state(seeding_run_id);
    case SEEDING_COMPLETION_STATE.NOT_COMPLETE:
      return fail_convex_required(seeding_run_id);
  }
}

export async function handle_convex_mandatory(
  on_progress: ProgressCallback,
): Promise<SeedResult> {
  const seeding_run_id = create_seeding_run_id();
  const completion_state = await is_seeding_already_complete();
  if (!is_browser_environment()) return fail_outside_browser(seeding_run_id);
  on_progress(
    INITIALIZATION_PROGRESS_MESSAGE.PULLING_DATA_FROM_SERVER,
    INITIALIZATION_PROGRESS_PERCENT.CONVEX_CONNECTING,
  );
  const convex_result = await try_seed_all_tables_from_convex(on_progress);
  if (convex_result.success) {
    return handle_convex_success(on_progress, convex_result, seeding_run_id);
  }
  return resolve_convex_unavailable(completion_state, seeding_run_id);
}
