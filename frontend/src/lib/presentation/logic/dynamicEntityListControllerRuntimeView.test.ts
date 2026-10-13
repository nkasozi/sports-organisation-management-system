import { get } from "svelte/store";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  create_entity,
  create_options,
  create_state,
  create_view_harness,
} from "./dynamicEntityListControllerRuntimeView.test_support";

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

describe("dynamicEntityListControllerRuntimeView", () => {
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
    const { actions, state_store } = create_view_harness(
      create_state({
        entities,
        filtered_entities: entities,
        foreign_key_options: {},
        selected_entity_ids: new Set(["entity-1"]),
        visible_column_list: ["name"],
      }),
      create_options({ on_selection_changed }),
    );

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
    const { actions, state_store } = create_view_harness(
      create_state({
        current_page: 2,
        filter_values: { name: "Old" },
        show_advanced_filter: false,
        show_column_selector: false,
        show_export_modal: false,
        sort_column: "name",
        sort_direction: "asc",
      }),
      create_options(),
    );

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
    const { actions } = create_view_harness(
      create_state({
        all_selected: false,
        entities: selected_entities,
        filtered_entities: selected_entities,
        selected_entity_ids: new Set<string>(),
      }),
      create_options({ on_selection_changed }),
    );

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
});
