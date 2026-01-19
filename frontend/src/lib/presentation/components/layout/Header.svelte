<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { theme_store, toggle_theme_mode } from "$lib/presentation/stores/theme";
  import { branding_store } from "$lib/presentation/stores/branding";
  import ThemeToggle from "$lib/presentation/components/theme/ThemeToggle.svelte";

  export let sidebar_open = false;

  const dispatch = createEventDispatcher();

  $: has_custom_logo = $branding_store.organization_logo_url && $branding_store.organization_logo_url.length > 0;

  function handle_sidebar_toggle(): void {
    dispatch("toggle-sidebar");
  }

  function handle_theme_toggle(): void {
    toggle_theme_mode();
  }

  function split_organization_name(name: string): {
    prefix: string;
    suffix: string;
  } {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
      return { prefix: "", suffix: parts[0] };
    }
    const suffix = parts.pop() || "";
    return { prefix: parts.join(" "), suffix };
  }
</script>

<header
  class="bg-theme-primary-500 dark:bg-theme-primary-600 shadow-sm border-b border-theme-primary-600 dark:border-theme-primary-700 sticky top-0 z-50"
>
  <div class="px-4 sm:px-6 lg:px-8">
    <div class="flex justify-between items-center h-16">
      <div class="flex items-center space-x-4">
        <button
          type="button"
          class="lg:hidden inline-flex items-center justify-center p-2 rounded-md text-black hover:text-gray-800 hover:bg-theme-primary-400 dark:hover:bg-theme-primary-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-black transition-colors duration-200"
          on:click={handle_sidebar_toggle}
          aria-expanded={sidebar_open}
          aria-label="Toggle sidebar"
        >
          <svg
            class="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            {#if sidebar_open}
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            {:else}
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
            {/if}
          </svg>
        </button>

        <button
          type="button"
          class="hidden lg:inline-flex items-center justify-center p-2 rounded-md text-black hover:text-gray-800 hover:bg-theme-primary-400 dark:hover:bg-theme-primary-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-black transition-colors duration-200"
          on:click={handle_sidebar_toggle}
          aria-label="Toggle sidebar"
        >
          <svg
            class="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        <div class="flex items-center space-x-3">
          <div class="flex-shrink-0">
            <div
              class="h-8 w-8 rounded-lg flex items-center justify-center overflow-hidden {has_custom_logo ? '' : 'bg-theme-secondary-600'}"
            >
              {#if has_custom_logo}
                <img
                  src={$branding_store.organization_logo_url}
                  alt="Organization Logo"
                  class="h-full w-full object-cover"
                />
              {:else}
                <svg
                  class="h-5 w-5 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z"
                    clip-rule="evenodd"
                  />
                </svg>
              {/if}
            </div>
          </div>
          <div class="hidden sm:block">
            <h1 class="text-xl font-bold text-black">
              {#if split_organization_name($branding_store.organization_name).prefix}
                {split_organization_name($branding_store.organization_name)
                  .prefix}
                <span class="text-theme-secondary-600">
                  {split_organization_name($branding_store.organization_name)
                    .suffix}
                </span>
              {:else}
                <span class="text-theme-secondary-600">
                  {split_organization_name($branding_store.organization_name)
                    .suffix}
                </span>
              {/if}
            </h1>
            <p class="text-xs text-gray-800 -mt-1">Management System</p>
          </div>
        </div>
      </div>

      <div class="flex items-center space-x-4">
        <button
          type="button"
          class="p-2 rounded-md text-black hover:text-gray-800 hover:bg-theme-primary-400 dark:hover:bg-theme-primary-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-black transition-colors duration-200 relative"
          aria-label="View notifications"
        >
          <svg
            class="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 17h5l-5.5-8.5L9 17h6z M16 2v4a4 4 0 01-8 0V2"
            />
          </svg>
          <span
            class="absolute top-1 right-1 h-2 w-2 bg-theme-secondary-500 rounded-full"
          ></span>
        </button>

        <ThemeToggle />

        <div class="relative">
          <button
            type="button"
            class="flex items-center space-x-2 p-2 rounded-md text-black hover:bg-theme-primary-400 dark:hover:bg-theme-primary-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-black transition-colors duration-200"
            aria-label="User menu"
          >
            <div
              class="h-8 w-8 bg-theme-secondary-600 rounded-full flex items-center justify-center"
            >
              <span class="text-white font-medium text-sm">JD</span>
            </div>
            <span class="hidden sm:block text-sm font-medium">John Doe</span>
            <svg
              class="hidden sm:block h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</header>

<style>
  /* Mobile-first responsive header */
  @media (max-width: 640px) {
    header {
      position: relative;
    }
  }

  /* Smooth transitions for interactive elements */
  button {
    transition: all 0.2s ease-in-out;
  }

  /* Focus styles for accessibility */
  button:focus-visible {
    outline: 2px solid theme("colors.primary.500");
    outline-offset: 2px;
  }
</style>
