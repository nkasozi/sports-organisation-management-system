import { get, writable } from "svelte/store";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { BaseEntity } from "$lib/core/entities/BaseEntity";

const {
  export_dynamic_entity_list_to_csv_mock,
  get_dynamic_entity_list_cleared_filter_state_mock,
  get_dynamic_entity_list_field_metadata_by_name_mock,
  get_dynamic_entity_list_selected_entities_mock,
  get_dynamic_entity_list_sort_state_mock,
  get_dynamic_entity_list_toggle_all_selection_mock,
  get_dynamic_entity_list_toggle_single_selection_mock,
  toggle_dynamic_entity_list_column_visibility_mock,
} = vi.hoisted(() => ({
  export_dynamic_entity_list_to_csv_mock: vi.fn(),
  get_dynamic_entity_list_cleared_filter_state_mock: vi.fn(),
  get_dynamic_entity_list_field_metadata_by_name_mock: vi.fn(),
  get_dynamic_entity_list_selected_entities_mock: vi.fn(),
  get_dynamic_entity_list_sort_state_mock: vi.fn(),
  get_dynamic_entity_list_toggle_all_selection_mock: vi.fn(),
  get_dynamic_entity_list_toggle_single_selection_mock: vi.fn(),
  toggle_dynamic_entity_list_column_visibility_mock: vi.fn(),
}));

vi.mock("$lib/presentation/logic/dynamicEntityListControllerFields", () => ({
  get_dynamic_entity_list_field_metadata_by_name:
    get_dynamic_entity_list_field_metadata_by_name_mock,
}));

vi.mock(
  "$lib/presentation/logic/dynamicEntityListControllerInteractions",
  () => ({
    export_dynamic_entity_list_to_csv: export_dynamic_entity_list_to_csv_mock,
    get_dynamic_entity_list_cleared_filter_state:
      get_dynamic_entity_list_cleared_filter_state_mock,
    get_dynamic_entity_list_selected_entities:
      get_dynamic_entity_list_selected_entities_mock,
    get_dynamic_entity_list_sort_state: get_dynamic_entity_list_sort_state_mock,
    get_dynamic_entity_list_toggle_all_selection:
      get_dynamic_entity_list_toggle_all_selection_mock,
    get_dynamic_entity_list_toggle_single_selection:
      get_dynamic_entity_list_toggle_single_selection_mock,
    toggle_dynamic_entity_list_column_visibility:
      toggle_dynamic_entity_list_column_visibility_mock,
  }),
);

import { create_dynamic_entity_list_controller_view_actions } from "./dynamicEntityListControllerRuntimeView";
import type {
  DynamicEntityListControllerOptions,
  DynamicEntityListViewState,
} from "./dynamicEntityListControllerTypes";

