<script lang="ts">
  import { build_header_user_menu_details } from "$lib/presentation/components/layout/headerUserMenuDetails";
  import type { UserProfile } from "$lib/presentation/stores/auth";

  import HeaderProfileSwitcher from "./HeaderProfileSwitcher.svelte";

  export let current_profile_display_name: string = "";
  export let current_profile_email: string = "";
  export let current_user_role_display: string = "";
  export let current_profile_organization_name: string = "";
  export let current_profile_team_id: string = "";
  export let is_signed_in: boolean = false;
  export let other_available_profiles: UserProfile[] = [];
  export let profile_submenu_open: boolean = false;
  export let theme_mode: string = "light";
  export let on_toggle_profile_submenu: () => void = () => {};
  export let on_profile_switch: (profile: UserProfile) => void = () => {};
  export let on_theme_toggle: () => void = () => {};
  export let on_logout_click: () => void = () => {};

  $: header_user_menu_detail_rows = build_header_user_menu_details({
    current_profile_email,
    current_user_role_display,
    current_profile_organization_name,
    current_profile_team_id,
  });
</script>

<div
  class="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] sm:w-96 rounded-md shadow-lg bg-white dark:bg-accent-800 ring-1 ring-black ring-opacity-5 z-[100] dropdown-menu"
  role="menu"
  tabindex="-1"
  on:click|stopPropagation
  on:keydown|stopPropagation
>
  <div class="py-1">
    <div class="px-4 py-4 border-b border-gray-200 dark:border-accent-700">
      <p
        class="text-[11px] font-semibold text-gray-500 dark:text-accent-400 uppercase tracking-[0.24em]"
      >
        Signed in as
      </p>
      <div
        class="mt-3 rounded-md border border-gray-200 dark:border-accent-700 bg-gray-50 dark:bg-accent-900/40"
      >
        <div class="px-3 py-3">
          <p
            class="text-sm font-semibold leading-5 text-gray-900 dark:text-accent-100 break-words"
          >
            {current_profile_display_name}
          </p>
          {#if header_user_menu_detail_rows.length > 0}
            <div
              class="mt-3 border-t border-gray-200 dark:border-accent-700"
            ></div>
            <dl class="mt-3 space-y-2.5">
              {#each header_user_menu_detail_rows as header_user_menu_detail_row (header_user_menu_detail_row.label)}
                <div
                  class="grid grid-cols-[5rem_minmax(0,1fr)] items-start gap-x-3"
                >
                  <dt
                    class="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-accent-400"
                  >
                    {header_user_menu_detail_row.label}
                  </dt>
                  <dd
                    class="min-w-0 text-sm leading-5 text-gray-700 dark:text-accent-200 break-words"
                  >
                    {header_user_menu_detail_row.value}
                  </dd>
                </div>
              {/each}
            </dl>
          {/if}
        </div>
      </div>
    </div>

    {#if !is_signed_in && other_available_profiles.length > 0}
      <HeaderProfileSwitcher
        {other_available_profiles}
        {profile_submenu_open}
        {on_toggle_profile_submenu}
        {on_profile_switch}
      />
      <div class="border-t border-gray-200 dark:border-accent-700"></div>
    {/if}

    <button
      type="button"
      class="w-full flex items-center px-4 py-2.5 text-sm text-gray-700 dark:text-accent-300 hover:bg-gray-100 dark:hover:bg-accent-700 transition-colors duration-150"
      on:click={on_theme_toggle}
    >
      {#if theme_mode === "light"}
        <svg
          class="mr-3 h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          ><path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          /></svg
        >
        Dark Mode
      {:else}
        <svg
          class="mr-3 h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          ><path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          /></svg
        >
        Light Mode
      {/if}
    </button>

    <div class="border-t border-gray-200 dark:border-accent-700"></div>

    <button
      type="button"
      class="w-full flex items-center px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-accent-700 transition-colors duration-150"
      on:click={on_logout_click}
    >
      <svg
        class="mr-3 h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        ><path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
        /></svg
      >
      {is_signed_in ? "Sign Out" : "Sign In"}
    </button>
  </div>
</div>
