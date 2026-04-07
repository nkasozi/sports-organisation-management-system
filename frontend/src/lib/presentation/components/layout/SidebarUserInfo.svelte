<script lang="ts">
  export let sidebar_open: boolean = false;
  export let has_profile_picture: boolean = false;
  export let profile_picture_base64: string | null | undefined = undefined;
  export let profile_initials: string = "";
  export let profile_display_name: string = "";
  export let user_role_display: string = "";
</script>

<div
  class="border-t border-accent-200 dark:border-accent-700 {sidebar_open
    ? 'pl-10 py-4'
    : 'p-2'}"
>
  {#if sidebar_open}
    <div class="flex items-center space-x-3">
      <div
        class="h-8 w-8 rounded-full flex items-center justify-center overflow-hidden"
        style="background-color: {has_profile_picture
          ? 'transparent'
          : 'var(--color-secondary-600)'};"
      >
        {#if has_profile_picture}
          <img
            src={profile_picture_base64}
            alt="Profile"
            class="h-full w-full object-cover"
          />
        {:else}
          <span class="text-white font-medium text-sm">{profile_initials}</span>
        {/if}
      </div>
      <div class="flex-1 min-w-0">
        <p
          class="text-sm font-medium text-accent-900 dark:text-accent-100 truncate"
        >
          {profile_display_name}
        </p>
        <p class="text-xs text-accent-500 dark:text-accent-400 truncate">
          {user_role_display}
        </p>
      </div>
    </div>
  {:else}
    <div
      class="h-8 w-8 rounded-full flex items-center justify-center mx-auto overflow-hidden"
      style="background-color: {has_profile_picture
        ? 'transparent'
        : 'var(--color-secondary-600)'};"
    >
      {#if has_profile_picture}
        <img
          src={profile_picture_base64}
          alt="Profile"
          class="h-full w-full object-cover"
        />
      {:else}
        <span class="text-white font-medium text-sm">{profile_initials}</span>
      {/if}
    </div>
  {/if}
</div>
