import type { ProgressCallback } from "../../infrastructure/sync/convexSeedingService";
import {
  INITIALIZATION_ERROR_CODE,
  INITIALIZATION_EVENT,
} from "./initializationEvents";
import {
  INITIALIZATION_PROGRESS_MESSAGE,
  INITIALIZATION_PROGRESS_PERCENT,
} from "./initializationMessages";
import { mark_seeding_complete, type SeedResult } from "./seedingTypes";
import { load_and_set_current_user } from "./seedingUserSetup";
import {
  create_convex_success_seed_result,
  create_failed_seed_result,
} from "./seedResults";

interface ConvexSeedSummary {
  total_records: number;
  tables_fetched: number;
}

export async function restore_current_user(
  seeding_run_id: string,
): Promise<boolean> {
  const current_user_result = await load_and_set_current_user();
  if (current_user_result.success) return true;
  console.warn("[Seeding] Continuing without a resolved current user", {
    event: INITIALIZATION_EVENT.CURRENT_USER_UNRESOLVED,
    error_code: INITIALIZATION_ERROR_CODE.CURRENT_USER_UNRESOLVED,
    seeding_run_id,
    error: current_user_result.error,
  });
  return false;
}

export async function handle_convex_success(
  on_progress: ProgressCallback,
  convex_result: ConvexSeedSummary,
  seeding_run_id: string,
): Promise<SeedResult> {
  on_progress(
    INITIALIZATION_PROGRESS_MESSAGE.SERVER_DATA_LOADED,
    INITIALIZATION_PROGRESS_PERCENT.CONVEX_LOADED,
  );
  console.log("[Seeding] Convex seeding succeeded", {
    event: INITIALIZATION_EVENT.CONVEX_SEEDING_SUCCEEDED,
    seeding_run_id,
    total_records: convex_result.total_records,
    tables_fetched: convex_result.tables_fetched,
  });
  await restore_current_user(seeding_run_id);
  const marked = await mark_seeding_complete();
  return marked.success
    ? create_convex_success_seed_result()
    : create_failed_seed_result(marked.error);
}
