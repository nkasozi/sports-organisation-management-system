<script lang="ts">
  import type {
    BaseEntity,
    EntityMetadata,
    FieldMetadata,
  } from "$lib/core/entities/BaseEntity";
  import Pagination from "$lib/presentation/components/ui/Pagination.svelte";
  import { get_display_value_for_entity_field } from "$lib/presentation/logic/dynamicListLogic";

  export let all_selected: boolean;
  export let current_page: number;
  export let entity_metadata: EntityMetadata | undefined;
  export let filtered_count: number;
  export let foreign_key_options: Record<string, BaseEntity[]>;
  export let get_field_metadata_by_name: (
    field_name: string,
  ) => FieldMetadata | undefined;
  export let is_delete_disabled: boolean;
  export let is_edit_disabled: boolean;
  export let items_per_page: number;
  export let page_size_options: number[];
  export let paginated_entities: BaseEntity[];
  export let selected_entity_ids: Set<string>;
  export let show_actions: boolean;
  export let sort_column: string;
  export let sort_direction: "asc" | "desc";
  export let total_pages: number;
  export let visible_column_list: string[];
  export let on_delete_entity: (entity: BaseEntity) => boolean;
  export let on_edit_entity: (entity: BaseEntity) => boolean;
  export let on_page_change: (page: number) => void;
  export let on_page_size_change: (size: number) => void;
  export let on_toggle_all_selection: () => void;
  export let on_toggle_single_selection: (entity_id: string) => void;
  export let on_toggle_sort_by_column: (field_name: string) => void;
</script>

<div class="-mx-4 overflow-x-auto sm:mx-0">
  <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
    <thead class="bg-gray-50 dark:bg-gray-800">
      <tr>
        {#if show_actions}
          <th
            class="sticky left-0 z-10 border-r border-gray-200 bg-gray-50 px-3 py-3 text-left dark:border-gray-700 dark:bg-gray-800"
          >
            <input
              type="checkbox"
              class="h-4 w-4 rounded border-gray-300 text-accent-600 focus:ring-accent-500 dark:border-gray-600 dark:text-accent-400 dark:focus:ring-accent-400"
              checked={all_selected}
              on:change={on_toggle_all_selection}
            />
          </th>
        {/if}
        {#each visible_column_list as field_name}
          <th
            class="cursor-pointer whitespace-nowrap px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
            on:click={() => on_toggle_sort_by_column(field_name)}
          >
            <div class="flex items-center gap-1">
              <span
                >{entity_metadata?.fields.find(
                  (field) => field.field_name === field_name,
                )?.display_name || field_name}</span
              >
              {#if sort_column === field_name}
                <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  {#if sort_direction === "asc"}
                    <path
                      fill-rule="evenodd"
                      d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
                      clip-rule="evenodd"
                    />
                  {:else}
                    <path
                      fill-rule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clip-rule="evenodd"
                    />
                  {/if}
                </svg>
              {/if}
            </div>
          </th>
        {/each}
        {#if show_actions && (!is_edit_disabled || !is_delete_disabled)}
          <th
            class="sticky right-0 z-10 border-l border-gray-200 bg-gray-50 px-3 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
            >Actions</th
          >
        {/if}
      </tr>
    </thead>
    <tbody
      class="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900"
    >
      {#each paginated_entities as entity}
        <tr class="hover:bg-gray-50 dark:hover:bg-gray-800">
          {#if show_actions}
            <td
              class="sticky left-0 z-10 border-r border-gray-200 bg-white px-3 py-4 dark:border-gray-700 dark:bg-gray-900"
            >
              <input
                type="checkbox"
                class="h-4 w-4 rounded border-gray-300 text-accent-600 focus:ring-accent-500 dark:border-gray-600 dark:text-accent-400 dark:focus:ring-accent-400"
                checked={selected_entity_ids.has(entity.id)}
                on:change={() => on_toggle_single_selection(entity.id)}
              />
            </td>
          {/if}
          {#each visible_column_list as field_name}
            <td
              class="whitespace-nowrap px-3 py-4 text-sm text-accent-900 dark:text-accent-100"
            >
              <div class="max-w-xs truncate">
                {get_display_value_for_entity_field(
                  entity,
                  field_name,
                  foreign_key_options,
                  get_field_metadata_by_name(field_name),
                )}
              </div>
            </td>
          {/each}
          {#if show_actions && (!is_edit_disabled || !is_delete_disabled)}
            <td
              class="sticky right-0 z-10 border-l border-gray-200 bg-white px-3 py-4 text-right text-sm dark:border-gray-700 dark:bg-gray-900"
            >
              <div class="flex items-center justify-end gap-2">
                {#if !is_edit_disabled}
                  <button
                    type="button"
                    class="btn btn-outline btn-sm"
                    on:click={() => on_edit_entity(entity)}>Edit</button
                  >
                {/if}
                {#if !is_delete_disabled}
                  <button
                    type="button"
                    class="btn btn-outline btn-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    on:click={() => on_delete_entity(entity)}>Delete</button
                  >
                {/if}
              </div>
            </td>
          {/if}
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<Pagination
  {current_page}
  {total_pages}
  total_items={filtered_count}
  {items_per_page}
  {page_size_options}
  on:page_change={(event) => on_page_change(event.detail.page)}
  on:page_size_change={(event) => on_page_size_change(event.detail.size)}
/>
