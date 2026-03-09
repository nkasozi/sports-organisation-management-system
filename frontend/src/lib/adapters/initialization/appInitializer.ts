import { PUBLIC_CONVEX_URL } from "$env/static/public";
import { get } from "svelte/store";
import { get_repository_container } from "$lib/infrastructure/container";
import { get_organization_use_cases } from "$lib/core/usecases/OrganizationUseCases";
import { get_competition_use_cases } from "$lib/core/usecases/CompetitionUseCases";
import { get_team_use_cases } from "$lib/core/usecases/TeamUseCases";
import { get_player_use_cases } from "$lib/core/usecases/PlayerUseCases";
import { get_player_team_membership_use_cases } from "$lib/core/usecases/PlayerTeamMembershipUseCases";
import { get_official_use_cases } from "$lib/core/usecases/OfficialUseCases";
import { get_fixture_use_cases } from "$lib/core/usecases/FixtureUseCases";
import { get_sport_use_cases } from "$lib/core/usecases/SportUseCases";
import { get_player_position_use_cases } from "$lib/core/usecases/PlayerPositionUseCases";
import { get_team_staff_use_cases } from "$lib/core/usecases/TeamStaffUseCases";
import { get_team_staff_role_use_cases } from "$lib/core/usecases/TeamStaffRoleUseCases";
import { get_competition_format_use_cases } from "$lib/core/usecases/CompetitionFormatUseCases";
import { get_game_official_role_use_cases } from "$lib/core/usecases/GameOfficialRoleUseCases";
import {
  seed_from_convex_or_local,
  is_seeding_already_complete,
  type SeedingStrategy,
  type SeedResult,
} from "./seedingService";
import { initialize_audit_event_handlers } from "$lib/infrastructure/handlers/AuditEventHandler";
import { first_time_setup_store } from "$lib/presentation/stores/firstTimeSetup";
import { app_status_store } from "$lib/presentation/stores/appStatus";
import { ConvexClient } from "convex/browser";
import { sync_store } from "$lib/presentation/stores/syncStore";
import {
  initialize_clerk,
  get_session_token,
  is_signed_in,
} from "$lib/adapters/iam/clerkAuthService";
import { get_authentication_adapter } from "$lib/adapters/iam/LocalAuthenticationAdapter";
import { get_authorization_adapter } from "$lib/infrastructure/AuthorizationProvider";
import { get_clerk_authentication_adapter } from "$lib/adapters/iam/ClerkAuthenticationAdapter";
import {
  create_auth_cache_invalidator,
  type AuthCacheInvalidator,
} from "$lib/infrastructure/cache/AuthCacheInvalidator";
import { api } from "$convex/_generated/api";
import { get_system_user_repository } from "$lib/adapters/repositories/InBrowserSystemUserRepository";
import {
  start_background_sync,
  stop_background_sync,
} from "$lib/infrastructure/sync/backgroundSyncService";
import {
  start_realtime_sync,
  stop_realtime_sync,
} from "$lib/infrastructure/sync/convexRealtimeSync";
import type { SubscribableConvexClient } from "$lib/infrastructure/cache/AuthCacheInvalidator";

let initialized = false;
let auth_cache_invalidator: AuthCacheInvalidator | null = null;

const FIRST_TIME_DETECTION_KEY = "sports_org_app_initialized";

function is_first_time_use(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(FIRST_TIME_DETECTION_KEY) !== "true";
}

function mark_app_initialized(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(FIRST_TIME_DETECTION_KEY, "true");
}

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function initialize_convex_client(): ConvexClient | null {
  const convex_url = PUBLIC_CONVEX_URL;

  if (!convex_url) {
    console.log(
      "[Convex] No PUBLIC_CONVEX_URL configured, skipping Convex initialization",
    );
    return null;
  }

  try {
    const client = new ConvexClient(convex_url);

    client.setAuth(async () => {
      const token = await get_session_token();
      return token ?? undefined;
    });

    sync_store.set_convex_client({
      mutation: (name: string, args: Record<string, unknown>) =>
        client.mutation(name as never, args as never),
      query: (name: string, args: Record<string, unknown>) =>
        client.query(name as never, args as never),
    });
    console.log(
      "[Convex] Client initialized successfully with URL:",
      convex_url,
    );
    return client;
  } catch (error) {
    console.error("[Convex] Failed to initialize client:", error);
    return null;
  }
}

