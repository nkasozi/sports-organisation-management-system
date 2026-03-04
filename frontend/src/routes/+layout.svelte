<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { PUBLIC_CLERK_PUBLISHABLE_KEY } from "$env/static/public";
  import { injectAnalytics } from "@vercel/analytics/sveltekit";
  import { ClerkProvider } from "svelte-clerk";
  import "../app.css";
  import Layout from "$lib/presentation/components/layout/Layout.svelte";
  import PublicLayout from "$lib/presentation/components/layout/PublicLayout.svelte";
  import FirstTimeSetup from "$lib/presentation/components/ui/FirstTimeSetup.svelte";
  import { initialize_app_data } from "$lib/adapters/initialization/appInitializer";
  import { first_time_setup_store } from "$lib/presentation/stores/firstTimeSetup";
  import {
    set_clerk_token_getter,
    update_clerk_session_state,
  } from "$lib/adapters/iam/clerkAuthService";

  injectAnalytics();

  const clerk_publishable_key = PUBLIC_CLERK_PUBLISHABLE_KEY;
  let show_first_time_setup = false;

  $: is_public_profile_page =
    $page.url.pathname.startsWith("/profile/") ||
    $page.url.pathname.startsWith("/team-profile/");

  $: if (
    $first_time_setup_store.is_first_time &&
    $first_time_setup_store.is_setting_up
  ) {
    show_first_time_setup = true;
  }

  $: if ($first_time_setup_store.setup_complete) {
    show_first_time_setup = false;
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  }

  function handle_clerk_loaded(clerk: unknown): void {
    const clerk_instance = clerk as {
      session?: {
        getToken: (opts: { template: string }) => Promise<string | null>;
      } | null;
      user?: { id: string; emailAddresses?: { emailAddress: string }[] } | null;
    };

    if (clerk_instance.session) {
      set_clerk_token_getter(async () => {
        const token = await clerk_instance.session?.getToken({
          template: "convex",
        });
        return token ?? null;
      });
    }

    const is_signed_in = !!clerk_instance.session;
    const user_id = clerk_instance.user?.id ?? null;
    const user_email =
      clerk_instance.user?.emailAddresses?.[0]?.emailAddress ?? null;

    update_clerk_session_state(is_signed_in, user_id, user_email);
  }

  onMount(async () => {
    await initialize_app_data();
  });
</script>

{#if clerk_publishable_key}
  <ClerkProvider
    publishableKey={clerk_publishable_key}
    on:load={(e: CustomEvent) => handle_clerk_loaded(e.detail)}
  >
    {#if show_first_time_setup}
      <FirstTimeSetup
        status_message={$first_time_setup_store.status_message}
        progress_percentage={$first_time_setup_store.progress_percentage}
      />
    {/if}

    {#if is_public_profile_page}
      <PublicLayout>
        <slot />
      </PublicLayout>
    {:else}
      <Layout>
        <slot />
      </Layout>
    {/if}
  </ClerkProvider>
{:else}
  {#if show_first_time_setup}
    <FirstTimeSetup
      status_message={$first_time_setup_store.status_message}
      progress_percentage={$first_time_setup_store.progress_percentage}
    />
  {/if}

  {#if is_public_profile_page}
    <PublicLayout>
      <slot />
    </PublicLayout>
  {:else}
    <Layout>
      <slot />
    </Layout>
  {/if}
{/if}
