import {
  INITIALIZATION_ERROR_CODE,
  INITIALIZATION_EVENT,
} from "./initializationEvents";
import { INITIALIZATION_ERROR_MESSAGE } from "./initializationMessages";
import { restore_current_user } from "./seedingStrategySupport";
import type { SeedResult } from "./seedingTypes";
import {
  create_convex_required_seed_result,
  create_failed_seed_result,
  create_local_success_seed_result,
  create_offline_mode_seed_result,
} from "./seedResults";

export async function reuse_completed_local_seed(
  seeding_run_id: string,
): Promise<SeedResult> {
  console.log("[Seeding] Seeding already complete", {
    event: INITIALIZATION_EVENT.SEEDING_ALREADY_COMPLETE,
    seeding_run_id,
  });
  await restore_current_user(seeding_run_id);
  return create_local_success_seed_result();
}

export function fail_unreadable_seeding_state(
  seeding_run_id: string,
): SeedResult {
  console.error("[Seeding] Seeding state unreadable; not seeding over it", {
    event: INITIALIZATION_EVENT.SEEDING_COMPLETION_UNREADABLE,
    error_code: INITIALIZATION_ERROR_CODE.SEEDING_STATE_UNREADABLE,
    seeding_run_id,
  });
  return create_failed_seed_result(
    INITIALIZATION_ERROR_MESSAGE.SEEDING_STATE_UNREADABLE,
  );
}

export async function continue_offline_with_saved_data(
  seeding_run_id: string,
): Promise<SeedResult> {
  console.warn("[Seeding] Convex unavailable, using saved local data", {
    event: INITIALIZATION_EVENT.CONVEX_UNAVAILABLE_OFFLINE_MODE,
    error_code: INITIALIZATION_ERROR_CODE.CONVEX_UNAVAILABLE,
    seeding_run_id,
  });
  await restore_current_user(seeding_run_id);
  return create_offline_mode_seed_result(
    INITIALIZATION_ERROR_MESSAGE.OFFLINE_MODE,
  );
}

export function fail_convex_required(seeding_run_id: string): SeedResult {
  console.error("[Seeding] Convex unavailable and no local data", {
    event: INITIALIZATION_EVENT.CONVEX_REQUIRED_BUT_UNAVAILABLE,
    error_code: INITIALIZATION_ERROR_CODE.CONVEX_UNAVAILABLE,
    seeding_run_id,
  });
  return create_convex_required_seed_result(
    INITIALIZATION_ERROR_MESSAGE.CONVEX_REQUIRED,
  );
}
