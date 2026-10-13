import { type Writable, writable } from "svelte/store";

import type { BaseEntity } from "$lib/core/entities/BaseEntity";

import { create_dynamic_entity_list_controller_view_actions } from "./dynamicEntityListControllerRuntimeView";
import type {
  DynamicEntityListControllerOptions,
  DynamicEntityListViewState,
} from "./dynamicEntityListControllerTypes";

type DynamicEntityListViewActionsUnderTest = ReturnType<
  typeof create_dynamic_entity_list_controller_view_actions
>;

interface DynamicEntityListViewHarness {
  actions: DynamicEntityListViewActionsUnderTest;
  state_store: Writable<DynamicEntityListViewState>;
}

export function create_entity(id: string): BaseEntity {
  return {
    id,
    created_at: "2024-01-01T00:00:00.000Z",
    updated_at: "2024-01-01T00:00:00.000Z",
  } as BaseEntity;
}

export function create_options(
  overrides: Partial<DynamicEntityListControllerOptions> = {},
): DynamicEntityListControllerOptions {
  return {
    button_color_class: "",

    disabled_functionalities: [],
    enable_bulk_import: false,
    entity_type: "team",
    info_message: "",
    is_mobile_view: false,

    show_actions: true,

    ...overrides,
  } as DynamicEntityListControllerOptions;
}

function create_default_view_flags(): Partial<DynamicEntityListViewState> {
  return {
    is_create_disabled: false,
    is_delete_disabled: false,
    is_deleting: false,
    is_edit_disabled: false,
    is_inline_form_visible: false,
    is_loading: false,
    is_mobile_view: false,
    is_sub_entity_mode: false,
    show_actions: true,
    show_advanced_filter: false,
    show_bulk_import_modal: false,
    show_column_selector: false,
    show_delete_confirmation: false,
    show_export_modal: false,
  };
}

export function create_state(
  overrides: Partial<DynamicEntityListViewState> = {},
): DynamicEntityListViewState {
  const entities = overrides.entities ?? [];
  const filtered_entities = overrides.filtered_entities ?? entities;
  const paginated_entities = overrides.paginated_entities ?? filtered_entities;

  return {
    all_selected: false,
    available_fields: [],
    button_color_class: "",
    can_show_bulk_actions: false,
    columns_restored_from_cache: false,
    current_page: 1,
    display_name: "Team",
    enable_bulk_import: false,
    entities,
    entities_to_delete: [],
    entity_type: "team",
    error_message: "",
    filtered_entities,
    filter_values: {},
    foreign_key_options: {},
    has_bulk_create_handler: false,
    info_message: "",
    ...create_default_view_flags(),
    items_per_page: 10,
    page_size_options: [10, 20, 50],
    paginated_entities,
    selected_entity_ids: new Set<string>(),
    sort_column: "",
    sort_direction: "asc",
    total_pages: 1,
    visible_column_list: [],
    visible_columns: new Set<string>(),
    ...overrides,
  } as DynamicEntityListViewState;
}

export function create_view_harness(
  initial_state: DynamicEntityListViewState,
  options: DynamicEntityListControllerOptions,
): DynamicEntityListViewHarness {
  const state_store = writable(initial_state);
  const set_state = (updates: Partial<DynamicEntityListViewState>): void =>
    state_store.update((state) => ({ ...state, ...updates }));
  const actions = create_dynamic_entity_list_controller_view_actions({
    get_options: () => options,
    set_state,
    state_store,
  });

  return { actions, state_store };
}
