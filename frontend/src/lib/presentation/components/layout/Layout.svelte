<script lang="ts">
  import { onMount } from "svelte";
  import {
    theme_store,
    get_theme_classes,
  } from "$lib/presentation/stores/theme";
  import Header from "$lib/presentation/components/layout/Header.svelte";
  import Sidebar from "$lib/presentation/components/layout/Sidebar.svelte";
  import Footer from "$lib/presentation/components/layout/Footer.svelte";
  import ThemeProvider from "$lib/presentation/components/theme/ThemeProvider.svelte";
  import MergeConflictScreen from "$lib/presentation/components/MergeConflictScreen.svelte";
  import { sync_store } from "$lib/presentation/stores/syncStore";
  import type {
    ConflictRecord,
    ConflictResolutionAction,
  } from "$lib/infrastructure/sync/conflictTypes";

  let sidebar_open = false;
  let is_mobile = true;
  let theme_config: any = {
    mode: "light",
    primaryColor: "yellow",
    secondaryColor: "red",
    accentColor: "black",
  };
  let theme_classes: any = {};

  $: theme_classes = get_theme_classes(theme_config);

  function handle_resize(): void {
    is_mobile = window.innerWidth < 1024;
    if (!is_mobile) {
      sidebar_open = true;
    } else {
      sidebar_open = false;
    }
  }

  onMount(() => {
    const unsubscribe = theme_store.subscribe((config) => {
      theme_config = config;
    });

    handle_resize();
    window.addEventListener("resize", handle_resize);

    return () => {
      unsubscribe();
      window.removeEventListener("resize", handle_resize);
    };
  });

  function toggle_sidebar(): void {
    sidebar_open = !sidebar_open;
  }

  function close_sidebar(): void {
    sidebar_open = false;
  }

  async function handle_conflict_resolve(
    event: CustomEvent<{
      conflict: ConflictRecord;
      action: ConflictResolutionAction;
      merged_data?: Record<string, unknown>;
    }>,
  ): Promise<void> {
    const { conflict, action, merged_data } = event.detail;
    await sync_store.resolve_conflict_and_sync(conflict, action, merged_data);
  }

  function handle_conflict_dismiss(): void {
    console.log("[Layout] Conflict resolution dismissed");
  }
</script>

<ThemeProvider>
  <div
    class="min-h-screen flex flex-col {theme_classes.textPrimary} bg-gray-50 dark:bg-accent-900 transition-colors duration-300"
  >
    <!-- Header -->
    <Header {sidebar_open} on:toggle-sidebar={toggle_sidebar} />

    <!-- Main content area -->
    <div class="flex flex-1 min-w-0">
      <!-- Sidebar -->
      <Sidebar {sidebar_open} on:close-sidebar={close_sidebar} />

      <!-- Main content -->
      <main
        class="flex-1 min-w-0 transition-all duration-300 ease-in-out lg:ml-4 overflow-x-auto"
      >
        <div class="w-full max-w-7xl mx-auto p-4 lg:p-6">
          <!-- Page content slot -->
          <slot />
        </div>
      </main>
    </div>

    <!-- Footer -->
    <Footer />

    <!-- Mobile sidebar overlay -->
    {#if sidebar_open}
      <div
        class="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
        on:click={close_sidebar}
        on:keydown={(e) => e.key === "Escape" && close_sidebar()}
        role="button"
        tabindex="0"
        aria-label="Close sidebar"
      ></div>
    {/if}

    <!-- Merge Conflict Screen (modal overlay) -->
    <MergeConflictScreen
      on:resolve={handle_conflict_resolve}
      on:dismiss={handle_conflict_dismiss}
    />
  </div>
</ThemeProvider>

<style>
  /* Global responsive design - mobile first approach */
  :global(body) {
    font-family: "Inter", system-ui, sans-serif;
  }

  /* Ensure smooth transitions for theme changes */
  :global(*) {
    transition-property: background-color, border-color, color, fill, stroke;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    transition-duration: 200ms;
  }

  /* Mobile optimizations */
  @media (max-width: 768px) {
    :global(.mobile-optimized) {
      font-size: 0.875rem;
      line-height: 1.25rem;
    }
  }

  /* Responsive text sizing */
  :global(.text-responsive) {
    font-size: clamp(0.875rem, 2.5vw, 1rem);
  }
</style>
