import type { ConvexClient } from "convex/browser";
import { get } from "svelte/store";

import {
  initialize_clerk,
  is_signed_in,
} from "$lib/adapters/iam/clerkAuthService";
import type { Result } from "$lib/core/types/Result";
import { initialize_audit_event_handlers } from "$lib/infrastructure/handlers/AuditEventHandler";
import { stop_background_sync } from "$lib/infrastructure/sync/backgroundSyncService";
import { stop_realtime_sync } from "$lib/infrastructure/sync/convexRealtimeSync";
import { sync_review_store } from "$lib/presentation/stores/conflictStoreSyncReviewInstance";

import { wait_for_clerk_to_settle } from "./appClerkReadiness";
import {
  initialize_convex_client,
  start_auth_cache_invalidation,
  stop_auth_cache_invalidation,
} from "./appConvexInitializer";
import {
  announce_first_time_setup_step,
  FIRST_TIME_SETUP_STEP,
  is_first_time_use,
} from "./appFirstTimeSetupProgress";
import {
  forget_realtime_session,
  remember_realtime_convex_client,
  start_realtime_sync_when_signed_in,
} from "./appInitializerRealtime";
import { determine_seeding_strategy } from "./appInitializerSeedingStrategy";
import { run_seeding_with_strategy } from "./appSeedingOrchestrator";
import { initialize_all_use_cases } from "./appUseCaseInitializer";
import {
  APP_INIT_RESULT,
  type AppInitResult,
  is_browser_environment,
} from "./initializationConstants";
import {
  is_seeding_already_complete,
  type SeedingStrategy,
} from "./seedingService";

export {
  determine_seeding_strategy,
  get_is_public_content_page,
} from "./appInitializerSeedingStrategy";

const AppInitializationStatus = {
  NOT_INITIALIZED: "not_initialized",
  INITIALIZED: "initialized",
} as const;

type AppInitializationStatusValue =
  (typeof AppInitializationStatus)[keyof typeof AppInitializationStatus];

let initialization_status: AppInitializationStatusValue =
  AppInitializationStatus.NOT_INITIALIZED;

const APP_INITIALIZER_EVENT = {
  SEEDING_STRATEGY_DETERMINED: "seeding_strategy_determined",
  SYNC_REVIEW_RESTORE_FAILED: "sync_review_restore_failed",
} as const;

interface InitializeOptions {
  current_path: string;
  session_already_synced: boolean;
}
interface PreparedRuntimeServices {
  convex_client_result: Result<ConvexClient>;
  user_is_signed_in: boolean;
}

async function resolve_seeding_strategy(
  user_is_signed_in: boolean,
  options: InitializeOptions,
): Promise<SeedingStrategy> {
  const strategy = determine_seeding_strategy(
    user_is_signed_in,
    options.current_path,
    await is_seeding_already_complete(),
    options.session_already_synced,
  );
  console.log("[AppInitializer] Seeding strategy determined", {
    event: APP_INITIALIZER_EVENT.SEEDING_STRATEGY_DETERMINED,
    strategy,
    signed_in: user_is_signed_in,
    session_synced: options.session_already_synced,
    path: options.current_path,
  });
  return strategy;
}

async function prepare_runtime_services(
  is_first_time: boolean,
): Promise<PreparedRuntimeServices> {
  await announce_first_time_setup_step(
    is_first_time,
    FIRST_TIME_SETUP_STEP.AUDIT_SYSTEM,
  );
  initialize_audit_event_handlers();
  await initialize_clerk();
  await wait_for_clerk_to_settle();
  const convex_client_result = initialize_convex_client();
  const user_is_signed_in = get(is_signed_in);
  if (convex_client_result.success) {
    remember_realtime_convex_client(convex_client_result.data);
    start_auth_cache_invalidation(convex_client_result.data);
  }
  await announce_first_time_setup_step(
    is_first_time,
    FIRST_TIME_SETUP_STEP.DATA_REPOSITORIES,
  );
  initialize_all_use_cases();
  return { convex_client_result, user_is_signed_in };
}

async function restore_unresolved_sync_review(): Promise<number> {
  try {
    return await sync_review_store.restore_from_outbox();
  } catch (error) {
    console.error("[AppInitializer] Could not rebuild unresolved sync items", {
      event: APP_INITIALIZER_EVENT.SYNC_REVIEW_RESTORE_FAILED,
      error: String(error),
    });
    return 0;
  }
}

export async function initialize_app_data(
  options: InitializeOptions,
): Promise<AppInitResult> {
  switch (initialization_status) {
    case AppInitializationStatus.INITIALIZED:
      return APP_INIT_RESULT.SUCCESS;
    case AppInitializationStatus.NOT_INITIALIZED:
      return is_browser_environment()
        ? run_first_initialization(options)
        : APP_INIT_RESULT.SUCCESS;
  }
}

async function run_first_initialization(
  options: InitializeOptions,
): Promise<AppInitResult> {
  const is_first_time = await is_first_time_use();
  const { user_is_signed_in } = await prepare_runtime_services(is_first_time);
  const strategy = await resolve_seeding_strategy(user_is_signed_in, options);
  const seed_outcome = await run_seeding_with_strategy(strategy, is_first_time);
  switch (seed_outcome) {
    case APP_INIT_RESULT.REDIRECT_TO_LOGIN:
      return APP_INIT_RESULT.REDIRECT_TO_LOGIN;
    case APP_INIT_RESULT.SUCCESS:
      break;
  }
  await restore_unresolved_sync_review();
  start_realtime_sync_when_signed_in(user_is_signed_in);
  initialization_status = AppInitializationStatus.INITIALIZED;
  return APP_INIT_RESULT.SUCCESS;
}

export function reset_initialization(): boolean {
  stop_background_sync();
  stop_realtime_sync();
  stop_auth_cache_invalidation();
  forget_realtime_session();
  initialization_status = AppInitializationStatus.NOT_INITIALIZED;
  return true;
}

export function start_realtime_sync_for_signed_in_session(): boolean {
  return start_realtime_sync_when_signed_in(get(is_signed_in));
}
