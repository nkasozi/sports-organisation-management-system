<script lang="ts">
  import { createEventDispatcher } from "svelte";

  import { goto, invalidateAll } from "$app/navigation";
  import { is_signed_in, sign_out } from "$lib/adapters/iam/clerkAuthService";
  import LogoutWarningModal from "$lib/presentation/components/ui/LogoutWarningModal.svelte";
  import { invalidate_route_access_cache } from "$lib/presentation/logic/authGuard";
  import {
    auth_store,
    current_profile_display_name,
    current_profile_email,
    current_profile_initials,
    current_profile_organization_name,
    current_profile_team_id,
    current_user_role_display,
    other_available_profiles,
    type UserProfile,
  } from "$lib/presentation/stores/auth";
  import { branding_store } from "$lib/presentation/stores/branding";
  import { current_user_store } from "$lib/presentation/stores/currentUser";
  import { clear_session_sync_flag } from "$lib/presentation/stores/initialSyncStore";
  import {
    theme_store,
    toggle_theme_mode,
  } from "$lib/presentation/stores/theme";

  import HeaderAccountPanel from "./HeaderAccountPanel.svelte";
  import HeaderBrandPanel from "./HeaderBrandPanel.svelte";

  export let sidebar_open = false;

  const dispatch = createEventDispatcher();

  let user_menu_open = false;
  let profile_submenu_open = false;
  let show_logout_warning = false;

  $: has_custom_logo =
    !!$branding_store.organization_logo_url &&
    $branding_store.organization_logo_url.length > 0;
  $: has_profile_picture =
    !!$current_user_store?.profile_picture_base64 &&
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
      show_logout_warning = true;
      return;
    }
    goto("/sign-in");
  }

  function handle_logout_confirmed(): void {
    show_logout_warning = false;
    clear_session_sync_flag();
    auth_store.logout();
    sign_out();
    goto("/sign-in");
  }

  function handle_logout_cancelled(): void {
    show_logout_warning = false;
  }

  async function handle_profile_switch(profile: UserProfile): Promise<void> {
    close_user_menu();
    const success = await auth_store.switch_profile(profile.id);
    if (!success) return;
    console.log(`[Header] Switched to profile: ${profile.display_name}`, {
      event: "profile_switch_completed",
      display_name: profile.display_name,
      role: profile.role,
    });
    invalidate_route_access_cache();
    await invalidateAll();
    await goto("/", { replaceState: true });
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
      <HeaderBrandPanel
        {sidebar_open}
        {has_custom_logo}
        organization_logo_url={$branding_store.organization_logo_url}
        organization_name={$branding_store.organization_name}
        show_panel_borders={$branding_store.show_panel_borders}
        on_sidebar_toggle={handle_sidebar_toggle}
      />
      <HeaderAccountPanel
        {has_profile_picture}
        profile_picture_base64={$current_user_store?.profile_picture_base64 ||
          ""}
        current_profile_initials={$current_profile_initials}
        current_profile_display_name={$current_profile_display_name}
        current_profile_organization_name={$current_profile_organization_name}
        current_profile_email={$current_profile_email}
        current_profile_team_id={$current_profile_team_id}
        current_user_role_display={$current_user_role_display}
        is_signed_in={$is_signed_in}
        other_available_profiles={$other_available_profiles}
        theme_mode={$theme_store.mode}
        {user_menu_open}
        {profile_submenu_open}
        show_panel_borders={$branding_store.show_panel_borders}
        on_toggle_user_menu={toggle_user_menu}
        on_toggle_profile_submenu={toggle_profile_submenu}
        on_profile_switch={handle_profile_switch}
        on_theme_toggle={handle_theme_toggle}
        on_logout_click={handle_logout_click}
      />
    </div>
  </div>
</header>

<LogoutWarningModal
  is_visible={show_logout_warning}
  on:confirm_logout={handle_logout_confirmed}
  on:cancel={handle_logout_cancelled}
/>

<style>
  @media (max-width: 640px) {
    header {
      position: relative;
    }
  }

  :global(header button) {
    transition: all 0.2s ease-in-out;
  }

  :global(header button:focus-visible) {
    outline: 2px solid theme("colors.primary.500");
    outline-offset: 2px;
  }

  :global(.header-panel) {
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
  }
  :global(.header-panel h1),
  :global(.header-panel p),
  :global(.header-panel span:not(.text-theme-secondary-600)),
  :global(.header-panel button) {
    color: white !important;
  }
  :global(.header-panel .text-theme-secondary-600) {
    color: var(--color-secondary-600) !important;
  }
  :global(.header-panel svg) {
    color: white !important;
    stroke: white !important;
  }

  :global(.header-panel .dropdown-menu),
  :global(.header-panel .dropdown-menu p),
  :global(.header-panel .dropdown-menu span) {
    text-shadow: none !important;
    color: inherit !important;
  }
  :global(.header-panel .dropdown-menu button) {
    color: inherit !important;
    text-shadow: none !important;
  }
  :global(.header-panel .dropdown-menu svg) {
    color: inherit !important;
    stroke: currentColor !important;
  }
</style>
