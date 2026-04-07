import type {
  BaseEntity,
  EntityMetadata,
  FieldMetadata,
} from "$lib/core/entities/BaseEntity";
import type {
  CrudFunctionality,
  EntityCrudHandlers,
  EntityViewCallbacks,
} from "$lib/core/types/EntityHandlers";
import type { SubEntityFilter } from "$lib/core/types/SubEntityFilter";

export interface DynamicEntityListControllerOptions {
  bulk_create_handler: (() => void) | null;
  button_color_class: string;
  crud_handlers: EntityCrudHandlers | null;
  disabled_functionalities: CrudFunctionality[];
  enable_bulk_import: boolean;
  entity_type: string;
  info_message: string | null;
  is_mobile_view: boolean;
  on_entities_batch_deleted: ((entities: BaseEntity[]) => void) | null;
  on_selection_changed: ((selected: BaseEntity[]) => void) | null;
  on_total_count_changed: ((count: number) => void) | null;
  show_actions: boolean;
  sub_entity_filter: SubEntityFilter | null;
  view_callbacks: EntityViewCallbacks | null;
}

export interface DynamicEntityListViewState {
  all_selected: boolean;
  available_fields: FieldMetadata[];
  button_color_class: string;
  can_show_bulk_actions: boolean;
  columns_restored_from_cache: boolean;
  crud_handlers: EntityCrudHandlers | null;
  current_page: number;
  display_name: string;
  enable_bulk_import: boolean;
  entities: BaseEntity[];
  entities_to_delete: BaseEntity[];
  entity_metadata: EntityMetadata | null;
  entity_type: string;
  error_message: string;
  filtered_entities: BaseEntity[];
  filter_values: Record<string, string>;
  foreign_key_options: Record<string, BaseEntity[]>;
  has_bulk_create_handler: boolean;
  info_message: string | null;
  inline_form_entity: Partial<BaseEntity> | null;
  is_create_disabled: boolean;
  is_delete_disabled: boolean;
  is_deleting: boolean;
  is_edit_disabled: boolean;
  is_inline_form_visible: boolean;
  is_loading: boolean;
  is_mobile_view: boolean;
  is_sub_entity_mode: boolean;
  items_per_page: number;
  page_size_options: number[];
  paginated_entities: BaseEntity[];
  selected_entity_ids: Set<string>;
  show_actions: boolean;
  show_advanced_filter: boolean;
  show_bulk_import_modal: boolean;
  show_column_selector: boolean;
  show_delete_confirmation: boolean;
  show_export_modal: boolean;
  sort_column: string;
  sort_direction: "asc" | "desc";
  sub_entity_filter: SubEntityFilter | null;
  total_pages: number;
  visible_column_list: string[];
  visible_columns: Set<string>;
}

export interface DynamicEntityListViewActions {
  get_field_metadata_by_name: (field_name: string) => FieldMetadata | undefined;
  on_bulk_create: () => void;
  on_cancel_deletion: () => void;
  on_clear_all_filters: () => void;
  on_close_bulk_import: () => Promise<void>;
  on_confirm_deletion: () => Promise<void>;
  on_create_new: () => boolean;
  on_delete_multiple: () => boolean;
  on_delete_single: (entity: BaseEntity) => boolean;
  on_dismiss_cached_columns: () => void;
  on_edit_entity: (entity: BaseEntity) => boolean;
  on_export_csv: () => void;
  on_filter_value_change: (field_name: string, value: string) => void;
  on_inline_cancel: () => boolean;
  on_inline_save_success: (
    event: CustomEvent<{ entity: BaseEntity }>,
  ) => Promise<boolean>;
  on_open_bulk_import: () => void;
  on_page_change: (page: number) => void;
  on_page_size_change: (size: number) => void;
  on_refresh: () => Promise<void>;
  on_toggle_advanced_filter: () => void;
  on_toggle_all_selection: () => void;
  on_toggle_column_selector: () => void;
  on_toggle_column_visibility: (field_name: string) => Promise<void>;
  on_toggle_export_modal: () => void;
  on_toggle_single_selection: (entity_id: string) => void;
  on_toggle_sort_by_column: (field_name: string) => void;
}
