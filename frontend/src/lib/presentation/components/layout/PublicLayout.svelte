<script lang="ts">
  import { onMount } from "svelte";
  import {
    theme_store,
    get_theme_classes,
  } from "$lib/presentation/stores/theme";
  import PublicHeader from "$lib/presentation/components/layout/PublicHeader.svelte";
  import Footer from "$lib/presentation/components/layout/Footer.svelte";
  import ThemeProvider from "$lib/presentation/components/theme/ThemeProvider.svelte";

  let theme_config: any = {
    mode: "light",
    primaryColor: "yellow",
    secondaryColor: "red",
    accentColor: "black",
  };
  let theme_classes: any = {};

  $: theme_classes = get_theme_classes(theme_config);

  onMount(() => {
    const unsubscribe = theme_store.subscribe((config) => {
      theme_config = config;
    });

    return () => {
      unsubscribe();
    };
  });
</script>

<ThemeProvider>
  <div
    class="min-h-screen flex flex-col {theme_classes.textPrimary} bg-gray-50 dark:bg-accent-900 transition-colors duration-300"
  >
    <PublicHeader />

    <main class="flex-1">
      <div class="w-full max-w-7xl mx-auto p-4 lg:p-6">
        <slot />
      </div>
    </main>

    <Footer />
  </div>
</ThemeProvider>

<style>
  :global(body) {
    font-family: "Inter", system-ui, sans-serif;
    overflow-x: hidden;
  }

  :global(*) {
    transition-property: background-color, border-color, color, fill, stroke;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    transition-duration: 200ms;
  }
</style>
