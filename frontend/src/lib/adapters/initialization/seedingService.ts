import {
  sync_change_tracking_gate,
  UntrackedWriteReason,
} from "$lib/adapters/repositories/syncOutbox/syncChangeTrackingGate";
import { run_untracked_write_scope } from "$lib/adapters/repositories/syncOutbox/untrackedWriteScope";
import type { UntrackedWriteScope } from "$lib/adapters/repositories/syncOutbox/untrackedWriteScopeToken";

import type { Result } from "../../core/types/Result";
import {
  create_failure_result,
  create_success_result,
} from "../../core/types/Result";
import type { ProgressCallback } from "../../infrastructure/sync/convexSeedingService";
import {
  is_browser_environment,
  SEEDING_COMPLETION_STATE,
  SEEDING_STRATEGY,
} from "./initializationConstants";
import {
  INITIALIZATION_ERROR_CODE,
  INITIALIZATION_EVENT,
} from "./initializationEvents";
import { INITIALIZATION_ERROR_MESSAGE } from "./initializationMessages";
import { seed_demo_data } from "./seedingDemoData";
import {
  handle_convex_mandatory,
  handle_convex_with_local_fallback,
  handle_local_only_seeding,
  handle_skip_seeding,
} from "./seedingStrategies";
import {
  is_seeding_already_complete,
  type SeedingStrategy,
  type SeedResult,
} from "./seedingTypes";
import { load_and_set_current_user } from "./seedingUserSetup";

export type { SeedingStrategy, SeedResult } from "./seedingTypes";
export { is_seeding_already_complete } from "./seedingTypes";

async function restore_current_user_for_seeded_app(): Promise<Result<boolean>> {
  const current_user_result = await load_and_set_current_user();
  if (!current_user_result.success) {
    console.warn("[Seeding] Could not resolve current user", {
      event: INITIALIZATION_EVENT.CURRENT_USER_UNRESOLVED,
      error: current_user_result.error,
    });
  }
  return create_success_result(true);
}

function fail_demo_seed(
  scope: UntrackedWriteScope,
  error: string,
): Result<boolean> {
  console.error("[Seeding] Demo seed could not run", {
    event: INITIALIZATION_EVENT.DEMO_SEED_FAILED,
    error_code: INITIALIZATION_ERROR_CODE.SEEDING_STATE_UNREADABLE,
    correlation_id: scope.scope_id,
    error,
  });
  return create_failure_result(error);
}

async function seed_all_data_when_missing(
  scope: UntrackedWriteScope,
): Promise<Result<boolean>> {
  const completion_state = await is_seeding_already_complete();
  switch (completion_state) {
    case SEEDING_COMPLETION_STATE.COMPLETE:
      return restore_current_user_for_seeded_app();
    case SEEDING_COMPLETION_STATE.UNREADABLE:
      return fail_demo_seed(
        scope,
        INITIALIZATION_ERROR_MESSAGE.SEEDING_STATE_UNREADABLE,
      );
    case SEEDING_COMPLETION_STATE.NOT_COMPLETE:
      return is_browser_environment()
        ? seed_demo_data(scope)
        : fail_demo_seed(scope, INITIALIZATION_ERROR_MESSAGE.NOT_IN_BROWSER);
  }
}

export async function seed_all_data_if_needed(): Promise<Result<boolean>> {
  const scope_result = await run_untracked_write_scope(
    sync_change_tracking_gate,
    UntrackedWriteReason.DEMO_SEED,
    seed_all_data_when_missing,
  );
  return scope_result.success
    ? scope_result.data
    : create_failure_result(scope_result.error);
}

export async function seed_from_convex_or_local(
  on_progress: ProgressCallback,
  strategy: SeedingStrategy,
): Promise<SeedResult> {
  switch (strategy) {
    case SEEDING_STRATEGY.SKIP_SEEDING:
      return handle_skip_seeding();
    case SEEDING_STRATEGY.LOCAL_ONLY:
      return handle_local_only_seeding(on_progress);
    case SEEDING_STRATEGY.CONVEX_FIRST_WITH_LOCAL_FALLBACK:
      return handle_convex_with_local_fallback(on_progress);
    case SEEDING_STRATEGY.CONVEX_MANDATORY:
      return handle_convex_mandatory(on_progress);
  }
}
