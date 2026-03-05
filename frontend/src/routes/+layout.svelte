<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { page, navigating } from "$app/stores";
  import { afterNavigate } from "$app/navigation";
  import { injectAnalytics } from "@vercel/analytics/sveltekit";
  import "../app.css";
  import Layout from "$lib/presentation/components/layout/Layout.svelte";
  import PublicLayout from "$lib/presentation/components/layout/PublicLayout.svelte";
  import FirstTimeSetup from "$lib/presentation/components/ui/FirstTimeSetup.svelte";
  import AuthChecker from "$lib/presentation/components/auth/AuthChecker.svelte";
  import { initialize_app_data } from "$lib/adapters/initialization/appInitializer";
  import { first_time_setup_store } from "$lib/presentation/stores/firstTimeSetup";
  import {
    is_clerk_loaded,
    set_navigating,
  } from "$lib/adapters/iam/clerkAuthService";
  import { ensure_route_access } from "$lib/presentation/logic/authGuard";
  import { get } from "svelte/store";

  injectAnalytics();

  let show_first_time_setup = false;
  let app_ready = false;
  let clerk_ready = false;
  let current_path = "";
  let setup_status_message = "";
  let setup_progress_percentage = 0;
  let unsubscribe_page: (() => void) | null = null;
  let unsubscribe_setup: (() => void) | null = null;
  let unsubscribe_clerk: (() => void) | null = null;
  let unsubscribe_navigating: (() => void) | null = null;

  function get_is_public_profile_page(path: string): boolean {
    return path.startsWith("/profile/") || path.startsWith("/team-profile/");
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
      path === "/contact"
    );
  }

  afterNavigate(async ({ to }) => {
    if (!app_ready) return;
    if (!to?.url?.pathname) return;

    const pathname = to.url.pathname;
    if (is_route_guard_exempt(pathname)) return;

    await ensure_route_access(pathname);
  });

  function cleanup_subscriptions(): void {
    unsubscribe_page?.();
    unsubscribe_setup?.();
    unsubscribe_clerk?.();
    unsubscribe_navigating?.();
    unsubscribe_page = null;
    unsubscribe_setup = null;
    unsubscribe_clerk = null;
    unsubscribe_navigating = null;
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

    await initialize_app_data();
    app_ready = true;

    const initial_path = get(page).url.pathname;
    if (!is_route_guard_exempt(initial_path)) {
      await ensure_route_access(initial_path);
    }
  });

  onDestroy(() => {
    cleanup_subscriptions();
  });
</script>

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

    {#if get_is_auth_page(current_path)}
      <slot />
    {:else if get_is_public_profile_page(current_path)}
      <PublicLayout>
        <slot />
      </PublicLayout>
    {:else}
      <Layout>
        <slot />
      </Layout>
    {/if}
  </AuthChecker>
{/if}
