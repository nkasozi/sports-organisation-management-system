<script lang="ts">
  import { onMount } from "svelte";
  import "../app.css";
  import Layout from "$lib/components/layout/Layout.svelte";
  import { initialize_app_data } from "$lib/services/appInitializer";

  onMount(async () => {
    await initialize_app_data();
  });
</script>

<Layout>
  <slot />
</Layout>
