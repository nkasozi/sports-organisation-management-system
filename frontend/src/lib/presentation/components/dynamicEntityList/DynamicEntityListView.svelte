<script lang="ts">
  import BulkImportModal from "$lib/presentation/components/BulkImportModal.svelte";
  import type {
    DynamicEntityListViewActions,
    DynamicEntityListViewState,
  } from "$lib/presentation/logic/dynamicEntityListControllerTypes";

  import DynamicEntityListColumnSelectorModal from "./DynamicEntityListColumnSelectorModal.svelte";
  import DynamicEntityListContent from "./DynamicEntityListContent.svelte";
  import DynamicEntityListDeleteModal from "./DynamicEntityListDeleteModal.svelte";
  import DynamicEntityListExportModal from "./DynamicEntityListExportModal.svelte";
  import DynamicEntityListHeader from "./DynamicEntityListHeader.svelte";

  export let action_handlers: DynamicEntityListViewActions;
  export let display_state: DynamicEntityListViewState;
</script>

<div class="w-full">
  {#if display_state.error_message}
    <div
      class="mb-4 overflow-hidden rounded-xl border border-secondary-200 bg-white dark:border-secondary-800/50 dark:bg-accent-900"
    >
      <div class="h-1 bg-secondary-400"></div>
      <div class="p-4">
        <p class="text-sm font-medium text-accent-800 dark:text-accent-200">
          {display_state.error_message}
        </p>
        <button
          type="button"
          class="mt-3 text-sm font-semibold text-secondary-600 hover:text-secondary-700 dark:text-secondary-400 dark:hover:text-secondary-300"
          on:click={action_handlers.on_refresh}>Retry</button
        >
      </div>
    </div>
  {/if}

  <div
    class={display_state.is_mobile_view
      ? "-mx-4 space-y-4 border-y border-accent-200 bg-white px-4 pt-4 pb-6 shadow-sm dark:border-accent-700 dark:bg-accent-800 sm:mx-0 sm:rounded-lg sm:border sm:px-6"
      : "card space-y-6 overflow-x-auto p-4 sm:p-6"}
  >
    <DynamicEntityListHeader
      button_color_class={display_state.button_color_class}
      can_show_bulk_actions={display_state.can_show_bulk_actions}
      columns_restored_from_cache={display_state.columns_restored_from_cache}
      current_page={display_state.current_page}
      display_name={display_state.display_name}
      enable_bulk_import={display_state.enable_bulk_import}
      entities_count={display_state.entities.length}
      filtered_count={display_state.filtered_entities.length}
      has_bulk_create_handler={display_state.has_bulk_create_handler}
      info_message={display_state.info_message}
      is_create_disabled={display_state.is_create_disabled}
      is_delete_disabled={display_state.is_delete_disabled}
      is_deleting={display_state.is_deleting}
      items_per_page={display_state.items_per_page}
      selected_entity_count={display_state.selected_entity_ids.size}
      show_actions={display_state.show_actions}
      total_pages={display_state.total_pages}
      on_bulk_create={action_handlers.on_bulk_create}
      on_create_new={action_handlers.on_create_new}
      on_delete_multiple={action_handlers.on_delete_multiple}
      on_dismiss_cached_columns={action_handlers.on_dismiss_cached_columns}
      on_open_bulk_import={action_handlers.on_open_bulk_import}
      on_open_column_selector={action_handlers.on_toggle_column_selector}
      on_open_export_modal={action_handlers.on_toggle_export_modal}
      on_toggle_advanced_filter={action_handlers.on_toggle_advanced_filter}
    />
    <DynamicEntityListContent {action_handlers} {display_state} />
  </div>

  <DynamicEntityListColumnSelectorModal
    available_fields={display_state.available_fields}
    button_color_class={display_state.button_color_class}
    is_visible={display_state.show_column_selector}
    visible_columns={display_state.visible_columns}
    on_close={action_handlers.on_toggle_column_selector}
    on_toggle_column_visibility={action_handlers.on_toggle_column_visibility}
  />
  <DynamicEntityListExportModal
    button_color_class={display_state.button_color_class}
    filtered_count={display_state.filtered_entities.length}
    is_visible={display_state.show_export_modal}
    visible_columns_size={display_state.visible_columns.size}
    on_close={action_handlers.on_toggle_export_modal}
    on_export_csv={action_handlers.on_export_csv}
  />
  <DynamicEntityListDeleteModal
    display_name={display_state.display_name}
    entities_to_delete_count={display_state.entities_to_delete.length}
    is_deleting={display_state.is_deleting}
    is_visible={display_state.show_delete_confirmation}
    on_cancel={action_handlers.on_cancel_deletion}
    on_confirm={action_handlers.on_confirm_deletion}
  />

  {#if display_state.enable_bulk_import}
    <BulkImportModal
      entity_type={display_state.entity_type}
      is_visible={display_state.show_bulk_import_modal}
      on:close={action_handlers.on_close_bulk_import}
      on:import_complete={action_handlers.on_close_bulk_import}
    />
  {/if}
</div>
