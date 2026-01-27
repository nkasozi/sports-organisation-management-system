<script lang="ts">
  import { branding_store } from "$lib/presentation/stores/branding";
  import ThemeToggle from "$lib/presentation/components/theme/ThemeToggle.svelte";

  $: has_custom_logo =
    $branding_store.organization_logo_url &&
    $branding_store.organization_logo_url.length > 0;

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
  class="shadow-sm border-b border-theme-primary-600 dark:border-theme-primary-700 sticky top-0 z-40 relative"
>
  {#if $branding_store.header_pattern === "pattern" && $branding_store.background_pattern_url}
    <div
      class="absolute inset-0"
      style="background-image: url('{$branding_store.background_pattern_url}'); background-size: 200px; background-repeat: repeat;"
    ></div>
    <div class="absolute inset-0 bg-gray-900/30 dark:bg-gray-900/45"></div>
  {:else}
    <div
      class="absolute inset-0 bg-theme-primary-500 dark:bg-theme-primary-600"
    ></div>
  {/if}

  <div class="px-4 sm:px-6 lg:px-8 relative z-10">
    <div class="flex justify-between items-center h-16">
      <div
        class="flex items-center space-x-4 bg-black/25 dark:bg-black/40 backdrop-blur-sm rounded-lg px-4 py-2 header-panel {$branding_store.show_panel_borders
          ? 'border-2 border-white/60'
          : ''}"
      >
        <a href="/" class="flex items-center space-x-3">
          <div class="flex-shrink-0">
            <div
              class="h-8 w-8 rounded-lg flex items-center justify-center overflow-hidden {has_custom_logo
                ? ''
                : 'bg-theme-secondary-600'}"
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
          <div>
            <h1 class="text-lg font-bold text-black">
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
          </div>
        </a>
      </div>

      <div
        class="flex items-center bg-black/25 dark:bg-black/40 backdrop-blur-sm rounded-lg px-3 py-2 header-panel {$branding_store.show_panel_borders
          ? 'border-2 border-white/60'
          : ''}"
      >
        <ThemeToggle />
      </div>
    </div>
  </div>
</header>

<style>
  :global(.header-panel) {
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
  }
  :global(.header-panel) span,
  :global(.header-panel) h1,
  :global(.header-panel) p {
    color: white !important;
  }
  :global(.header-panel) svg {
    color: white !important;
    stroke: white !important;
  }
</style>
