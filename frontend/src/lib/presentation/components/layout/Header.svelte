<script lang="ts">
  import { createEventDispatcher, onMount } from "svelte";
  import { goto, invalidateAll } from "$app/navigation";
  import { is_signed_in, sign_out } from "$lib/adapters/iam/clerkAuthService";
  import {
    theme_store,
    toggle_theme_mode,
  } from "$lib/presentation/stores/theme";
  import { branding_store } from "$lib/presentation/stores/branding";
  import { current_user_store } from "$lib/presentation/stores/currentUser";
  import {
    auth_store,
    current_user_role_display,
    current_profile_display_name,
    current_profile_initials,
    other_available_profiles,
    is_auth_initialized,
    type UserProfile,
  } from "$lib/presentation/stores/auth";
  import SyncStatusIndicator from "$lib/presentation/components/SyncStatusIndicator.svelte";

  export let sidebar_open = false;

  const dispatch = createEventDispatcher();

  let user_menu_open = false;
  let profile_submenu_open = false;

  $: has_custom_logo =
    $branding_store.organization_logo_url &&
    $branding_store.organization_logo_url.length > 0;
  $: has_profile_picture =
    $current_user_store?.profile_picture_base64 &&
    $current_user_store.profile_picture_base64.length > 0;

  function handle_sidebar_toggle(): void {
    dispatch("toggle-sidebar");
  }

  function handle_theme_toggle(): void {
    toggle_theme_mode();
  }

  function toggle_user_menu(): void {
    user_menu_open = !user_menu_open;
  }

  function close_user_menu(): void {
    user_menu_open = false;
    profile_submenu_open = false;
  }

  function toggle_profile_submenu(): void {
    profile_submenu_open = !profile_submenu_open;
  }

  function handle_logout_click(): void {
    close_user_menu();

    if ($is_signed_in) {
      auth_store.logout();
      sign_out();
      goto("/sign-in");
      return;
    }

    goto("/sign-in");
  }

  async function handle_profile_switch(profile: UserProfile): Promise<void> {
    close_user_menu();
    const success = await auth_store.switch_profile(profile.id);
    if (success) {
      console.log(`[Header] Switched to profile: ${profile.display_name}`);
      await invalidateAll();
      await goto("/", { replaceState: true });
    }
  }

  onMount(() => {
    void auth_store.initialize();
  });

  function split_organization_name(name: string): {
    prefix: string;
    suffix: string;
    remainder: string;
  } {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
      return { prefix: "", suffix: parts[0], remainder: "" };
    }
    const prefix = parts[0];
    const suffix = parts[1];
    const remainder = parts.slice(2).join(" ");
    return { prefix, suffix, remainder };
  }
</script>

<svelte:window on:click={close_user_menu} />

