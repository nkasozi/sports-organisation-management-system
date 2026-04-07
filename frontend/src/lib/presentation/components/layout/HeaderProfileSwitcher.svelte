<script lang="ts">
  import type { UserProfile } from "$lib/presentation/stores/auth";

  export let other_available_profiles: UserProfile[] = [];
  export let profile_submenu_open: boolean = false;
  export let on_toggle_profile_submenu: () => void = () => {};
  export let on_profile_switch: (profile: UserProfile) => void = () => {};

  function get_profile_initials(display_name: string): string {
    return display_name
      .split(" ")
      .map((name_part: string) => name_part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
</script>

<div class="relative">
  <button
    type="button"
    class="w-full flex items-center justify-between px-4 py-2.5 text-sm text-gray-700 dark:text-accent-300 hover:bg-gray-100 dark:hover:bg-accent-700 transition-colors duration-150"
    on:click|stopPropagation={on_toggle_profile_submenu}
  >
    <span class="flex items-center">
      <svg
        class="mr-3 h-5 w-5 text-gray-500 dark:text-accent-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        ><path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
        /></svg
      >
      Switch Profile
    </span>
    <svg
      class="h-4 w-4 text-gray-400 dark:text-accent-500 transition-transform duration-200 {profile_submenu_open
        ? 'rotate-180'
        : ''}"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      ><path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M19 9l-7 7-7-7"
      /></svg
    >
  </button>

  {#if profile_submenu_open}
    <div
      class="border-t border-b border-gray-100 dark:border-accent-700 bg-gray-50 dark:bg-accent-900/50 max-h-60 overflow-y-auto"
    >
      {#each other_available_profiles as profile}
        <button
          type="button"
          class="w-full flex items-start px-5 py-2.5 text-left hover:bg-gray-100 dark:hover:bg-accent-700 transition-colors duration-150"
          on:click={() => on_profile_switch(profile)}
        >
          <div
            class="flex-shrink-0 h-8 w-8 rounded-full bg-theme-secondary-100 dark:bg-theme-secondary-800 flex items-center justify-center mt-0.5 mr-3"
          >
            <span
              class="text-xs font-semibold text-theme-secondary-700 dark:text-theme-secondary-300"
              >{get_profile_initials(profile.display_name)}</span
            >
          </div>
          <div class="min-w-0 flex-1">
            <p
              class="text-sm font-medium text-gray-900 dark:text-accent-200 truncate"
            >
              {profile.display_name}
            </p>
            <p class="text-xs text-gray-500 dark:text-accent-400 truncate">
              {profile.organization_name}
            </p>
          </div>
        </button>
      {/each}
    </div>
  {/if}
</div>