function start_auth_cache_invalidation(convex_client: ConvexClient): boolean {
  if (auth_cache_invalidator?.is_running()) return false;

  const local_auth_adapter = get_authentication_adapter(
    get_system_user_repository(),
  );
  const clerk_auth_adapter = get_clerk_authentication_adapter();
  const authz_adapter = get_authorization_adapter();

  const local_verification_cache = local_auth_adapter.get_verification_cache();
  const clerk_verification_cache = clerk_auth_adapter.get_verification_cache();
  const authorization_cache = authz_adapter.get_authorization_cache();

  auth_cache_invalidator = create_auth_cache_invalidator({
    convex_client:
      convex_client as unknown as import("$lib/infrastructure/cache/AuthCacheInvalidator").SubscribableConvexClient,
    caches_to_invalidate: [
      local_verification_cache,
      clerk_verification_cache,
      authorization_cache,
    ],
    queries_to_watch: [api.authorization.get_current_user_profile],
  });

  const started = auth_cache_invalidator.start();

  if (started) {
    console.log(
      "[AppInitializer] Auth cache invalidation started via Convex subscriptions",
    );
  }

  return started;
}

type InitResult = "success" | "redirect_to_login";

interface InitializeOptions {
  current_path: string;
}

function get_is_public_content_page(path: string): boolean {
  return (
    path.startsWith("/competition-results") ||
    path.startsWith("/calendar") ||
    path.startsWith("/match-report")
  );
}

function determine_seeding_strategy(
  user_is_signed_in: boolean,
  current_path: string,
): SeedingStrategy {
  if (!user_is_signed_in && get_is_public_content_page(current_path)) {
    return "skip_seeding";
  }
  if (!user_is_signed_in) {
    return "convex_first_with_local_fallback";
  }
  return "convex_mandatory";
}

export async function initialize_app_data(
  options: InitializeOptions,
): Promise<InitResult> {
  if (initialized) return "success";
  if (typeof window === "undefined") return "success";

  const is_first_time = is_first_time_use();

  if (is_first_time) {
    first_time_setup_store.set_first_time(true);
    first_time_setup_store.start_setup();
    await delay(500);
  }

  if (is_first_time) {
    first_time_setup_store.update_progress("Initializing audit system...", 10);
    await delay(300);
  }
  initialize_audit_event_handlers();

  await initialize_clerk();
  const convex_client = initialize_convex_client();
  const user_is_signed_in = get(is_signed_in);

  if (convex_client) {
    start_auth_cache_invalidation(convex_client);
  }

  if (is_first_time) {
    first_time_setup_store.update_progress(
      "Setting up data repositories...",
      20,
    );
    await delay(300);
  }
  initialize_all_use_cases();

  const strategy = determine_seeding_strategy(
    user_is_signed_in,
    options.current_path,
  );
  console.log(
    `[AppInitializer] Seeding strategy: ${strategy} (signed_in=${user_is_signed_in}, path=${options.current_path})`,
  );

  const seed_outcome = await run_seeding_with_strategy(strategy, is_first_time);

  if (seed_outcome === "redirect_to_login") {
    return "redirect_to_login";
  }

  start_background_sync();

  if (convex_client) {
    start_realtime_sync(
      convex_client as unknown as SubscribableConvexClient,
      {
        mutation: (name: string, args: Record<string, unknown>) =>
          convex_client.mutation(name as never, args as never),
        query: (name: string, args: Record<string, unknown>) =>
          convex_client.query(name as never, args as never),
      },
      api.sync.get_latest_modified_at,
    );
    console.log(
      "[AppInitializer] Real-time sync started via Convex subscriptions",
    );
  }

  initialized = true;
  return "success";
}

