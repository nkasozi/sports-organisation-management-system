import { get } from "svelte/store";

import { api } from "$convex/_generated/api";
import {
  initialize_clerk,
  is_clerk_loaded,
  is_signed_in,
} from "$lib/adapters/iam/clerkAuthService";
import type { SubscribableConvexClient } from "$lib/infrastructure/cache/AuthCacheInvalidator";
import { get_app_settings_storage } from "$lib/infrastructure/container";
import { initialize_audit_event_handlers } from "$lib/infrastructure/handlers/AuditEventHandler";
import { get_organization_settings_use_cases } from "$lib/infrastructure/registry/useCaseFactories";
import {
  configure_orchestrator,
  configure_remote_subscriber,
  configure_restoration_handlers,
  configure_scheduled_interval,
  stop_background_sync,
} from "$lib/infrastructure/sync/backgroundSyncService";
import {
  get_realtime_sync_adapter,
  start_realtime_sync,
  stop_realtime_sync,
} from "$lib/infrastructure/sync/convexRealtimeSync";
import { branding_store } from "$lib/presentation/stores/branding";
import { first_time_setup_store } from "$lib/presentation/stores/firstTimeSetup";
import { sync_store } from "$lib/presentation/stores/syncStore";

import {
  initialize_convex_client,
  start_auth_cache_invalidation,
  stop_auth_cache_invalidation,
} from "./appConvexInitializer";
import { run_seeding_with_strategy } from "./appSeedingOrchestrator";
import { initialize_all_use_cases } from "./appUseCaseInitializer";
import {
  is_seeding_already_complete,
  type SeedingStrategy,
} from "./seedingService";
let initialized = false;
const FIRST_TIME_DETECTION_KEY = "sports_org_app_initialized";

async function is_first_time_use(): Promise<boolean> {
  return (
    (await get_app_settings_storage().get_setting(FIRST_TIME_DETECTION_KEY)) !==
    "true"
  );
}

async function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

type InitResult = "success" | "redirect_to_login";
interface InitializeOptions {
  current_path: string;
  session_already_synced: boolean;
}

export function get_is_public_content_page(path: string): boolean {
  return (
    path.startsWith("/competition-results") ||
    path.startsWith("/calendar") ||
    path.startsWith("/match-report")
  );
}

export function determine_seeding_strategy(
  user_is_signed_in: boolean,
  current_path: string,
  seeding_already_complete: boolean,
  session_already_synced: boolean,
): SeedingStrategy {
  if (
    !user_is_signed_in &&
    get_is_public_content_page(current_path) &&
    seeding_already_complete
  ) {
    return "skip_seeding";
  }
  if (!user_is_signed_in) return "local_only";
  if (session_already_synced) return "skip_seeding";
  return "convex_mandatory";
}

export async function initialize_app_data(
  options: InitializeOptions,
): Promise<InitResult> {
  if (initialized) return "success";
  if (typeof window === "undefined") return "success";

  const is_first_time = await is_first_time_use();
  if (is_first_time) {
    first_time_setup_store.set_first_time(true);
    first_time_setup_store.start_setup();
    await delay(500);
    first_time_setup_store.update_progress("Initializing audit system...", 10);
    await delay(300);
  }
  initialize_audit_event_handlers();

  await initialize_clerk();

  const clerk_already_loaded = get(is_clerk_loaded);
  if (!clerk_already_loaded) {
    console.log(
      "[AppInitializer] Waiting for Clerk to settle before reading sign-in state...",
    );
    await new Promise<void>((resolve) => {
      const unsub = is_clerk_loaded.subscribe((loaded) => {
        if (!loaded) return;
        unsub();
        resolve();
      });
    });
  }

  const convex_client_result = initialize_convex_client();
  const user_is_signed_in = get(is_signed_in);

  if (convex_client_result.success) {
    start_auth_cache_invalidation(convex_client_result.data);
  }
  if (is_first_time) {
    first_time_setup_store.update_progress(
      "Setting up data repositories...",
      20,
    );
    await delay(300);
  }
  initialize_all_use_cases();

  const seeding_already_complete = await is_seeding_already_complete();
  const strategy = determine_seeding_strategy(
    user_is_signed_in,
    options.current_path,
    seeding_already_complete,
    options.session_already_synced,
  );
  console.log(`[AppInitializer] Seeding strategy: ${strategy}`, {
    event: "seeding_strategy_determined",
    strategy,
    signed_in: user_is_signed_in,
    session_synced: options.session_already_synced,
    path: options.current_path,
  });

  const seed_outcome = await run_seeding_with_strategy(strategy, is_first_time);
  if (seed_outcome === "redirect_to_login") return "redirect_to_login";

  if (convex_client_result.success && user_is_signed_in) {
    const convex_client = convex_client_result.data;
    const on_org_settings_pulled = async (
      table_name: string,
    ): Promise<void> => {
      if (table_name !== "organization_settings") return;
      const organization_context_state =
        branding_store.get_current_org_id_state();
      if (organization_context_state.status !== "scoped") return;
      const use_cases = get_organization_settings_use_cases();
      const settings_result = await use_cases.get_by_organization_id(
        organization_context_state.organization_id,
      );
      if (!settings_result.success || !settings_result.data) return;
      branding_store.refresh_from_organization_settings(settings_result.data);
      configure_scheduled_interval(settings_result.data.sync_interval_ms);
    };

    start_realtime_sync(
      convex_client as unknown as SubscribableConvexClient,
      {
        mutation: (name: string, args: Record<string, unknown>) =>
          convex_client.mutation(name as never, args as never),
        query: (name: string, args: Record<string, unknown>) =>
          convex_client.query(name as never, args as never),
      },
      api.sync.get_latest_modified_at,
      on_org_settings_pulled,
    );
    console.log(
      "[AppInitializer] Real-time sync started via Convex subscriptions",
    );
    const realtime_adapter = get_realtime_sync_adapter();
    configure_orchestrator(sync_store.get_sync_orchestrator());
    configure_remote_subscriber(realtime_adapter);
    configure_restoration_handlers({
      stop_remote_sync: () => realtime_adapter.stop(),
      start_remote_sync: () => realtime_adapter.start(),
    });
    console.log("[AppInitializer] Sync ports wired");
  }

  initialized = true;
  return "success";
}

export function reset_initialization(): void {
  stop_background_sync();
  stop_realtime_sync();
  stop_auth_cache_invalidation();
  initialized = false;
}
