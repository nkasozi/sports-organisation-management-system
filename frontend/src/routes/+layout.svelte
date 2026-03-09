<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { page, navigating } from "$app/stores";
  import { afterNavigate, goto } from "$app/navigation";
  import { injectAnalytics } from "@vercel/analytics/sveltekit";
  import "../app.css";
  import Layout from "$lib/presentation/components/layout/Layout.svelte";
  import PublicLayout from "$lib/presentation/components/layout/PublicLayout.svelte";
  import FirstTimeSetup from "$lib/presentation/components/ui/FirstTimeSetup.svelte";
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
  import { get } from "svelte/store";
  import InitialSyncOverlay from "$lib/presentation/components/ui/InitialSyncOverlay.svelte";
  import {
    initial_sync_store,
    has_session_been_synced,
  } from "$lib/presentation/stores/initialSyncStore";
  import { sync_store } from "$lib/presentation/stores/syncStore";
  import {
    stop_background_sync,
    start_background_sync,
    set_pulling_from_remote,
  } from "$lib/infrastructure/sync/backgroundSyncService";
  import { reset_database } from "$lib/adapters/repositories/database";
  import { reset_sync_metadata } from "$lib/infrastructure/sync/convexSyncService";
  import {
    reset_seeding_flag,
    seed_all_data_if_needed,
  } from "$lib/adapters/initialization/seedingService";
  import { ClerkProvider } from "svelte-clerk";
  import { auth_store } from "$lib/presentation/stores/auth";

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

  function get_is_public_profile_page(path: string): boolean {
    return path.startsWith("/profile/") || path.startsWith("/team-profile/");
  }

  function get_is_public_content_page(path: string): boolean {
    return (
      path.startsWith("/competition-results") ||
      path.startsWith("/calendar") ||
      path.startsWith("/match-report")
    );
  }

  function get_is_auth_page(path: string): boolean {
    return path.startsWith("/sign-in") || path === "/unauthorized";
  }

  function is_route_guard_exempt(path: string): boolean {
    return (
      path === "/" ||
      path.startsWith("/sign-in") ||
      path === "/unauthorized" ||
      path.startsWith("/api/") ||
      path === "/privacy" ||
      path === "/terms" ||
      path === "/contact" ||
      get_is_public_content_page(path)
    );
  }

  afterNavigate(async ({ to }) => {
    if (!app_ready) return;
    if (!to?.url?.pathname) return;

    const pathname = to.url.pathname;
    if (is_route_guard_exempt(pathname)) return;

    await ensure_route_access(pathname);
  });

  async function run_initial_sync_if_needed(): Promise<void> {
    if (has_session_been_synced()) return;
    if (!get(is_signed_in)) return;

    initial_sync_store.start_sync();

    initial_sync_store.update_progress("Stopping background processes...", 10);
    stop_background_sync();
    set_pulling_from_remote(true);

    initial_sync_store.update_progress("Clearing local data...", 20);
    await reset_database();
    reset_sync_metadata();
    reset_seeding_flag();

    initial_sync_store.update_progress("Seeding base configurations...", 35);
    await seed_all_data_if_needed();

    initial_sync_store.update_progress("Pulling data from server...", 50);
    set_pulling_from_remote(false);
    await sync_store.sync_now();

    initial_sync_store.update_progress("Pulling remaining data...", 75);
    await sync_store.sync_now();

    initial_sync_store.update_progress("Finalizing...", 95);
    start_background_sync();
    await new Promise((r) => setTimeout(r, 400));

    initial_sync_store.update_progress("Loading user profiles...", 98);
    await auth_store.initialize();

    initial_sync_store.complete_sync();
    await new Promise((r) => setTimeout(r, 500));
  }

  function cleanup_subscriptions(): void {
    unsubscribe_page?.();
    unsubscribe_setup?.();
    unsubscribe_clerk?.();
    unsubscribe_navigating?.();
    unsubscribe_sync?.();
    unsubscribe_page = null;
    unsubscribe_setup = null;
    unsubscribe_clerk = null;
    unsubscribe_navigating = null;
    unsubscribe_sync = null;
  }

  onMount(async () => {
    current_path = get(page).url.pathname;

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

    const init_result = await initialize_app_data({ current_path });

    if (init_result === "redirect_to_login") {
      app_ready = true;
      clerk_ready = true;
      await goto("/sign-in?error=server_unavailable");
      return;
    }

    await run_initial_sync_if_needed();
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
  {#if !app_ready || !clerk_ready}
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
        <FirstTimeSetup
          status_message={setup_status_message}
          progress_percentage={setup_progress_percentage}
        />
      {/if}

      {#if show_initial_sync}
        <InitialSyncOverlay
          status_message={sync_status_message}
          progress_percentage={sync_progress_percentage}
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
