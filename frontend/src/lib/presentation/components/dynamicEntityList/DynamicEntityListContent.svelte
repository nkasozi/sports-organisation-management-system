<script lang="ts">
  import type {
    DynamicEntityListViewActions,
    DynamicEntityListViewState,
  } from "$lib/presentation/logic/dynamicEntityListControllerTypes";

  import DynamicEntityListAdvancedFilters from "./DynamicEntityListAdvancedFilters.svelte";
  import DynamicEntityListInlineForm from "./DynamicEntityListInlineForm.svelte";
  import DynamicEntityListTable from "./DynamicEntityListTable.svelte";

  export let action_handlers: DynamicEntityListViewActions;
  export let display_state: DynamicEntityListViewState;
</script>

{#if display_state.show_advanced_filter}
  <DynamicEntityListAdvancedFilters
    available_fields={display_state.available_fields}
    filter_values={display_state.filter_values}
    foreign_key_options={display_state.foreign_key_options}
    on_clear_all_filters={action_handlers.on_clear_all_filters}
    on_filter_value_change={action_handlers.on_filter_value_change}
  />
{/if}

{#if display_state.is_inline_form_visible && display_state.inline_form_entity && display_state.is_sub_entity_mode}
  <DynamicEntityListInlineForm
    crud_handlers={display_state.crud_handlers}
    display_name={display_state.display_name}
    entity_type={display_state.entity_type}
    inline_form_entity={display_state.inline_form_entity}
    is_mobile_view={display_state.is_mobile_view}
    sub_entity_filter={display_state.sub_entity_filter}
    on_inline_cancel={action_handlers.on_inline_cancel}
    on_inline_save_success={action_handlers.on_inline_save_success}
  />
{/if}

{#if display_state.is_loading}
  <div
    class="flex items-center justify-center py-8 text-accent-600 dark:text-accent-400"
  >
    <p>Loading {display_state.display_name} list...</p>
  </div>
{:else if display_state.filtered_entities.length === 0}
  <div class="space-y-4 py-8 text-center">
    <p class="text-accent-600 dark:text-accent-400">
      {display_state.entities.length === 0
        ? `No ${display_state.display_name.toLowerCase()} found.`
        : "No items match your filters."}
    </p>
    {#if display_state.entities.length > 0}
      <button
        type="button"
        class="btn btn-outline"
        on:click={action_handlers.on_clear_all_filters}>Clear Filters</button
      >
    {:else if display_state.show_actions && !display_state.is_create_disabled}
      <button
        type="button"
        class="btn {display_state.button_color_class}"
        on:click={action_handlers.on_create_new}
        >Create First {display_state.display_name}</button
      >
    {/if}
  </div>
{:else}
  <DynamicEntityListTable
    all_selected={display_state.all_selected}
    current_page={display_state.current_page}
    entity_metadata={display_state.entity_metadata}
    filtered_count={display_state.filtered_entities.length}
    foreign_key_options={display_state.foreign_key_options}
    get_field_metadata_by_name={action_handlers.get_field_metadata_by_name}
    is_delete_disabled={display_state.is_delete_disabled}
    is_edit_disabled={display_state.is_edit_disabled}
    items_per_page={display_state.items_per_page}
    page_size_options={display_state.page_size_options}
    paginated_entities={display_state.paginated_entities}
    selected_entity_ids={display_state.selected_entity_ids}
    show_actions={display_state.show_actions}
    sort_column={display_state.sort_column}
    sort_direction={display_state.sort_direction}
    total_pages={display_state.total_pages}
    visible_column_list={display_state.visible_column_list}
    on_delete_entity={action_handlers.on_delete_single}
    on_edit_entity={action_handlers.on_edit_entity}
    on_page_change={action_handlers.on_page_change}
    on_page_size_change={action_handlers.on_page_size_change}
    on_toggle_all_selection={action_handlers.on_toggle_all_selection}
    on_toggle_single_selection={action_handlers.on_toggle_single_selection}
    on_toggle_sort_by_column={action_handlers.on_toggle_sort_by_column}
  />
{/if}
