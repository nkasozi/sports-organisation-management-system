import { PUBLIC_CONVEX_URL } from "$env/static/public";
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
  seed_all_data_if_needed,
  is_seeding_already_complete,
} from "./seedingService";
import { initialize_audit_event_handlers } from "$lib/infrastructure/handlers/AuditEventHandler";
import { first_time_setup_store } from "$lib/presentation/stores/firstTimeSetup";
import { ConvexClient } from "convex/browser";
import { sync_store } from "$lib/presentation/stores/syncStore";
import {
  initialize_clerk,
  get_session_token,
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

export async function initialize_app_data(): Promise<boolean> {
  if (initialized) return true;
  if (typeof window === "undefined") return false;

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
  get_repository_container();

  if (is_first_time) {
    first_time_setup_store.update_progress(
      "Loading sport configurations...",
      30,
    );
    await delay(200);
  }
  get_sport_use_cases();
  get_organization_use_cases();

  if (is_first_time) {
    first_time_setup_store.update_progress(
      "Configuring player positions...",
      40,
    );
    await delay(200);
  }
  get_player_position_use_cases();
  get_team_staff_role_use_cases();
  get_game_official_role_use_cases();
  get_competition_format_use_cases();

  if (is_first_time) {
    first_time_setup_store.update_progress("Setting up team management...", 50);
    await delay(200);
  }
  get_team_use_cases();
  get_player_use_cases();
  get_player_team_membership_use_cases();

  if (is_first_time) {
    first_time_setup_store.update_progress(
      "Configuring staff and officials...",
      60,
    );
    await delay(200);
  }
  get_team_staff_use_cases();
  get_official_use_cases();

  if (is_first_time) {
    first_time_setup_store.update_progress("Loading competition system...", 70);
    await delay(200);
  }
  get_competition_use_cases();
  get_fixture_use_cases();

  if (is_first_time) {
    first_time_setup_store.update_progress("Seeding demo data...", 80);
    await delay(300);
  }
  await seed_all_data_if_needed();

  start_background_sync();

  if (is_first_time) {
    first_time_setup_store.update_progress("Finalizing setup...", 95);
    await delay(400);
    mark_app_initialized();
    first_time_setup_store.complete_setup();
    await delay(600);
  }

  initialized = true;
  return true;
}

export function reset_initialization(): void {
  stop_background_sync();
  if (auth_cache_invalidator?.is_running()) {
    auth_cache_invalidator.stop();
    auth_cache_invalidator = null;
  }
  initialized = false;
}

export { is_seeding_already_complete };
