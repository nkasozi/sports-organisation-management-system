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
  import { get } from "svelte/store";
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
  let unsubscribe_signed_in: (() => void) | null = null;
  let previous_signed_in_state = false;

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

  function format_table_name(table_name: string): string {
    return table_name
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  async function run_initial_sync_if_needed(): Promise<void> {
    if (has_session_been_synced()) {
      console.log("[Layout] Session already synced, skipping initial sync");
      return;
    }
    if (!get(is_signed_in)) {
      console.log("[Layout] User not signed in, skipping initial sync");
      return;
    }

    const current_sync_state = get(initial_sync_store);
    if (current_sync_state.is_syncing) {
      console.log(
        "[Layout] Sync already in progress, skipping duplicate request",
      );
      return;
    }

    console.log("[Layout] Starting initial sync from Convex...");
    initial_sync_store.start_sync();

    initial_sync_store.update_progress("Stopping background processes...", 5);
    stop_background_sync();
    set_pulling_from_remote(true);

    initial_sync_store.update_progress("Clearing local data...", 10);
    await reset_database();
    reset_sync_metadata();
    reset_seeding_flag();

    initial_sync_store.update_progress("Seeding base configurations...", 15);
    await seed_all_data_if_needed();

    initial_sync_store.update_progress("Starting data sync...", 20);
    set_pulling_from_remote(false);

    let sync_unsub: (() => void) | null = null;
    sync_unsub = sync_store.subscribe((state) => {
      if (state.current_progress) {
        const progress = state.current_progress;
        const base_percentage = 20;
        const sync_range = 70;
        const scaled_percentage =
          base_percentage +
          Math.round((progress.percentage / 100) * sync_range);
        const table_display = format_table_name(progress.table_name);
        const message = `Syncing ${table_display} (${progress.tables_completed}/${progress.total_tables})`;
        initial_sync_store.update_progress(message, scaled_percentage);
      }
    });

    await sync_store.sync_now();
    await sync_store.sync_now();

    if (sync_unsub) {
      sync_unsub();
      sync_unsub = null;
    }

    initial_sync_store.update_progress("Finalizing...", 92);
    start_background_sync();
    await new Promise((r) => setTimeout(r, 400));

    initial_sync_store.update_progress("Loading user profiles...", 96);
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
        "[Layout] User signed in detected, triggering initial sync...",
      );
      await run_initial_sync_if_needed();
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