describe("dynamicEntityListControllerRuntimeView", () => {
  function create_entity(id: string): BaseEntity {
    return {
      id,
      created_at: "2024-01-01T00:00:00.000Z",
      updated_at: "2024-01-01T00:00:00.000Z",
    } as BaseEntity;
  }

  function create_options(
    overrides: Partial<DynamicEntityListControllerOptions> = {},
  ): DynamicEntityListControllerOptions {
    return {
      bulk_create_handler: null,
      button_color_class: "",
      crud_handlers: null,
      disabled_functionalities: [],
      enable_bulk_import: false,
      entity_type: "team",
      info_message: null,
      is_mobile_view: false,
      on_entities_batch_deleted: null,
      on_selection_changed: null,
      on_total_count_changed: null,
      show_actions: true,
      sub_entity_filter: null,
      view_callbacks: null,
      ...overrides,
    } as DynamicEntityListControllerOptions;
  }

  function create_state(
    overrides: Partial<DynamicEntityListViewState> = {},
  ): DynamicEntityListViewState {
    const entities = overrides.entities ?? [];
    const filtered_entities = overrides.filtered_entities ?? entities;
    const paginated_entities =
      overrides.paginated_entities ?? filtered_entities;
    return {
      all_selected: false,
      available_fields: [],
      button_color_class: "",
      can_show_bulk_actions: false,
      columns_restored_from_cache: false,
      crud_handlers: null,
      current_page: 1,
      display_name: "Team",
      enable_bulk_import: false,
      entities,
      entities_to_delete: [],
      entity_metadata: null,
      entity_type: "team",
      error_message: "",
      filtered_entities,
      filter_values: {},
      foreign_key_options: {},
      has_bulk_create_handler: false,
      info_message: null,
      inline_form_entity: null,
      is_create_disabled: false,
      is_delete_disabled: false,
      is_deleting: false,
      is_edit_disabled: false,
      is_inline_form_visible: false,
      is_loading: false,
      is_mobile_view: false,
      is_sub_entity_mode: false,
      items_per_page: 10,
      page_size_options: [10, 20, 50],
      paginated_entities,
      selected_entity_ids: new Set<string>(),
      show_actions: true,
      show_advanced_filter: false,
      show_bulk_import_modal: false,
      show_column_selector: false,
      show_delete_confirmation: false,
      show_export_modal: false,
      sort_column: "",
      sort_direction: "asc",
      sub_entity_filter: null,
      total_pages: 1,
      visible_column_list: [],
      visible_columns: new Set<string>(),
      ...overrides,
    } as DynamicEntityListViewState;
  }

  beforeEach(() => {
    export_dynamic_entity_list_to_csv_mock.mockReset();
    get_dynamic_entity_list_cleared_filter_state_mock.mockReset();
    get_dynamic_entity_list_field_metadata_by_name_mock.mockReset();
    get_dynamic_entity_list_selected_entities_mock.mockReset();
    get_dynamic_entity_list_sort_state_mock.mockReset();
    get_dynamic_entity_list_toggle_all_selection_mock.mockReset();
    get_dynamic_entity_list_toggle_single_selection_mock.mockReset();
    toggle_dynamic_entity_list_column_visibility_mock.mockReset();
  });

  it("clears selection state and exposes current selection helpers", () => {
    const on_selection_changed = vi.fn();
    const entities = [create_entity("entity-1"), create_entity("entity-2")];
    const state_store = writable(
      create_state({
        entities,
        filtered_entities: entities,
        foreign_key_options: {},
        selected_entity_ids: new Set(["entity-1"]),
        visible_column_list: ["name"],
      }),
    );
    const set_state = (updates: Partial<DynamicEntityListViewState>): void =>
      state_store.update((state) => ({ ...state, ...updates }));
    const options = create_options({ on_selection_changed });
    const actions = create_dynamic_entity_list_controller_view_actions({
      get_options: () => options,
      set_state,
      state_store,
    });

    get_dynamic_entity_list_selected_entities_mock.mockReturnValueOnce([
      entities[0],
    ]);

    expect(actions.get_current_selected_entities()).toEqual([entities[0]]);
    expect(actions.get_selected_entity_count()).toBe(1);
    actions.clear_all_selections();
    expect(get(state_store).selected_entity_ids).toEqual(new Set());
    expect(on_selection_changed).toHaveBeenCalledWith([]);
  });

  it("updates filters, pagination, toggles, and sorting through state setters", () => {
    const state_store = writable(
      create_state({
        current_page: 2,
        filter_values: { name: "Old" },
        show_advanced_filter: false,
        show_column_selector: false,
        show_export_modal: false,
        sort_column: "name",
        sort_direction: "asc",
      }),
    );
    const set_state = (updates: Partial<DynamicEntityListViewState>): void =>
      state_store.update((state) => ({ ...state, ...updates }));
    const options = create_options();
    const actions = create_dynamic_entity_list_controller_view_actions({
      get_options: () => options,
      set_state,
      state_store,
    });

    get_dynamic_entity_list_cleared_filter_state_mock.mockReturnValueOnce({
      filter_values: {},
      sort_column: "",
      sort_direction: "asc",
    });
    get_dynamic_entity_list_sort_state_mock.mockReturnValueOnce({
      sort_column: "status",
      sort_direction: "desc",
    });

    actions.set_filter_value("name", "Lions");
    actions.set_page(4);
    actions.set_page_size(20);
    actions.toggle_advanced_filter();
    actions.toggle_column_selector();
    actions.toggle_export_modal();
    actions.toggle_sort_by_column("status");
    expect(get(state_store)).toMatchObject({
      current_page: 1,
      filter_values: { name: "Lions" },
      items_per_page: 20,
      show_advanced_filter: true,
      show_column_selector: true,
      show_export_modal: true,
      sort_column: "status",
      sort_direction: "desc",
    });
    actions.reset_filters();
    expect(get(state_store)).toMatchObject({
      current_page: 1,
      filter_values: {},
      sort_column: "",
      sort_direction: "asc",
    });
  });

  it("updates selection callbacks for all-selection and single-selection actions", () => {
    const selected_entities = [
      create_entity("entity-1"),
      create_entity("entity-2"),
    ];
    const on_selection_changed = vi.fn();
    const state_store = writable(
      create_state({
        all_selected: false,
        entities: selected_entities,
        filtered_entities: selected_entities,
        selected_entity_ids: new Set<string>(),
      }),
    );
    const set_state = (updates: Partial<DynamicEntityListViewState>): void =>
      state_store.update((state) => ({ ...state, ...updates }));
    const options = create_options({ on_selection_changed });
    const actions = create_dynamic_entity_list_controller_view_actions({
      get_options: () => options,
      set_state,
      state_store,
    });

    get_dynamic_entity_list_toggle_all_selection_mock.mockReturnValueOnce(
      new Set(["entity-1", "entity-2"]),
    );
    get_dynamic_entity_list_selected_entities_mock
      .mockReturnValueOnce(selected_entities)
      .mockReturnValueOnce([selected_entities[0]]);
    get_dynamic_entity_list_toggle_single_selection_mock.mockReturnValueOnce(
      new Set(["entity-1"]),
    );

    actions.toggle_all_entity_selection();
    expect(on_selection_changed).toHaveBeenCalledWith(selected_entities);
    actions.toggle_single_selection("entity-1");
    expect(on_selection_changed).toHaveBeenLastCalledWith([
      selected_entities[0],
    ]);
  });

  it("persists column visibility, exports the filtered list, and dismisses cached columns", async () => {
    const entity_metadata = {
      entity_name: "team",
      display_name: "Team",
      fields: [
        {
          field_name: "name",
          display_name: "Name",
          field_type: "string",
          is_required: false,
          is_read_only: false,
        },
      ],
    } as NonNullable<DynamicEntityListViewState["entity_metadata"]>;
    const filtered_entities = [create_entity("entity-1")];
    const foreign_key_options = { team_id: [create_entity("team-1")] };
    const state_store = writable(
      create_state({
        columns_restored_from_cache: true,
        entity_metadata,
        entity_type: "team",
        filtered_entities,
        foreign_key_options,
        show_export_modal: true,
        visible_column_list: ["name"],
        visible_columns: new Set(["name"]),
      }),
    );
    const set_state = (updates: Partial<DynamicEntityListViewState>): void =>
      state_store.update((state) => ({ ...state, ...updates }));
    const options = create_options();
    const actions = create_dynamic_entity_list_controller_view_actions({
      get_options: () => options,
      set_state,
      state_store,
    });

    get_dynamic_entity_list_field_metadata_by_name_mock.mockReturnValueOnce({
      field_name: "name",
    });
    toggle_dynamic_entity_list_column_visibility_mock.mockResolvedValueOnce(
      new Set(["name", "status"]),
    );

    expect(actions.get_field_metadata_by_name("name")).toEqual({
      field_name: "name",
    });
    await actions.toggle_column_visibility("status");
    expect(get(state_store).visible_columns).toEqual(
      new Set(["name", "status"]),
    );
    actions.export_to_csv();
    expect(export_dynamic_entity_list_to_csv_mock).toHaveBeenCalledWith(
      filtered_entities,
      ["name"],
      entity_metadata,
      "team",
      foreign_key_options,
    );
    expect(get(state_store).show_export_modal).toBe(false);
    actions.dismiss_cached_columns();
    expect(get(state_store).columns_restored_from_cache).toBe(false);
  });
});
