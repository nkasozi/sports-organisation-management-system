<script lang="ts">
  import {
    get_flat_index_for_grouped,
    type GroupedSelectOptions,
  } from "./searchable_select_logic";

  export let is_open: boolean = false;
  export let list_id: string;
  export let filtered_options_length: number = 0;
  export let grouped_filtered_options: GroupedSelectOptions = [];
  export let highlighted_index: number = 0;
  export let value: string = "";
  export let on_highlight: (index: number) => void;
  export let on_select: (selected_value: string) => void;
</script>

{#if is_open}
  <div
    id={list_id}
    class="absolute z-[9999] mt-2 w-full max-h-64 overflow-auto rounded-[0.175rem] border border-accent-200 dark:border-accent-700 bg-white dark:bg-accent-800 shadow-lg"
    role="listbox"
    tabindex="-1"
    on:mousedown|preventDefault
  >
    {#if filtered_options_length === 0}
      <div class="px-3 py-2 text-sm text-accent-600 dark:text-accent-400">
        No matches
      </div>
    {:else}
      {#each grouped_filtered_options as group_entry, group_index}
        {#if group_entry.group.length > 0}
          <div
            class="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-accent-500 dark:text-accent-400 bg-accent-50 dark:bg-accent-900 sticky top-0"
          >
            {group_entry.group}
          </div>
        {/if}
        {#each group_entry.options as option, option_index (option.value)}
          {@const flat_index = get_flat_index_for_grouped(
            grouped_filtered_options,
            group_index,
            option_index,
          )}
          <button
            type="button"
            class="w-full text-left px-3 py-2 text-sm transition-colors flex items-center gap-2 {flat_index ===
            highlighted_index
              ? 'bg-accent-100 dark:bg-accent-700'
              : 'bg-transparent'} {option.value === value
              ? 'font-semibold text-accent-900 dark:text-accent-100'
              : 'text-accent-800 dark:text-accent-200'}"
            role="option"
            aria-selected={option.value === value}
            on:mouseenter={() => on_highlight(flat_index)}
            on:mousedown|preventDefault|stopPropagation={() =>
              on_select(option.value)}
          >
            {#if option.color_swatch}
              <span
                class="inline-block w-5 h-5 rounded border border-accent-300 dark:border-accent-600 flex-shrink-0"
                style="background-color: {option.color_swatch};"
              ></span>
            {/if}
            {option.label}
          </button>
        {/each}
      {/each}
    {/if}
  </div>
{/if}
