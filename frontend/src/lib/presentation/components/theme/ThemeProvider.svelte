<script lang="ts">
  import { onMount } from "svelte";
  import { theme_store } from "$lib/presentation/stores/theme";

  let mounted = false;

  onMount(() => {
    mounted = true;

    // Apply initial theme
    theme_store.subscribe((theme_config) => {
      if (typeof document !== "undefined") {
        const html_element = document.documentElement;

        // Apply dark/light mode class
        if (theme_config.mode === "dark") {
          html_element.classList.add("dark");
        } else {
          html_element.classList.remove("dark");
        }
      }
    });
  });
</script>

{#if mounted}
  <slot />
{:else}
  <!-- Loading state to prevent flash of unstyled content -->
  <div
    class="min-h-screen bg-gray-50 dark:bg-accent-900 flex items-center justify-center"
  >
    <div
      class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"
    ></div>
  </div>
{/if}
