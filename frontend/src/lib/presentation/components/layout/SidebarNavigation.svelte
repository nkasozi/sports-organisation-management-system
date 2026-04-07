<script lang="ts">
  interface NavigationItem {
    name: string;
    href: string;
    icon: string;
  }

  interface NavigationGroup {
    group_name: string;
    items: NavigationItem[];
  }

  export let sidebar_open: boolean = false;
  export let navigation_groups: NavigationGroup[] = [];
  export let current_path: string = "/";
  export let on_nav_click: (href: string) => void;
  export let is_item_active: (item_href: string, path: string) => boolean;
</script>

<nav
  class="sidebar-navigation flex-1 py-4 space-y-1 overflow-y-auto {sidebar_open
    ? 'pl-4 pr-2'
    : 'px-2'}"
>
  {#each navigation_groups as group, group_index}
    {#if group_index > 0}<div class="pt-3"></div>{/if}
    {#if sidebar_open && group.group_name !== "Home"}
      <div class="px-2 pt-2 pb-1">
        <span
          class="text-xs font-semibold uppercase tracking-wider text-accent-400 dark:text-accent-500"
          >{group.group_name}</span
        >
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
          on:click|preventDefault={() => on_nav_click(item.href)}
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
          {#if sidebar_open}<span class="whitespace-normal break-words"
              >{item.name}</span
            >{/if}
        </a>
      {/each}
    </div>
  {/each}
</nav>

<style>
  a:focus-visible {
    outline: 2px solid theme("colors.primary.500");
    outline-offset: 2px;
  }

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
