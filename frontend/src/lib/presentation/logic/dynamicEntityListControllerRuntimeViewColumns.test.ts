import { get } from "svelte/store";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  create_entity,
  create_options,
  create_state,
  create_view_harness,
} from "./dynamicEntityListControllerRuntimeView.test_support";
import type { DynamicEntityListViewState } from "./dynamicEntityListControllerTypes";
import { create_present_csv_metadata_state } from "./listCsvExportLogic";

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

describe("dynamicEntityListControllerRuntimeView columns", () => {
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
    const metadata_state = create_present_csv_metadata_state(entity_metadata);
    const filtered_entities = [create_entity("entity-1")];
    const foreign_key_options = { team_id: [create_entity("team-1")] };
    const { actions, state_store } = create_view_harness(
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
      create_options(),
    );

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
      metadata_state,
      "team",
      foreign_key_options,
    );
    expect(get(state_store).show_export_modal).toBe(false);
    actions.dismiss_cached_columns();
    expect(get(state_store).columns_restored_from_cache).toBe(false);
  });
});
