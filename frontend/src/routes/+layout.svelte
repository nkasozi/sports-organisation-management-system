<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { page, navigating } from "$app/stores";
  import { afterNavigate, goto } from "$app/navigation";
  import { injectAnalytics } from "@vercel/analytics/sveltekit";
  import "../app.css";
  import Layout from "$lib/presentation/components/layout/Layout.svelte";
  import PublicLayout from "$lib/presentation/components/layout/PublicLayout.svelte";
  import FullScreenOverlay from "$lib/presentation/components/ui/FullScreenOverlay.svelte";
  import AuthChecker from "$lib/presentation/components/auth/AuthChecker.svelte";
  import {
    initialize_app_data,
    reset_initialization,
  } from "$lib/adapters/initialization/appInitializer";
  import { first_time_setup_store } from "$lib/presentation/stores/firstTimeSetup";
  import {
    is_clerk_loaded,
    is_signed_in,
    set_navigating,
  } from "$lib/adapters/iam/clerkAuthService";
  import { ensure_route_access } from "$lib/presentation/logic/authGuard";
  import {
    get_is_public_profile_page,
    get_is_public_content_page,
    get_is_auth_page,
    is_route_guard_exempt,
    determine_session_action,
    is_in_app_navigation,
    format_table_name,
    scale_sync_percentage,
    build_sync_progress_message,
    should_pull_org_from_server,
  } from "$lib/presentation/logic/layoutLogic";
  import { get } from "svelte/store";
  import {
    initial_sync_store,
    has_session_been_synced,
    clear_session_sync_flag,
  } from "$lib/presentation/stores/initialSyncStore";
  import { sync_store } from "$lib/presentation/stores/syncStore";
  import {
    stop_background_sync,
    start_background_sync,
    set_pulling_from_remote,
    trigger_full_sync_on_page_reload,
  } from "$lib/infrastructure/sync/backgroundSyncService";
  import { reset_database } from "$lib/adapters/repositories/database";
  import { reset_all_data } from "$lib/adapters/initialization/dataResetService";
  import { initialize_theme } from "$lib/presentation/stores/theme";
  import { branding_store } from "$lib/presentation/stores/branding";
  import { public_organization_store } from "$lib/presentation/stores/publicOrganization";
  import { current_user_store } from "$lib/presentation/stores/currentUser";
  import { ClerkProvider } from "svelte-clerk";
  import { EventBus } from "$lib/infrastructure/events/EventBus";
  import {
    auth_store,
    fetch_current_user_profile_from_convex,
  } from "$lib/presentation/stores/auth";
  import { sign_out } from "$lib/adapters/iam/clerkAuthService";
  import {
    write_convex_user_to_local_dexie,
    pull_user_scoped_record_from_convex,
    reset_sync_metadata,
  } from "$lib/infrastructure/sync/convexSyncService";
  import type { Result } from "$lib/core/types/Result";
  import {
    create_success_result,
    create_failure_result,
  } from "$lib/core/types/Result";

  injectAnalytics();

  let show_first_time_setup = false;
  let show_initial_sync = false;
  let app_ready = false;
  let clerk_ready = false;
  let current_path = "";
  let setup_status_message = "";
  let setup_progress_percentage = 0;
  let sync_status_message = "";
  let sync_progress_percentage = 0;
  let unsubscribe_page: (() => void) | null = null;
  let unsubscribe_setup: (() => void) | null = null;
  let unsubscribe_clerk: (() => void) | null = null;
  let unsubscribe_navigating: (() => void) | null = null;
  let unsubscribe_sync: (() => void) | null = null;
  let unsubscribe_signed_in: (() => void) | null = null;
  let previous_signed_in_state = false;

  afterNavigate(async ({ to, type }) => {
    if (!app_ready) return;
    if (!to?.url?.pathname) return;

    const pathname = to.url.pathname;
    if (is_route_guard_exempt(pathname)) return;

    if (!is_in_app_navigation(type)) {
      await ensure_route_access(pathname);
    }

    const user_is_signed_in = get(is_signed_in);
    if (!user_is_signed_in) return;

    const page_title = document.title || pathname;
    EventBus.emit_page_viewed(pathname, page_title);
  });

  async function handle_first_time_anonymous_user(): Promise<Result<boolean>> {
    initial_sync_store.start_sync();
    initial_sync_store.update_progress("Loading offline data...", 20);
    await reset_all_data((message, percentage) =>
      initial_sync_store.update_progress(message, percentage),
    );
    initial_sync_store.update_progress("Setting up your profile...", 85);
    auth_store.reset_initialized_state();
    await auth_store.initialize();
    initial_sync_store.complete_sync();
    console.log("[Layout] First-time anonymous user setup complete", {
      event: "anonymous_first_time_setup_complete",
    });
    return create_success_result(true);
  }

  async function handle_returning_anonymous_user(): Promise<Result<boolean>> {
    auth_store.reset_initialized_state();
    await auth_store.initialize();
    console.log("[Layout] Returning anonymous user session restored", {
      event: "anonymous_returning_session_restored",
    });
    return create_success_result(true);
  }

  async function handle_verified_user_page_reload(): Promise<Result<boolean>> {
    auth_store.reset_initialized_state();
    await auth_store.initialize();
    start_background_sync();
    void trigger_full_sync_on_page_reload();
    console.log("[Layout] Verified user page reload — session restored", {
      event: "verified_user_page_reload_complete",
    });
    return create_success_result(true);
  }

  async function log_verified_user_in(): Promise<Result<boolean>> {
    const current_sync_state = get(initial_sync_store);
    if (current_sync_state.is_syncing) {
      console.log(
        "[Layout] Sync already in progress, skipping duplicate request",
        {
          event: "sync_duplicate_skipped",
        },
      );
      return create_success_result(false);
    }

    initial_sync_store.start_sync();
    let sync_unsub: (() => void) | null = null;

    const cleanup_on_failure = async (
      error_message: string,
    ): Promise<Result<boolean>> => {
      console.error("[Layout] Login sync failed", {
        event: "login_sync_failed",
        error: error_message,
      });
      if (sync_unsub) {
        sync_unsub();
        sync_unsub = null;
      }
      initial_sync_store.reset();
      clear_session_sync_flag();
      await sign_out();
      await goto(`/sign-in?error=sync_failed`);
      return create_failure_result(error_message);
    };

    initial_sync_store.update_progress("Stopping background processes...", 5);
    stop_background_sync();

    initial_sync_store.update_progress("Looking up your profile...", 8);
    const profile_result = await fetch_current_user_profile_from_convex();

    if (!profile_result.success || !profile_result.data) {
      console.warn("[Layout] No Convex profile found for signed-in user", {
        event: "login_profile_not_found",
        error: !profile_result.success
          ? profile_result.error
          : "no_profile_data",
      });
      initial_sync_store.reset();
      clear_session_sync_flag();
      await sign_out();
      await goto("/unauthorized");
      return create_failure_result("No profile found for this account.");
    }

    const convex_profile = profile_result.data;
    initial_sync_store.update_progress(
      "Profile found. Preparing your workspace...",
      9,
    );

    set_pulling_from_remote(true);
    initial_sync_store.update_progress("Clearing local data...", 10);
    await reset_database();
    await reset_sync_metadata();

    initial_sync_store.update_progress("Setting up your account...", 17);
    await write_convex_user_to_local_dexie(convex_profile);

    if (should_pull_org_from_server(convex_profile.organization_id)) {
      initial_sync_store.update_progress("Loading your organisation...", 18);
      await pull_user_scoped_record_from_convex(
        "organizations",
        convex_profile.organization_id!,
      );
    }

    if (convex_profile.team_id) {
      initial_sync_store.update_progress("Loading your team...", 19);
      await pull_user_scoped_record_from_convex(
        "teams",
        convex_profile.team_id,
      );
    }

    initial_sync_store.update_progress("Starting data sync...", 20);
    set_pulling_from_remote(false);

    sync_unsub = sync_store.subscribe((state) => {
      if (!state.current_progress) return;
      const progress = state.current_progress;
      const scaled_percentage = scale_sync_percentage(progress.percentage);
      const message = build_sync_progress_message(
        progress.table_name,
        progress.tables_completed,
        progress.total_tables,
      );
      initial_sync_store.update_progress(message, scaled_percentage);
    });

    const first_sync_result = await sync_store.sync_now("pull");
    if (!first_sync_result.success && first_sync_result.errors.length > 0) {
      const error_msg =
        first_sync_result.errors[0]?.error || "Unknown sync error";
      return cleanup_on_failure(`Sync failed: ${error_msg}`);
    }

    if (sync_unsub) {
      sync_unsub();
      sync_unsub = null;
    }

    initial_sync_store.update_progress("Resolving references...", 88);
    await sync_store.sync_now("pull");

    initial_sync_store.update_progress("Almost ready...", 92);
    start_background_sync();
    await new Promise((r) => setTimeout(r, 400));

    initial_sync_store.update_progress("Loading your profile...", 96);
    auth_store.reset_initialized_state();
    await auth_store.initialize();

    initial_sync_store.complete_sync();
    await new Promise((r) => setTimeout(r, 500));

    console.log("[Layout] Verified user login sync complete", {
      event: "verified_user_login_sync_complete",
    });
    return create_success_result(true);
  }

  function cleanup_subscriptions(): void {
    unsubscribe_page?.();
    unsubscribe_setup?.();
    unsubscribe_clerk?.();
    unsubscribe_navigating?.();
    unsubscribe_sync?.();
    unsubscribe_signed_in?.();
    unsubscribe_page = null;
    unsubscribe_setup = null;
    unsubscribe_clerk = null;
    unsubscribe_navigating = null;
    unsubscribe_sync = null;
    unsubscribe_signed_in = null;
  }

  onMount(async () => {
    current_path = get(page).url.pathname;

    await initialize_theme();
    await branding_store.initialize();
    await public_organization_store.initialize();
    await current_user_store.initialize();

    unsubscribe_navigating = navigating.subscribe((nav) => {
      set_navigating(nav !== null);
    });

    unsubscribe_page = page.subscribe((p) => {
      current_path = p.url.pathname;
    });

    unsubscribe_setup = first_time_setup_store.subscribe((state) => {
      setup_status_message = state.status_message;
      setup_progress_percentage = state.progress_percentage;
      if (state.is_first_time && state.is_setting_up) {
        show_first_time_setup = true;
      }
      if (state.setup_complete) {
        show_first_time_setup = false;
      }
    });

    unsubscribe_clerk = is_clerk_loaded.subscribe((loaded) => {
      clerk_ready = loaded;
    });

    unsubscribe_sync = initial_sync_store.subscribe((state) => {
      sync_status_message = state.status_message;
      sync_progress_percentage = state.progress_percentage;
      show_initial_sync = state.is_syncing;
    });

    unsubscribe_signed_in = is_signed_in.subscribe(async (signed_in) => {
      const user_just_signed_in = signed_in && !previous_signed_in_state;
      previous_signed_in_state = signed_in;

      if (!user_just_signed_in) return;
      if (!app_ready) return;

      console.log(
        "[Layout] User signed in detected, triggering login sync...",
        {
          event: "user_sign_in_detected",
        },
      );
      await log_verified_user_in();
    });

    const session_already_synced = await has_session_been_synced();
    const init_result = await initialize_app_data({
      current_path,
      session_already_synced,
    });

    if (init_result === "redirect_to_login") {
      app_ready = true;
      clerk_ready = true;
      await goto("/sign-in?error=server_unavailable");
      return;
    }

    const user_is_signed_in = get(is_signed_in);
    const session_action = determine_session_action(
      user_is_signed_in,
      session_already_synced,
    );

    if (session_action === "login_sync") {
      await log_verified_user_in();
    } else if (session_action === "verified_page_reload") {
      await handle_verified_user_page_reload();
    } else if (session_action === "first_time_anonymous") {
      await handle_first_time_anonymous_user();
    } else {
      await handle_returning_anonymous_user();
    }

    app_ready = true;

    const initial_path = get(page).url.pathname;
    if (!is_route_guard_exempt(initial_path)) {
      await ensure_route_access(initial_path);
    }
  });

  onDestroy(() => {
    cleanup_subscriptions();
    reset_initialization();
  });
