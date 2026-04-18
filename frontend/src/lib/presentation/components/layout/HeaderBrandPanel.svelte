<script lang="ts">
  import { split_organization_name } from "$lib/presentation/logic/dashboardPageDisplayLogic";

  export let sidebar_open: boolean = false;
  export let has_custom_logo: boolean = false;
  export let organization_logo_url: string = "";
  export let organization_name: string = "";
  export let show_panel_borders: boolean = false;
  export let on_sidebar_toggle: () => void = () => {};
</script>

<div
  class="flex items-center space-x-4 bg-black/25 dark:bg-black/40 backdrop-blur-sm rounded-[0.175rem] pl-3 pr-12 py-2 header-panel {show_panel_borders
    ? 'border-2 border-white/60'
    : ''}"
>
  <button
    type="button"
    class="lg:hidden inline-flex items-center justify-center p-2 rounded-[0.175rem] text-black hover:text-gray-800 hover:bg-theme-primary-400 dark:hover:bg-theme-primary-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-black transition-colors duration-200"
    on:click={on_sidebar_toggle}
    aria-expanded={sidebar_open}
    aria-label="Toggle sidebar"
  >
    <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
    class="hidden lg:inline-flex items-center justify-center p-2 rounded-[0.175rem] text-black hover:text-gray-800 hover:bg-theme-primary-400 dark:hover:bg-theme-primary-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-black transition-colors duration-200"
    on:click={on_sidebar_toggle}
    aria-label="Toggle sidebar"
  >
    <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"
      ><path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M4 6h16M4 12h16M4 18h16"
      /></svg
    >
  </button>
  <div class="flex items-center space-x-3">
    <div class="flex-shrink-0">
      <div
        class="h-8 w-8 rounded-full flex items-center justify-center overflow-hidden {has_custom_logo
          ? ''
          : 'bg-theme-secondary-600'}"
      >
        {#if has_custom_logo}
          <img
            src={organization_logo_url}
            alt="Organization Logo"
            class="h-full w-full object-cover"
          />
        {:else}
          <svg
            class="h-5 w-5 text-white"
            fill="currentColor"
            viewBox="0 0 20 20"
            ><path
              fill-rule="evenodd"
              d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z"
              clip-rule="evenodd"
            /></svg
          >
        {/if}
      </div>
    </div>
    <div class="hidden md:block">
      <h1 class="text-xl font-bold text-black">
        {#if split_organization_name(organization_name).prefix}
          {split_organization_name(organization_name).prefix}
          <span class="text-theme-secondary-600"
            >{split_organization_name(organization_name).suffix}</span
          >
          {#if split_organization_name(organization_name).remainder}
            {split_organization_name(organization_name).remainder}
          {/if}
        {:else}
          <span class="text-theme-secondary-600"
            >{split_organization_name(organization_name).suffix}</span
          >
        {/if}
      </h1>
      <p class="text-xs text-gray-800 -mt-1">Management System</p>
    </div>
  </div>
</div>
