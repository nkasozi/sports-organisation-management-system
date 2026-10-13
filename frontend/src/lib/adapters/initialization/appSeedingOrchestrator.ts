import { app_status_store } from "$lib/presentation/stores/appStatus";

import {
  close_setup_without_initializing,
  complete_setup,
  create_progress_callback,
  create_setup_progress_reporter,
  finalize_setup,
  report_setup_step,
  type SetupProgressReporter,
  show_setup_error,
} from "./appSetupProgressReporter";
import {
  APP_INIT_RESULT,
  type AppInitResult,
  FIRST_TIME_CONNECT_DELAY_MS,
  FIRST_TIME_PUBLIC_VIEW_DELAY_MS,
  FIRST_TIME_PUBLIC_VIEW_FINAL_DELAY_MS,
  FIRST_TIME_STEP_DELAY_MS,
  SEED_OUTCOME,
  SEEDING_STRATEGY,
} from "./initializationConstants";
import { INITIALIZATION_EVENT } from "./initializationEvents";
import {
  INITIALIZATION_PROGRESS_MESSAGE,
  INITIALIZATION_PROGRESS_PERCENT,
} from "./initializationMessages";
import {
  seed_from_convex_or_local,
  type SeedingStrategy,
  type SeedResult,
} from "./seedingService";

async function finish_with_data_loaded(
  reporter: SetupProgressReporter,
  message: string,
): Promise<AppInitResult> {
  app_status_store.set_online();
  await report_setup_step(
    reporter,
    message,
    INITIALIZATION_PROGRESS_PERCENT.DATA_READY,
    FIRST_TIME_STEP_DELAY_MS,
  );
  await finalize_setup(reporter);
  return APP_INIT_RESULT.SUCCESS;
}

async function finish_in_offline_mode(
  reporter: SetupProgressReporter,
  seed_result: SeedResult,
): Promise<AppInitResult> {
  app_status_store.set_offline(seed_result.error_message);
  console.warn("[AppInitializer] Continuing in offline mode", {
    event: INITIALIZATION_EVENT.APP_SEEDING_OFFLINE_MODE,
    outcome: seed_result.outcome,
  });
  await finalize_setup(reporter);
  return APP_INIT_RESULT.SUCCESS;
}

async function finish_blocked_on_server(
  reporter: SetupProgressReporter,
  seed_result: SeedResult,
): Promise<AppInitResult> {
  console.error("[AppInitializer] Cannot proceed without server data", {
    event: INITIALIZATION_EVENT.APP_SEEDING_BLOCKED,
    outcome: seed_result.outcome,
  });
  await show_setup_error(reporter, seed_result.error_message);
  close_setup_without_initializing(reporter);
  return APP_INIT_RESULT.REDIRECT_TO_LOGIN;
}

async function finish_after_failure(
  reporter: SetupProgressReporter,
  seed_result: SeedResult,
): Promise<AppInitResult> {
  console.error("[AppInitializer] Seeding failed", {
    event: INITIALIZATION_EVENT.APP_SEEDING_FAILED,
    outcome: seed_result.outcome,
    data_source: seed_result.data_source,
  });
  await show_setup_error(reporter, seed_result.error_message);
  await finalize_setup(reporter);
  return APP_INIT_RESULT.SUCCESS;
}

async function handle_seed_result(
  seed_result: SeedResult,
  reporter: SetupProgressReporter,
): Promise<AppInitResult> {
  switch (seed_result.outcome) {
    case SEED_OUTCOME.CONVEX_SUCCESS:
      return finish_with_data_loaded(
        reporter,
        INITIALIZATION_PROGRESS_MESSAGE.DATA_LOADED_FROM_SERVER,
      );
    case SEED_OUTCOME.LOCAL_FALLBACK_SUCCESS:
      return finish_with_data_loaded(
        reporter,
        INITIALIZATION_PROGRESS_MESSAGE.DEMO_DATA_LOADED_OFFLINE,
      );
    case SEED_OUTCOME.OFFLINE_MODE:
      return finish_in_offline_mode(reporter, seed_result);
    case SEED_OUTCOME.CONVEX_REQUIRED_BUT_UNAVAILABLE:
      return finish_blocked_on_server(reporter, seed_result);
    case SEED_OUTCOME.SKIPPED:
      return APP_INIT_RESULT.SUCCESS;
    case SEED_OUTCOME.FAILED:
      return finish_after_failure(reporter, seed_result);
  }
}

function describe_seeding_start(strategy: SeedingStrategy): string {
  switch (strategy) {
    case SEEDING_STRATEGY.LOCAL_ONLY:
      return INITIALIZATION_PROGRESS_MESSAGE.LOADING_OFFLINE_DATA;
    case SEEDING_STRATEGY.CONVEX_MANDATORY:
      return INITIALIZATION_PROGRESS_MESSAGE.PULLING_DATA_FROM_SERVER;
    case SEEDING_STRATEGY.CONVEX_FIRST_WITH_LOCAL_FALLBACK:
    case SEEDING_STRATEGY.SKIP_SEEDING:
      return INITIALIZATION_PROGRESS_MESSAGE.CHECKING_SERVER;
  }
}

async function prepare_public_view(
  reporter: SetupProgressReporter,
): Promise<AppInitResult> {
  await report_setup_step(
    reporter,
    INITIALIZATION_PROGRESS_MESSAGE.PREPARING_PUBLIC_VIEW,
    INITIALIZATION_PROGRESS_PERCENT.DATA_READY,
    FIRST_TIME_PUBLIC_VIEW_DELAY_MS,
  );
  await complete_setup(reporter, FIRST_TIME_PUBLIC_VIEW_FINAL_DELAY_MS);
  return APP_INIT_RESULT.SUCCESS;
}

export async function run_seeding_with_strategy(
  strategy: SeedingStrategy,
  is_first_time: boolean,
): Promise<AppInitResult> {
  const reporter = create_setup_progress_reporter(is_first_time);
  console.log("[AppInitializer] Seeding started", {
    event: INITIALIZATION_EVENT.APP_SEEDING_STARTED,
    strategy,
    progress_mode: reporter.mode,
  });
  if (strategy === SEEDING_STRATEGY.SKIP_SEEDING) {
    return prepare_public_view(reporter);
  }
  await report_setup_step(
    reporter,
    describe_seeding_start(strategy),
    INITIALIZATION_PROGRESS_PERCENT.FIRST_TIME_CONNECTING,
    FIRST_TIME_CONNECT_DELAY_MS,
  );
  const seed_result = await seed_from_convex_or_local(
    create_progress_callback(reporter),
    strategy,
  );
  return handle_seed_result(seed_result, reporter);
}