function initialize_all_use_cases(): void {
  get_repository_container();
  get_sport_use_cases();
  get_organization_use_cases();
  get_player_position_use_cases();
  get_team_staff_role_use_cases();
  get_game_official_role_use_cases();
  get_competition_format_use_cases();
  get_team_use_cases();
  get_player_use_cases();
  get_player_team_membership_use_cases();
  get_team_staff_use_cases();
  get_official_use_cases();
  get_competition_use_cases();
  get_fixture_use_cases();
}

async function run_seeding_with_strategy(
  strategy: SeedingStrategy,
  is_first_time: boolean,
): Promise<InitResult> {
  if (strategy === "skip_seeding") {
    console.log("[AppInitializer] Public viewer — skipping seeding");
    if (is_first_time) {
      first_time_setup_store.update_progress("Preparing public view...", 90);
      await delay(200);
      mark_app_initialized();
      first_time_setup_store.complete_setup();
      await delay(400);
    }
    return "success";
  }

  if (is_first_time) {
    const connecting_message =
      strategy === "convex_mandatory"
        ? "Pulling data from server..."
        : "Checking server for existing data...";
    first_time_setup_store.update_progress(connecting_message, 30);
    await delay(300);
  }

  const progress_callback = is_first_time
    ? (message: string, percentage: number) =>
        first_time_setup_store.update_progress(message, percentage)
    : (_message: string, _percentage: number) => {};

  const seed_result = await seed_from_convex_or_local(
    progress_callback,
    strategy,
  );

  return handle_seed_result(seed_result, is_first_time);
}

async function handle_seed_result(
  seed_result: SeedResult,
  is_first_time: boolean,
): Promise<InitResult> {
  switch (seed_result.outcome) {
    case "convex_success": {
      app_status_store.set_online();
      if (is_first_time) {
        first_time_setup_store.update_progress("Data loaded from server", 90);
        await delay(400);
        await finalize_first_time_setup();
      }
      return "success";
    }

    case "local_fallback_success": {
      app_status_store.set_online();
      if (is_first_time) {
        first_time_setup_store.update_progress(
          "Demo data loaded (offline mode)",
          90,
        );
        await delay(400);
        await finalize_first_time_setup();
      }
      return "success";
    }

    case "offline_mode": {
      app_status_store.set_offline(seed_result.error_message);
      console.warn(
        `[AppInitializer] Offline mode: ${seed_result.error_message}`,
      );
      if (is_first_time) {
        await finalize_first_time_setup();
      }
      return "success";
    }

    case "convex_required_but_unavailable": {
      console.error(
        `[AppInitializer] Cannot proceed: ${seed_result.error_message}`,
      );
      if (is_first_time) {
        first_time_setup_store.update_progress(seed_result.error_message, 0);
        await delay(1500);
        first_time_setup_store.complete_setup();
      }
      return "redirect_to_login";
    }

    case "skipped": {
      return "success";
    }

    default: {
      console.error(
        `[AppInitializer] Seeding failed: ${seed_result.error_message}`,
      );
      if (is_first_time) {
        await finalize_first_time_setup();
      }
      return "success";
    }
  }
}

async function finalize_first_time_setup(): Promise<void> {
  first_time_setup_store.update_progress("Finalizing setup...", 95);
  await delay(400);
  mark_app_initialized();
  first_time_setup_store.complete_setup();
  await delay(600);
}

export function reset_initialization(): void {
  stop_background_sync();
  stop_realtime_sync();
  if (auth_cache_invalidator?.is_running()) {
    auth_cache_invalidator.stop();
    auth_cache_invalidator = null;
  }
  initialized = false;
}

export { is_seeding_already_complete };
