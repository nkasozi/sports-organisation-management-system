<script lang="ts">
  import { onMount } from "svelte";
  import "../app.css";
  import Layout from "$lib/presentation/components/layout/Layout.svelte";
  import { initialize_app_data } from "$lib/adapters/services/appInitializer";

  onMount(async () => {
    await initialize_app_data();
  });
</script>

<Layout>
  <slot />
</Layout>
