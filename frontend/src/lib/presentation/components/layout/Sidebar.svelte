<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { page } from "$app/stores";
  import { branding_store } from "$lib/presentation/stores/branding";
  import {
    current_user_store,
    current_user_display_name,
    current_user_initials,
    current_user_role_display,
  } from "$lib/presentation/stores/currentUser";

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

  const navigation_groups: NavigationGroup[] = [
    {
      group_name: "Home",
      items: [
        {
          name: "Dashboard",
          href: "/",
          icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
        },
      ],
    },
    {
      group_name: "Organization",
      items: [
        {
          name: "Organizations",
          href: "/organizations",
          icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
        },
        {
          name: "Sports",
          href: "/sports",
          icon: "M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
        },
        {
          name: "Venues",
          href: "/venues",
          icon: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z",
        },
      ],
    },
    {
      group_name: "Competitions",
      items: [
        {
          name: "Competitions",
          href: "/competitions",
          icon: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z",
        },
        {
          name: "Competition Formats",
          href: "/competition-formats",
          icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10",
        },
        {
          name: "Competition Results",
          href: "/competition-results",
          icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
        },
      ],
    },
    {
      group_name: "Teams",
      items: [
        {
          name: "Teams",
          href: "/teams",
          icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
        },
        {
          name: "Team Profiles",
          href: "/team-profiles",
          icon: "M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z",
        },
        {
          name: "Team Staff",
          href: "/team-staff",
          icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
        },
        {
          name: "Staff Roles",
          href: "/staff-roles",
          icon: "M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z",
        },
      ],
    },
    {
      group_name: "Players",
      items: [
        {
          name: "Players",
          href: "/players",
          icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
        },
        {
          name: "Player Profiles",
          href: "/player-profiles",
          icon: "M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z",
        },
        {
          name: "Team Memberships",
          href: "/player-team-memberships",
          icon: "M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z",
        },
        {
          name: "Player Positions",
          href: "/player-positions",
          icon: "M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7",
        },
      ],
    },
    {
      group_name: "Officials",
      items: [
        {
          name: "Officials",
          href: "/officials",
          icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
        },
        {
          name: "Official Roles",
          href: "/official-roles",
          icon: "M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z",
        },
      ],
    },
    {
      group_name: "Fixtures & Games",
      items: [
        {
          name: "Fixtures",
          href: "/fixtures",
          icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
        },
        {
          name: "Team Lineups",
          href: "/fixture-lineups",
          icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01",
        },
        {
          name: "Fixture Details Setup",
          href: "/fixture-details-setup",
          icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
        },
        {
          name: "Live Games",
          href: "/live-games",
          icon: "M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
        },
        {
          name: "Game Event Types",
          href: "/event-types",
          icon: "M13 10V3L4 14h7v7l9-11h-7z",
        },
      ],
    },
    {
      group_name: "Administration",
      items: [
        {
          name: "System Users",
          href: "/system-users",
          icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
        },
        {
          name: "ID Types",
          href: "/identification-types",
          icon: "M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2",
        },
        {
          name: "Audit Trail",
          href: "/audit-logs",
          icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
        },
      ],
    },
  ];

  const navigation_items = navigation_groups.flatMap((group) => group.items);

  // Settings items
  const settings_items = [
    {
      name: "Settings",
      href: "/settings",
      icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
    },
    {
      name: "Help",
      href: "/help",
      icon: "M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    },
  ];

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
  <div class="flex flex-col h-full" style="margin-left: 1rem;">
    <!-- Sidebar header -->
    <div
      class="flex items-center justify-between h-16 px-4 border-b border-accent-200 dark:border-accent-700"
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
    <nav class="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
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
                <span class="truncate">{item.name}</span>
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
              <span class="truncate">{item.name}</span>
            {/if}
          </a>
        {/each}
      </div>
    </nav>

    <!-- User info at bottom -->
    <div class="border-t border-accent-200 dark:border-accent-700 p-4">
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
                >{$current_user_initials}</span
              >
            {/if}
          </div>
          <div class="flex-1 min-w-0">
            <p
              class="text-sm font-medium text-accent-900 dark:text-accent-100 truncate"
            >
              {$current_user_display_name}
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
              >{$current_user_initials}</span
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
