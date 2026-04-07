import { is_functionality_disabled } from "$lib/core/types/EntityHandlers";
import { get_dynamic_entity_list_available_fields } from "$lib/presentation/logic/dynamicEntityListControllerFields";
import type {
  DynamicEntityListControllerOptions,
  DynamicEntityListViewState,
} from "$lib/presentation/logic/dynamicEntityListControllerTypes";
import { get_dynamic_entity_list_metadata } from "$lib/presentation/logic/dynamicEntityListData";
import { format_entity_display_name } from "$lib/presentation/logic/dynamicFormLogic";
import {
  apply_filters_and_sorting,
  check_if_all_entities_selected,
  check_if_some_entities_selected,
} from "$lib/presentation/logic/dynamicListLogic";

const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [10, 20, 50];

export function build_dynamic_entity_list_view_state(
  options: DynamicEntityListControllerOptions,
  current_state: Partial<DynamicEntityListViewState>,
): DynamicEntityListViewState {
  const entity_metadata = get_dynamic_entity_list_metadata(options.entity_type);
  const display_name =
    entity_metadata?.display_name ||
    format_entity_display_name(options.entity_type);
  const entities = current_state.entities ?? [];
  const filter_values = current_state.filter_values ?? {};
  const foreign_key_options = current_state.foreign_key_options ?? {};
  const items_per_page = current_state.items_per_page ?? DEFAULT_PAGE_SIZE;
  const selected_entity_ids =
    current_state.selected_entity_ids ?? new Set<string>();
  const sort_column = current_state.sort_column ?? "";
  const sort_direction = current_state.sort_direction ?? "asc";
  const visible_columns = current_state.visible_columns ?? new Set<string>();
  const filtered_entities = apply_filters_and_sorting(
    entities,
    filter_values,
    sort_column,
    sort_direction,
    entity_metadata,
    foreign_key_options,
  );
  const total_pages = Math.max(
    1,
    Math.ceil(filtered_entities.length / items_per_page),
  );
  const current_page = Math.min(current_state.current_page ?? 1, total_pages);
  return {
    all_selected: check_if_all_entities_selected(
      filtered_entities,
      selected_entity_ids,
    ),
    available_fields: get_dynamic_entity_list_available_fields(
      entity_metadata,
      options.sub_entity_filter,
    ),
    button_color_class: options.button_color_class,
    can_show_bulk_actions:
      options.show_actions &&
      check_if_some_entities_selected(selected_entity_ids),
    columns_restored_from_cache:
      current_state.columns_restored_from_cache ?? false,
    crud_handlers: options.crud_handlers,
    current_page,
    display_name,
    enable_bulk_import: options.enable_bulk_import,
    entities,
    entities_to_delete: current_state.entities_to_delete ?? [],
    entity_metadata,
    entity_type: options.entity_type,
    error_message: current_state.error_message ?? "",
    filtered_entities,
    filter_values,
    foreign_key_options,
    has_bulk_create_handler: options.bulk_create_handler !== null,
    info_message: options.info_message,
    inline_form_entity: current_state.inline_form_entity ?? null,
    is_create_disabled: is_functionality_disabled(
      "create",
      options.disabled_functionalities,
    ),
    is_delete_disabled: is_functionality_disabled(
      "delete",
      options.disabled_functionalities,
    ),
    is_deleting: current_state.is_deleting ?? false,
    is_edit_disabled: is_functionality_disabled(
      "edit",
      options.disabled_functionalities,
    ),
    is_inline_form_visible: current_state.is_inline_form_visible ?? false,
    is_loading: current_state.is_loading ?? false,
    is_mobile_view: options.is_mobile_view,
    is_sub_entity_mode: options.sub_entity_filter !== null,
    items_per_page,
    page_size_options: PAGE_SIZE_OPTIONS,
    paginated_entities: filtered_entities.slice(
      (current_page - 1) * items_per_page,
      current_page * items_per_page,
    ),
    selected_entity_ids,
    show_actions: options.show_actions,
    show_advanced_filter: current_state.show_advanced_filter ?? false,
    show_bulk_import_modal: current_state.show_bulk_import_modal ?? false,
    show_column_selector: current_state.show_column_selector ?? false,
    show_delete_confirmation: current_state.show_delete_confirmation ?? false,
    show_export_modal: current_state.show_export_modal ?? false,
    sort_column,
    sort_direction,
    sub_entity_filter: options.sub_entity_filter,
    total_pages,
    visible_column_list: Array.from(visible_columns),
    visible_columns,
  };
}
