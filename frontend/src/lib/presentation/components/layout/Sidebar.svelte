<script lang="ts">
  import { createEventDispatcher } from "svelte";

  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import {
    current_profile_display_name,
    current_profile_initials,
    current_user_role_display,
    sidebar_menu_items,
  } from "$lib/presentation/stores/auth";
  import { branding_store } from "$lib/presentation/stores/branding";
  import { current_user_store } from "$lib/presentation/stores/currentUser";

  import SidebarHeader from "./SidebarHeader.svelte";
  import SidebarNavigation from "./SidebarNavigation.svelte";
  import SidebarUserInfo from "./SidebarUserInfo.svelte";

  export let sidebar_open = false;

  const dispatch = createEventDispatcher();

  $: has_custom_logo =
    !!$branding_store.organization_logo_url &&
    $branding_store.organization_logo_url.length > 0;
  $: has_profile_picture =
    $current_user_store.status === "present" &&
    !!$current_user_store.user.profile_picture_base64 &&
    $current_user_store.user.profile_picture_base64.length > 0;

  interface NavigationItem {
    name: string;
    href: string;
    icon: string;
  }

  interface NavigationGroup {
    group_name: string;
    items: NavigationItem[];
  }

  $: calendar_menu_item_name = `${new Date().getFullYear()} Activities Calendar`;

  function transform_menu_items_with_calendar_name(
    groups: NavigationGroup[],
  ): NavigationGroup[] {
    return groups.map((group) => ({
      ...group,
      items: group.items.map((item) => {
        if (item.href === "/calendar") {
          return { ...item, name: calendar_menu_item_name };
        }
        return item;
      }),
    }));
  }

  $: navigation_groups = transform_menu_items_with_calendar_name(
    $sidebar_menu_items as NavigationGroup[],
  );

  $: navigation_items = navigation_groups.flatMap((group) => group.items);

  function close_sidebar(): void {
    dispatch("close-sidebar");
  }

  function handle_nav_click(href: string): void {
    if (window.innerWidth < 1024) {
      close_sidebar();
    }
    goto(href);
  }

  // Reactive statement to check current page
  $: current_path = $page?.url?.pathname || "/";

  function is_item_active(item_href: string, path: string): boolean {
    if (item_href === "/") {
      return path === "/";
    }
    return path === item_href || path.startsWith(item_href + "/");
  }
</script>

<!-- Sidebar -->
<aside
  class="fixed inset-y-0 left-0 z-50 {sidebar_open
    ? 'w-64'
    : 'w-16'} bg-white dark:bg-accent-800 shadow-lg border-r border-accent-200 dark:border-accent-700 transition-all duration-300 ease-in-out lg:relative lg:z-0"
  class:transform={!sidebar_open}
  class:lg:transform-none={true}
  class:-translate-x-full={!sidebar_open}
  class:lg:translate-x-0={true}
>
  <div class="flex flex-col h-full">
    <SidebarHeader
      {sidebar_open}
      {has_custom_logo}
      organization_logo_url={$branding_store.organization_logo_url}
      organization_name={$branding_store.organization_name}
      on_close_sidebar={close_sidebar}
    />

    <SidebarNavigation
      {sidebar_open}
      {navigation_groups}
      {current_path}
      on_nav_click={handle_nav_click}
      {is_item_active}
    />

    <SidebarUserInfo
      {sidebar_open}
      {has_profile_picture}
      profile_picture_base64={$current_user_store.status === "present"
        ? $current_user_store.user.profile_picture_base64
        : ""}
      profile_initials={$current_profile_initials}
      profile_display_name={$current_profile_display_name}
      user_role_display={$current_user_role_display}
    />
  </div>
</aside>

<style>
  aside {
    will-change: width, transform;
  }

  @media (max-width: 1024px) {
    aside {
      transform: translateX(-100%);
    }

    aside.w-64 {
      transform: translateX(0);
    }
  }
</style>
