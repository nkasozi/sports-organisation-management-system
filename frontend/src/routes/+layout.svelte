<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { PUBLIC_CLERK_PUBLISHABLE_KEY } from "$env/static/public";
  import { injectAnalytics } from "@vercel/analytics/sveltekit";
  import { ClerkProvider, ClerkLoaded, ClerkLoading } from "svelte-clerk";
  import "../app.css";
  import Layout from "$lib/presentation/components/layout/Layout.svelte";
  import PublicLayout from "$lib/presentation/components/layout/PublicLayout.svelte";
  import FirstTimeSetup from "$lib/presentation/components/ui/FirstTimeSetup.svelte";
  import AuthChecker from "$lib/presentation/components/auth/AuthChecker.svelte";
  import { initialize_app_data } from "$lib/adapters/initialization/appInitializer";
  import { first_time_setup_store } from "$lib/presentation/stores/firstTimeSetup";

  injectAnalytics();

  const clerk_publishable_key = PUBLIC_CLERK_PUBLISHABLE_KEY;
  let show_first_time_setup = false;
  let clerk_ready = false;

  $: is_public_profile_page =
    $page.url.pathname.startsWith("/profile/") ||
    $page.url.pathname.startsWith("/team-profile/");

  $: is_auth_page =
    $page.url.pathname.startsWith("/sign-in") ||
    $page.url.pathname === "/unauthorized";

  $: if (
    $first_time_setup_store.is_first_time &&
    $first_time_setup_store.is_setting_up
  ) {
    show_first_time_setup = true;
  }

  $: if ($first_time_setup_store.setup_complete) {
    show_first_time_setup = false;
    if (typeof window !== "undefined") {
      setTimeout(() => window.location.reload(), 50);
    }
  }

  onMount(async () => {
    await initialize_app_data();
    clerk_ready = true;
  });
</script>

{#if clerk_publishable_key && clerk_ready}
  <ClerkProvider publishableKey={clerk_publishable_key}>
    <ClerkLoading>
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
    </ClerkLoading>

    <ClerkLoaded>
      <AuthChecker>
        {#if show_first_time_setup}
          <FirstTimeSetup
            status_message={$first_time_setup_store.status_message}
            progress_percentage={$first_time_setup_store.progress_percentage}
          />
        {/if}

        {#if is_auth_page}
          <slot />
        {:else if is_public_profile_page}
          <PublicLayout>
            <slot />
          </PublicLayout>
        {:else}
          <Layout>
            <slot />
          </Layout>
        {/if}
      </AuthChecker>
    </ClerkLoaded>
  </ClerkProvider>
{:else if clerk_publishable_key && !clerk_ready}
  <div
    class="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900"
  >
    <div class="text-center">
      <div
        class="animate-spin rounded-full h-12 w-12 border-b-2 border-theme-primary-600 mx-auto"
      ></div>
      <p class="mt-4 text-gray-600 dark:text-gray-400">Initializing...</p>
    </div>
  </div>
{:else}
  {#if show_first_time_setup}
    <FirstTimeSetup
      status_message={$first_time_setup_store.status_message}
      progress_percentage={$first_time_setup_store.progress_percentage}
    />
  {/if}

  {#if is_auth_page}
    <slot />
  {:else if is_public_profile_page}
    <PublicLayout>
      <slot />
    </PublicLayout>
  {:else}
    <Layout>
      <slot />
    </Layout>
  {/if}
{/if}
