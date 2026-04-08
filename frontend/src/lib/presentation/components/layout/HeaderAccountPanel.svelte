<script lang="ts">
  import SyncStatusIndicator from "$lib/presentation/components/SyncStatusIndicator.svelte";
  import type { UserProfile } from "$lib/presentation/stores/auth";

  import HeaderUserMenuButton from "./HeaderUserMenuButton.svelte";
  import HeaderUserMenuDropdown from "./HeaderUserMenuDropdown.svelte";

  export let has_profile_picture: boolean = false;
  export let profile_picture_base64: string = "";
  export let current_profile_initials: string = "";
  export let current_profile_display_name: string = "";
  export let current_profile_organization_name: string = "";
  export let current_profile_email: string = "";
  export let current_profile_team_id: string = "";
  export let current_profile_team_name: string = "";
  export let current_user_role_display: string = "";
  export let is_signed_in: boolean = false;
  export let other_available_profiles: UserProfile[] = [];
  export let theme_mode: string = "light";
  export let user_menu_open: boolean = false;
  export let profile_submenu_open: boolean = false;
  export let show_panel_borders: boolean = false;
  export let on_toggle_user_menu: () => void = () => {};
  export let on_toggle_profile_submenu: () => void = () => {};
  export let on_profile_switch: (profile: UserProfile) => void = () => {};
  export let on_theme_toggle: () => void = () => {};
  export let on_logout_click: () => void = () => {};
</script>

<div
  class="flex items-center space-x-4 bg-black/25 dark:bg-black/40 backdrop-blur-sm rounded-lg px-3 py-2 header-panel {show_panel_borders
    ? 'border-2 border-white/60'
    : ''}"
>
  <SyncStatusIndicator />
  <div class="relative">
    <HeaderUserMenuButton
      {has_profile_picture}
      {user_menu_open}
      {profile_picture_base64}
      {current_profile_initials}
      {current_profile_display_name}
      {current_profile_organization_name}
      {on_toggle_user_menu}
    />
    {#if user_menu_open}
      <HeaderUserMenuDropdown
        {current_profile_display_name}
        {current_profile_email}
        {current_profile_team_id}
        {current_profile_team_name}
        {current_user_role_display}
        {current_profile_organization_name}
        {is_signed_in}
        {other_available_profiles}
        {profile_submenu_open}
        {theme_mode}
        {on_toggle_profile_submenu}
        {on_profile_switch}
        {on_theme_toggle}
        {on_logout_click}
      />
    {/if}
  </div>
</div>
