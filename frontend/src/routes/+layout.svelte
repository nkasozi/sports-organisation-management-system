<script lang="ts">
  import { onMount } from "svelte";
  import { injectAnalytics } from "@vercel/analytics/sveltekit";
  import "../app.css";
  import Layout from "$lib/presentation/components/layout/Layout.svelte";
  import FirstTimeSetup from "$lib/presentation/components/ui/FirstTimeSetup.svelte";
  import { initialize_app_data } from "$lib/adapters/services/appInitializer";
  import { first_time_setup_store } from "$lib/presentation/stores/firstTimeSetup";

  injectAnalytics();

  let show_first_time_setup = false;

  $: if (
    $first_time_setup_store.is_first_time &&
    $first_time_setup_store.is_setting_up
  ) {
    show_first_time_setup = true;
  }

  $: if ($first_time_setup_store.setup_complete) {
    show_first_time_setup = false;
  }

  onMount(async () => {
    await initialize_app_data();
  });
</script>

{#if show_first_time_setup}
  <FirstTimeSetup
    status_message={$first_time_setup_store.status_message}
    progress_percentage={$first_time_setup_store.progress_percentage}
  />
{/if}

<Layout>
  <slot />
</Layout>
