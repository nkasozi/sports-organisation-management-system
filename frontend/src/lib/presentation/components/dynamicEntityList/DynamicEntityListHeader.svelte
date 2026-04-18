<script lang="ts">
  export let button_color_class: string;
  export let can_show_bulk_actions: boolean;
  export let columns_restored_from_cache: boolean;
  export let current_page: number;
  export let display_name: string;
  export let enable_bulk_import: boolean;
  export let entities_count: number;
  export let filtered_count: number;
  export let has_bulk_create_handler: boolean;
  export let info_message: string;
  export let is_create_disabled: boolean;
  export let is_delete_disabled: boolean;
  export let is_deleting: boolean;
  export let items_per_page: number;
  export let selected_entity_count: number;
  export let show_actions: boolean;
  export let total_pages: number;
  export let on_bulk_create: () => void;
  export let on_create_new: () => boolean;
  export let on_delete_multiple: () => boolean;
  export let on_dismiss_cached_columns: () => void;
  export let on_open_bulk_import: () => void;
  export let on_open_column_selector: () => void;
  export let on_open_export_modal: () => void;
  export let on_toggle_advanced_filter: () => void;
</script>

<div
  class="flex flex-col gap-4 border-b border-gray-200 pb-4 dark:border-gray-700 sm:flex-row sm:items-center sm:justify-between"
>
  <div>
    <h2
      class="text-lg font-semibold text-accent-900 dark:text-accent-100 sm:text-xl"
    >
      {display_name} List
    </h2>
    <p class="text-sm text-accent-600 dark:text-accent-400">
      {filtered_count} of {entities_count}
      {entities_count === 1 ? "item" : "items"}
      {#if filtered_count > items_per_page}
        &nbsp;· page {current_page} of {total_pages}
      {/if}
    </p>
    {#if columns_restored_from_cache}
      <div
        class="mt-2 rounded-lg border border-blue-200 bg-blue-50 p-2.5 dark:border-blue-700 dark:bg-blue-900/20"
      >
        <div class="flex items-center justify-between gap-2">
          <p class="text-xs text-blue-800 dark:text-blue-200">
            Showing your previously saved column selection
          </p>
          <button
            type="button"
            class="p-0.5 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
            on:click={on_dismiss_cached_columns}
            title="Dismiss"
          >
            <svg
              class="h-3.5 w-3.5"
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
        </div>
      </div>
    {/if}
    {#if info_message}
      <div
        class="mt-2 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-700 dark:bg-blue-900/30"
      >
        <p class="text-xs text-blue-800 dark:text-blue-200">{info_message}</p>
      </div>
    {/if}
  </div>

  <div class="flex w-full flex-wrap gap-x-2 gap-y-4 sm:w-auto">
    <button
      type="button"
      class="btn btn-outline w-auto"
      on:click={on_toggle_advanced_filter}>Filter</button
    >
    <button
      type="button"
      class="btn btn-outline w-auto"
      on:click={on_open_column_selector}>Columns</button
    >
    <button
      type="button"
      class="btn btn-outline w-auto"
      on:click={on_open_export_modal}>Export</button
    >
    {#if can_show_bulk_actions && !is_delete_disabled}
      <button
        type="button"
        class="btn btn-outline w-auto"
        on:click={on_delete_multiple}
        disabled={is_deleting}>Delete ({selected_entity_count})</button
      >
    {/if}
    {#if enable_bulk_import && !is_create_disabled}
      <button
        type="button"
        class="btn w-auto bg-purple-600 text-white hover:bg-purple-700"
        on:click={on_open_bulk_import}>Bulk Import</button
      >
    {/if}
    {#if has_bulk_create_handler && !is_create_disabled}
      <button
        type="button"
        class="btn w-auto bg-purple-600 text-white hover:bg-purple-700"
        on:click={on_bulk_create}>Bulk Create</button
      >
    {/if}
    {#if show_actions && !is_create_disabled}
      <button
        type="button"
        class="btn {button_color_class} w-auto"
        on:click={on_create_new}>Create New</button
      >
    {/if}
  </div>
</div>
