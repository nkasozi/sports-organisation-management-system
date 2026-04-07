<script lang="ts">
  import { onMount } from "svelte";

  import type { BaseEntity } from "$lib/core/entities/BaseEntity";
  import type {
    CrudFunctionality,
    EntityCrudHandlers,
    EntityViewCallbacks,
  } from "$lib/core/types/EntityHandlers";
  import type { SubEntityFilter } from "$lib/core/types/SubEntityFilter";
  import { create_dynamic_entity_list_controller_runtime } from "$lib/presentation/logic/dynamicEntityListControllerRuntime";
  import type {
    DynamicEntityListControllerOptions,
    DynamicEntityListViewActions,
  } from "$lib/presentation/logic/dynamicEntityListControllerTypes";

  import DynamicEntityListView from "./dynamicEntityList/DynamicEntityListView.svelte";

  export let bulk_create_handler: (() => void) | null = null;
  export let button_color_class = "btn-primary-action";
  export let crud_handlers: EntityCrudHandlers | null = null;
  export let disabled_functionalities: CrudFunctionality[] = [];
  export let enable_bulk_import = false;
  export let entity_type: string;
  export let info_message: string | null = null;
  export let is_mobile_view = true;
  export let on_entities_batch_deleted:
    | ((entities: BaseEntity[]) => void)
    | null = null;
  export let on_selection_changed: ((selected: BaseEntity[]) => void) | null =
    null;
  export let on_total_count_changed: ((count: number) => void) | null = null;
  export let show_actions = true;
  export let sub_entity_filter: SubEntityFilter | null = null;
  export let view_callbacks: EntityViewCallbacks | null = null;

  const get_controller_options = (): DynamicEntityListControllerOptions => ({
    bulk_create_handler,
    button_color_class,
    crud_handlers,
    disabled_functionalities,
    enable_bulk_import,
    entity_type,
    info_message,
    is_mobile_view,
    on_entities_batch_deleted,
    on_selection_changed,
    on_total_count_changed,
    show_actions,
    sub_entity_filter,
    view_callbacks,
  });
  const controller_runtime = create_dynamic_entity_list_controller_runtime(
    get_controller_options(),
  );
  const controller_state_store = controller_runtime.state_store;

  $: controller_runtime.update_options(get_controller_options());
  $: controller_state = $controller_state_store;
  $: action_handlers = {
    get_field_metadata_by_name: controller_runtime.get_field_metadata_by_name,
    on_bulk_create: () => bulk_create_handler?.(),
    on_cancel_deletion: controller_runtime.cancel_deletion,
    on_clear_all_filters: controller_runtime.reset_filters,
    on_close_bulk_import: controller_runtime.close_bulk_import,
    on_confirm_deletion: controller_runtime.confirm_deletion_action,
    on_create_new: controller_runtime.handle_create_new_entity,
    on_delete_multiple: controller_runtime.handle_delete_multiple_entities,
    on_delete_single: controller_runtime.handle_delete_single_entity,
    on_dismiss_cached_columns: controller_runtime.dismiss_cached_columns,
    on_edit_entity: controller_runtime.handle_edit_entity,
    on_export_csv: controller_runtime.export_to_csv,
    on_filter_value_change: controller_runtime.set_filter_value,
    on_inline_cancel: controller_runtime.handle_inline_form_cancel,
    on_inline_save_success: controller_runtime.handle_inline_form_save,
    on_open_bulk_import: controller_runtime.open_bulk_import,
    on_page_change: controller_runtime.set_page,
    on_page_size_change: controller_runtime.set_page_size,
    on_refresh: controller_runtime.load_all_entities_for_display,
    on_toggle_advanced_filter: controller_runtime.toggle_advanced_filter,
    on_toggle_all_selection: controller_runtime.toggle_all_entity_selection,
    on_toggle_column_selector: controller_runtime.toggle_column_selector,
    on_toggle_column_visibility: controller_runtime.toggle_column_visibility,
    on_toggle_export_modal: controller_runtime.toggle_export_modal,
    on_toggle_single_selection: controller_runtime.toggle_single_selection,
    on_toggle_sort_by_column: controller_runtime.toggle_sort_by_column,
  } satisfies DynamicEntityListViewActions;

  onMount(async () => {
    await controller_runtime.initialize();
  });

  export function get_current_selected_entities(): BaseEntity[] {
    return controller_runtime.get_current_selected_entities();
  }

  export function clear_all_selections(): void {
    controller_runtime.clear_all_selections();
  }

  export function get_selected_entity_count(): number {
    return controller_runtime.get_selected_entity_count();
  }
</script>

<DynamicEntityListView {action_handlers} display_state={controller_state} />
