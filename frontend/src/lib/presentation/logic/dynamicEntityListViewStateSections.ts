import { is_functionality_disabled } from "$lib/core/types/EntityHandlers";
import { get_dynamic_entity_list_available_fields } from "$lib/presentation/logic/dynamicEntityListControllerFields";
import type {
  DynamicEntityListControllerOptions,
  DynamicEntityListViewState,
} from "$lib/presentation/logic/dynamicEntityListControllerTypes";
import { format_entity_display_name } from "$lib/presentation/logic/dynamicFormLogic";
import {
  apply_filters_and_sorting,
  check_if_all_entities_selected,
  check_if_some_entities_selected,
} from "$lib/presentation/logic/dynamicListLogic";

const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [10, 20, 50];

type EntityMetadataValue = DynamicEntityListViewState["entity_metadata"];

type OptionDerivedViewFields = Pick<
  DynamicEntityListViewState,
  | "available_fields"
  | "button_color_class"
  | "crud_handlers"
  | "display_name"
  | "enable_bulk_import"
  | "entity_metadata"
  | "entity_type"
  | "has_bulk_create_handler"
  | "info_message"
  | "is_create_disabled"
  | "is_delete_disabled"
  | "is_edit_disabled"
  | "is_mobile_view"
  | "is_sub_entity_mode"
  | "page_size_options"
  | "show_actions"
  | "sub_entity_filter"
>;

type UiFlagViewFields = Pick<
  DynamicEntityListViewState,
  | "columns_restored_from_cache"
  | "entities_to_delete"
  | "error_message"
  | "inline_form_entity"
  | "is_deleting"
  | "is_inline_form_visible"
  | "is_loading"
  | "show_advanced_filter"
  | "show_bulk_import_modal"
  | "show_column_selector"
  | "show_delete_confirmation"
  | "show_export_modal"
>;

type CollectionViewFields = Pick<
  DynamicEntityListViewState,
  | "all_selected"
  | "can_show_bulk_actions"
  | "entities"
  | "filtered_entities"
  | "filter_values"
  | "foreign_key_options"
  | "selected_entity_ids"
  | "sort_column"
  | "sort_direction"
  | "visible_column_list"
  | "visible_columns"
>;

type PaginationViewFields = Pick<
  DynamicEntityListViewState,
  "current_page" | "items_per_page" | "paginated_entities" | "total_pages"
>;

export function build_option_derived_view_fields(
  options: DynamicEntityListControllerOptions,
  entity_metadata: EntityMetadataValue,
): OptionDerivedViewFields {
  return {
    available_fields: get_dynamic_entity_list_available_fields(
      entity_metadata,
      options.sub_entity_filter,
    ),
    button_color_class: options.button_color_class,
    crud_handlers: options.crud_handlers,
    display_name: entity_metadata
      ? entity_metadata.display_name
      : format_entity_display_name(options.entity_type),
    enable_bulk_import: options.enable_bulk_import,
    entity_metadata,
    entity_type: options.entity_type,
    has_bulk_create_handler: options.bulk_create_handler != void 0,
    info_message: options.info_message,
    is_create_disabled: is_functionality_disabled(
      "create",
      options.disabled_functionalities,
    ),
    is_delete_disabled: is_functionality_disabled(
      "delete",
      options.disabled_functionalities,
    ),
    is_edit_disabled: is_functionality_disabled(
      "edit",
      options.disabled_functionalities,
    ),
    is_mobile_view: options.is_mobile_view,
    is_sub_entity_mode: options.sub_entity_filter != void 0,
    page_size_options: PAGE_SIZE_OPTIONS,
    show_actions: options.show_actions,
    sub_entity_filter: options.sub_entity_filter,
  };
}

export function build_ui_flag_view_fields(
  current_state: Partial<DynamicEntityListViewState>,
): UiFlagViewFields {
  return {
    columns_restored_from_cache:
      current_state.columns_restored_from_cache ?? false,
    entities_to_delete: current_state.entities_to_delete ?? [],
    error_message: current_state.error_message ?? "",
    inline_form_entity: current_state.inline_form_entity,
    is_deleting: current_state.is_deleting ?? false,
    is_inline_form_visible: current_state.is_inline_form_visible ?? false,
    is_loading: current_state.is_loading ?? false,
    show_advanced_filter: current_state.show_advanced_filter ?? false,
    show_bulk_import_modal: current_state.show_bulk_import_modal ?? false,
    show_column_selector: current_state.show_column_selector ?? false,
    show_delete_confirmation: current_state.show_delete_confirmation ?? false,
    show_export_modal: current_state.show_export_modal ?? false,
  };
}

export function build_collection_view_fields(
  options: DynamicEntityListControllerOptions,
  current_state: Partial<DynamicEntityListViewState>,
  entity_metadata: EntityMetadataValue,
): CollectionViewFields {
  const entities = current_state.entities ?? [];
  const filter_values = current_state.filter_values ?? {};
  const foreign_key_options = current_state.foreign_key_options ?? {};
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
  return {
    all_selected: check_if_all_entities_selected(
      filtered_entities,
      selected_entity_ids,
    ),
    can_show_bulk_actions:
      options.show_actions &&
      check_if_some_entities_selected(selected_entity_ids),
    entities,
    filtered_entities,
    filter_values,
    foreign_key_options,
    selected_entity_ids,
    sort_column,
    sort_direction,
    visible_column_list: Array.from(visible_columns),
    visible_columns,
  };
}

export function build_pagination_view_fields(
  current_state: Partial<DynamicEntityListViewState>,
  filtered_entities: DynamicEntityListViewState["filtered_entities"],
): PaginationViewFields {
  const items_per_page = current_state.items_per_page ?? DEFAULT_PAGE_SIZE;
  const total_pages = Math.max(
    1,
    Math.ceil(filtered_entities.length / items_per_page),
  );
  const current_page = Math.min(current_state.current_page ?? 1, total_pages);
  return {
    current_page,
    items_per_page,
    paginated_entities: filtered_entities.slice(
      (current_page - 1) * items_per_page,
      current_page * items_per_page,
    ),
    total_pages,
  };
}