</script>

<ClerkProvider
  signInUrl="/sign-in"
  signInForceRedirectUrl="/"
  appearance={{
    variables: {
      colorBackground: "#1a1a2e",
      colorNeutral: "white",
      colorPrimary: "#2563eb",
      colorPrimaryForeground: "white",
      colorForeground: "white",
      colorInputForeground: "white",
      colorInput: "#26262B",
      borderRadius: "0.5rem",
    },
  }}
>
  {#if show_initial_sync}
    <FullScreenOverlay
      title="Syncing Data"
      subtitle="Please wait while we sync your data"
      status_message={sync_status_message}
      progress_percentage={sync_progress_percentage}
    />
  {:else if !app_ready || !clerk_ready}
    <div
      class="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900"
    >
      <div class="text-center">
        <div
          class="animate-spin rounded-full h-12 w-12 border-b-2 border-theme-primary-600 mx-auto"
        ></div>
        <p class="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    </div>
  {:else}
    <AuthChecker>
      {#if show_first_time_setup}
        <FullScreenOverlay
          title="Setting Up"
          subtitle="Preparing your environment"
          status_message={setup_status_message}
          progress_percentage={setup_progress_percentage}
        />
      {/if}

      {#if get_is_auth_page(current_path)}
        <slot />
      {:else if get_is_public_profile_page(current_path)}
        <PublicLayout>
          <slot />
        </PublicLayout>
      {:else if get_is_public_content_page(current_path) && !$is_signed_in}
        <Layout>
          <slot />
        </Layout>
      {:else}
        <Layout>
          <slot />
        </Layout>
      {/if}
    </AuthChecker>
  {/if}
</ClerkProvider>