<header
  class="shadow-sm border-b border-theme-primary-600 dark:border-theme-primary-700 sticky top-0 z-50 relative"
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
    <div class="flex justify-between items-center h-20">
      <div
        class="flex items-center space-x-4 bg-black/25 dark:bg-black/40 backdrop-blur-sm rounded-lg pl-3 pr-12 py-2 header-panel {$branding_store.show_panel_borders
          ? 'border-2 border-white/60'
          : ''}"
      >
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
          <div class="hidden md:block">
            <h1 class="text-xl font-bold text-black">
              {#if split_organization_name($branding_store.organization_name).prefix}
                {split_organization_name($branding_store.organization_name)
                  .prefix}
                <span class="text-theme-secondary-600">
                  {split_organization_name($branding_store.organization_name)
                    .suffix}
                </span>
                {#if split_organization_name($branding_store.organization_name).remainder}
                  {split_organization_name($branding_store.organization_name)
                    .remainder}
                {/if}
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

      <div
        class="flex items-center space-x-4 bg-black/25 dark:bg-black/40 backdrop-blur-sm rounded-lg px-3 py-2 header-panel {$branding_store.show_panel_borders
          ? 'border-2 border-white/60'
          : ''}"
      >
        <SyncStatusIndicator />

        <div class="relative">
          <button
            type="button"
            class="flex items-center space-x-2 p-2 rounded-md text-black hover:bg-theme-primary-400 dark:hover:bg-theme-primary-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-black transition-colors duration-200"
            aria-label="User menu"
            aria-expanded={user_menu_open}
            on:click|stopPropagation={toggle_user_menu}
          >
            <div
              class="h-8 w-8 rounded-full flex items-center justify-center overflow-hidden {has_profile_picture
                ? ''
                : 'bg-theme-secondary-600'}"
            >
              {#if has_profile_picture}
                <img
                  src={$current_user_store?.profile_picture_base64}
                  alt="Profile"
                  class="h-full w-full object-cover"
                />
              {:else}
                <span class="text-white font-medium text-sm"
                  >{$current_profile_initials}</span
                >
              {/if}
            </div>
            <span class="hidden md:block text-sm font-medium"
              >{$current_profile_display_name}</span
            >
            <svg
              class="hidden md:block h-4 w-4 transition-transform duration-200 {user_menu_open
                ? 'rotate-180'
                : ''}"
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

          {#if user_menu_open}
            <div
              class="absolute right-0 mt-2 w-72 rounded-md shadow-lg bg-white dark:bg-accent-800 ring-1 ring-black ring-opacity-5 z-[100] dropdown-menu"
              role="menu"
              tabindex="-1"
              on:click|stopPropagation
              on:keydown|stopPropagation
            >
              <div class="py-1">
                <div
                  class="px-4 py-3 border-b border-gray-200 dark:border-accent-700"
                >
                  <p
                    class="text-xs text-gray-500 dark:text-accent-400 uppercase tracking-wide"
                  >
                    Signed in as
                  </p>
                  <p
                    class="text-sm font-semibold text-gray-900 dark:text-accent-100 mt-0.5"
                  >
                    {$current_profile_display_name}
                  </p>
                  <p class="text-xs text-gray-500 dark:text-accent-400">
                    {$current_user_role_display}
                  </p>
                </div>

                {#if $other_available_profiles.length > 0}
                  <div class="relative">
                    <button
                      type="button"
                      class="w-full flex items-center justify-between px-4 py-2.5 text-sm text-gray-700 dark:text-accent-300 hover:bg-gray-100 dark:hover:bg-accent-700 transition-colors duration-150"
                      on:click|stopPropagation={toggle_profile_submenu}
                    >
                      <span class="flex items-center">
                        <svg
                          class="mr-3 h-5 w-5 text-gray-500 dark:text-accent-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        Switch Profile
                      </span>
                      <svg
                        class="h-4 w-4 text-gray-400 dark:text-accent-500 transition-transform duration-200 {profile_submenu_open
                          ? 'rotate-180'
                          : ''}"
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

                    {#if profile_submenu_open}
                      <div
                        class="border-t border-b border-gray-100 dark:border-accent-700 bg-gray-50 dark:bg-accent-900/50 max-h-60 overflow-y-auto"
                      >
                        {#each $other_available_profiles as profile}
                          <button
                            type="button"
                            class="w-full flex items-start px-5 py-2.5 text-left hover:bg-gray-100 dark:hover:bg-accent-700 transition-colors duration-150"
                            on:click={() => handle_profile_switch(profile)}
                          >
                            <div
                              class="flex-shrink-0 h-8 w-8 rounded-full bg-theme-secondary-100 dark:bg-theme-secondary-800 flex items-center justify-center mt-0.5 mr-3"
                            >
                              <span
                                class="text-xs font-semibold text-theme-secondary-700 dark:text-theme-secondary-300"
                              >
                                {profile.display_name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .toUpperCase()
                                  .slice(0, 2)}
                              </span>
                            </div>
                            <div class="min-w-0 flex-1">
                              <p
                                class="text-sm font-medium text-gray-900 dark:text-accent-200 truncate"
                              >
                                {profile.display_name}
                              </p>
                              <p
                                class="text-xs text-gray-500 dark:text-accent-400 truncate"
                              >
                                {profile.organization_name}
                              </p>
                            </div>
                          </button>
                        {/each}
                      </div>
                    {/if}
                  </div>

                  <div
                    class="border-t border-gray-200 dark:border-accent-700"
                  ></div>
                {/if}

                <button
                  type="button"
                  class="w-full flex items-center px-4 py-2.5 text-sm text-gray-700 dark:text-accent-300 hover:bg-gray-100 dark:hover:bg-accent-700 transition-colors duration-150"
                  on:click={handle_theme_toggle}
                >
                  {#if $theme_store.mode === "light"}
                    <svg
                      class="mr-3 h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                      />
                    </svg>
                    Dark Mode
                  {:else}
                    <svg
                      class="mr-3 h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                    Light Mode
                  {/if}
                </button>

                <div
                  class="border-t border-gray-200 dark:border-accent-700"
                ></div>

                <button
                  type="button"
                  class="w-full flex items-center px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-accent-700 transition-colors duration-150"
                  on:click={handle_logout_click}
                >
                  <svg
                    class="mr-3 h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  {$is_signed_in ? "Sign Out" : "Sign In"}
                </button>
              </div>
            </div>
          {/if}
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

  /* Text shadow for pattern mode panels */
  :global(.header-panel) {
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
  }
  :global(.header-panel) h1,
  :global(.header-panel) p {
    color: white !important;
  }
  :global(.header-panel) span:not(.text-theme-secondary-600) {
    color: white !important;
  }
  :global(.header-panel) .text-theme-secondary-600 {
    color: var(--color-secondary-600) !important;
  }
  :global(.header-panel) button {
    color: white !important;
  }
  :global(.header-panel) svg {
    color: white !important;
    stroke: white !important;
  }

  /* Override header-panel styles for dropdown menu */
  :global(.header-panel) .dropdown-menu,
  :global(.header-panel) .dropdown-menu p,
  :global(.header-panel) .dropdown-menu span {
    text-shadow: none !important;
    color: inherit !important;
  }
  :global(.header-panel) .dropdown-menu button {
    color: inherit !important;
    text-shadow: none !important;
  }
  :global(.header-panel) .dropdown-menu svg {
    color: inherit !important;
    stroke: currentColor !important;
  }
</style>
