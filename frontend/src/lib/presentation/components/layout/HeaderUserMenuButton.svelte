<script lang="ts">
  export let has_profile_picture: boolean = false;
  export let profile_picture_base64: string = "";
  export let current_profile_initials: string = "";
  export let current_profile_display_name: string = "";
  export let current_profile_organization_name: string = "";
  export let user_menu_open: boolean = false;
  export let on_toggle_user_menu: () => void = () => {};
</script>

<button
  type="button"
  class="flex items-center space-x-2 p-2 rounded-md text-black hover:bg-theme-primary-400 dark:hover:bg-theme-primary-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-black transition-colors duration-200"
  aria-label="User menu"
  aria-expanded={user_menu_open}
  on:click|stopPropagation={on_toggle_user_menu}
>
  <div
    class="flex items-center space-x-2 p-2 rounded-md text-black hover:bg-theme-primary-400 dark:hover:bg-theme-primary-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-black transition-colors duration-200"
  >
    {#if has_profile_picture}
      <img
        src={profile_picture_base64}
        alt="Profile"
        class="h-8 w-8 rounded-full object-cover flex-shrink-0"
      />
    {:else}
      <div
        class="h-8 w-8 rounded-full flex-shrink-0 flex items-center justify-center bg-theme-secondary-600"
      >
        <span class="text-white font-medium text-sm"
          >{current_profile_initials}</span
        >
      </div>
    {/if}
    <div class="hidden md:flex flex-col items-start leading-tight">
      <span class="text-sm font-semibold">{current_profile_display_name}</span>
      {#if current_profile_organization_name}
        <span class="text-xs text-black/70"
          >{current_profile_organization_name}</span
        >
      {/if}
    </div>
    <svg
      class="hidden md:block h-4 w-4 flex-shrink-0 transition-transform duration-200 {user_menu_open
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
  </div>
</button>
