<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { page } from "$app/stores";
  import { branding_store } from "$lib/presentation/stores/branding";
  import { current_user_store } from "$lib/presentation/stores/currentUser";
  import {
    sidebar_menu_items,
    current_user_role_display,
    current_profile_display_name,
    current_profile_initials,
    current_user_role,
  } from "$lib/presentation/stores/auth";

  export let sidebar_open = false;

  const dispatch = createEventDispatcher();

  $: has_custom_logo =
    $branding_store.organization_logo_url &&
    $branding_store.organization_logo_url.length > 0;
  $: has_profile_picture =
    $current_user_store?.profile_picture_base64 &&
    $current_user_store.profile_picture_base64.length > 0;

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

  interface NavigationItem {
    name: string;
    href: string;
    icon: string;
  }

  interface NavigationGroup {
    group_name: string;
    items: NavigationItem[];
  }

  $: calendar_menu_item_name = `${$branding_store.organization_name} ${new Date().getFullYear()} Activities Calendar`;

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

  $: user_role = $current_user_role || "player";
  $: is_admin_role = user_role === "super_admin" || user_role === "org_admin";

  const all_settings_items = [
    {
      name: "Settings",
      href: "/settings",
      icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
      requires_admin: true,
    },
  ];

  $: settings_items = all_settings_items.filter(
    (item) => !item.requires_admin || is_admin_role,
  );

  function close_sidebar(): void {
    dispatch("close-sidebar");
  }

  function handle_nav_click(): void {
    // Close sidebar on mobile after navigation
    if (window.innerWidth < 1024) {
      close_sidebar();
    }
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
    <!-- Sidebar header -->
    <div
      class="flex items-center justify-between h-16 border-b border-accent-200 dark:border-accent-700 {sidebar_open
        ? 'pl-6 pr-4'
        : 'px-2'}"
    >
      {#if sidebar_open}
        <div class="flex items-center space-x-3">
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
          <span class="text-lg font-bold text-accent-900 dark:text-accent-100">
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
          </span>
        </div>
        <button
          type="button"
          class="lg:hidden p-1 rounded-md text-accent-400 hover:text-accent-500 hover:bg-accent-100 dark:hover:bg-accent-700"
          on:click={close_sidebar}
          aria-label="Close sidebar"
        >
          <svg
            class="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      {:else}
        <div
          class="h-8 w-8 bg-theme-secondary-600 rounded-lg flex items-center justify-center mx-auto"
        >
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
        </div>
      {/if}
    </div>

    <!-- Navigation -->
    <nav
      class="flex-1 py-4 space-y-1 overflow-y-auto {sidebar_open
        ? 'pl-4 pr-2'
        : 'px-2'}"
    >
      <!-- Grouped navigation -->
      {#each navigation_groups as group, group_index}
        {#if group_index > 0}
          <div class="pt-3"></div>
        {/if}

        {#if sidebar_open && group.group_name !== "Home"}
          <div class="px-2 pt-2 pb-1">
            <span
              class="text-xs font-semibold uppercase tracking-wider text-accent-400 dark:text-accent-500"
            >
              {group.group_name}
            </span>
          </div>
        {/if}

        <div class="space-y-0.5">
          {#each group.items as item}
            {@const is_active = is_item_active(item.href, current_path)}
            <a
              href={item.href}
              class="group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-all duration-200 {is_active
                ? 'border-r-2'
                : 'text-accent-600 dark:text-accent-300 hover:bg-accent-100 dark:hover:bg-accent-700 hover:text-accent-900 dark:hover:text-accent-100'}"
              style={is_active
                ? "background-color: var(--color-primary-100); color: var(--color-primary-700); border-color: var(--color-primary-500);"
                : ""}
              on:click={handle_nav_click}
              title={sidebar_open ? "" : item.name}
            >
              <svg
                class="flex-shrink-0 h-5 w-5 {sidebar_open
                  ? 'mr-3'
                  : 'mx-auto'} {is_active
                  ? ''
                  : 'text-accent-400 group-hover:text-accent-500'} transition-colors duration-200"
                style={is_active ? "color: var(--color-primary-500);" : ""}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d={item.icon}
                />
              </svg>
              {#if sidebar_open}
                <span class="whitespace-normal break-words">{item.name}</span>
              {/if}
            </a>
          {/each}
        </div>
      {/each}

      <!-- Divider -->
      <div class="border-t border-accent-200 dark:border-accent-700 my-4"></div>

      <!-- Settings navigation -->
      <div class="space-y-1">
        {#each settings_items as item}
          {@const is_active = is_item_active(item.href, current_path)}
          <a
            href={item.href}
            class="group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-all duration-200 {is_active
              ? 'border-r-2'
              : 'text-accent-600 dark:text-accent-300 hover:bg-accent-100 dark:hover:bg-accent-700 hover:text-accent-900 dark:hover:text-accent-100'}"
            style={is_active
              ? "background-color: var(--color-primary-100); color: var(--color-primary-700); border-color: var(--color-primary-500);"
              : ""}
            on:click={handle_nav_click}
            title={sidebar_open ? "" : item.name}
          >
            <svg
              class="flex-shrink-0 h-5 w-5 {sidebar_open
                ? 'mr-3'
                : 'mx-auto'} {is_active
                ? ''
                : 'text-accent-400 group-hover:text-accent-500'} transition-colors duration-200"
              style={is_active ? "color: var(--color-primary-500);" : ""}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d={item.icon}
              />
            </svg>
            {#if sidebar_open}
              <span class="whitespace-normal break-words">{item.name}</span>
            {/if}
          </a>
        {/each}
      </div>
    </nav>

    <!-- User info at bottom -->
    <div
      class="border-t border-accent-200 dark:border-accent-700 {sidebar_open
        ? 'pl-10 py-4'
        : 'p-2'}"
    >
      {#if sidebar_open}
        <div class="flex items-center space-x-3">
          <div
            class="h-8 w-8 rounded-full flex items-center justify-center overflow-hidden {has_profile_picture
              ? ''
              : ''}"
            style="background-color: {has_profile_picture
              ? 'transparent'
              : 'var(--color-secondary-600)'};"
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
          <div class="flex-1 min-w-0">
            <p
              class="text-sm font-medium text-accent-900 dark:text-accent-100 truncate"
            >
              {$current_profile_display_name}
            </p>
            <p class="text-xs text-accent-500 dark:text-accent-400 truncate">
              {$current_user_role_display}
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
      {/if}
    </div>
  </div>
</aside>

<style>
  /* Smooth transitions for sidebar */
  aside {
    will-change: width, transform;
  }

  /* Mobile responsive sidebar */
  @media (max-width: 1024px) {
    aside {
      transform: translateX(-100%);
    }

    aside.w-64 {
      transform: translateX(0);
    }
  }

  /* Focus styles for accessibility */
  a:focus-visible {
    outline: 2px solid theme("colors.primary.500");
    outline-offset: 2px;
  }

  /* Scroll optimization */
  nav {
    scrollbar-width: thin;
    scrollbar-color: theme("colors.accent.400") transparent;
  }

  nav::-webkit-scrollbar {
    width: 4px;
  }

  nav::-webkit-scrollbar-track {
    background: transparent;
  }

  nav::-webkit-scrollbar-thumb {
    background-color: theme("colors.accent.400");
    border-radius: 2px;
  }
</style>
