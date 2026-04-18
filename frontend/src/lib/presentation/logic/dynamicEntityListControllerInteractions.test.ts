import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  export_dynamic_entity_list_to_csv,
  get_dynamic_entity_list_cleared_filter_state,
  get_dynamic_entity_list_selected_entities,
  get_dynamic_entity_list_sort_state,
  get_dynamic_entity_list_toggle_all_selection,
  get_dynamic_entity_list_toggle_single_selection,
  toggle_dynamic_entity_list_column_visibility,
} from "./dynamicEntityListControllerInteractions";
import { create_present_csv_metadata_state } from "./listCsvExportLogic";

const { save_column_preferences_mock } = vi.hoisted(() => ({
  save_column_preferences_mock: vi.fn(),
}));

vi.mock("$lib/presentation/logic/columnPreferences", () => ({
  save_column_preferences: save_column_preferences_mock,
}));

describe("dynamicEntityListControllerInteractions", () => {
  beforeEach(() => {
    save_column_preferences_mock.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("derives sort, filter, and selection state for list interactions", () => {
    const entities = [{ id: "entity-1" }, { id: "entity-2" }];

    expect(get_dynamic_entity_list_sort_state("name", "name", "asc")).toEqual({
      sort_column: "name",
      sort_direction: "desc",
    });
    expect(
      get_dynamic_entity_list_sort_state("name", "status", "desc"),
    ).toEqual({
      sort_column: "status",
      sort_direction: "asc",
    });
    expect(get_dynamic_entity_list_cleared_filter_state()).toEqual({
      filter_values: {},
      sort_column: "",
      sort_direction: "asc",
    });
    expect(
      get_dynamic_entity_list_selected_entities(
        entities as never,
        new Set(["entity-2"]),
      ),
    ).toEqual([entities[1]]);
    expect(
      get_dynamic_entity_list_toggle_all_selection(entities as never, false),
    ).toEqual(new Set(["entity-1", "entity-2"]));
    expect(
      get_dynamic_entity_list_toggle_single_selection(
        new Set(["entity-1"]),
        "entity-2",
      ),
    ).toEqual(new Set(["entity-1", "entity-2"]));
  });

  it("persists visible column changes and returns the updated column set", async () => {
    save_column_preferences_mock.mockImplementationOnce(async () => {});

    await expect(
      toggle_dynamic_entity_list_column_visibility({
        entity_type: "team",
        field_name: "status",
        sub_entity_filter: void 0,

        visible_columns: new Set(["name"]),
      }),
    ).resolves.toEqual(new Set(["name", "status"]));
    expect(save_column_preferences_mock).toHaveBeenCalledWith({
      entity_type: "team",
      sub_entity_filter: void 0,
      visible_columns: new Set(["name", "status"]),
    });
  });

  it("creates a download link and clicks it when exporting CSV data", () => {
    const append_child = vi.fn();
    const click = vi.fn();
    const remove_child = vi.fn();
    const set_attribute = vi.fn();
    const link = { click, setAttribute: set_attribute };

    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-02T12:00:00.000Z"));
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn().mockReturnValue("blob:url"),
    });
    vi.stubGlobal("document", {
      body: {
        appendChild: append_child,
        removeChild: remove_child,
      },
      createElement: vi.fn().mockReturnValue(link),
    });

    export_dynamic_entity_list_to_csv(
      [{ id: "entity-1", name: "Lions" }] as never,
      ["name"],
      create_present_csv_metadata_state({
        fields: [
          {
            display_name: "Name",
            field_name: "name",
            field_type: "string",
          },
        ],
      } as never),
      "team",
      {},
    );

    expect(set_attribute).toHaveBeenCalledWith("href", "blob:url");
    expect(set_attribute).toHaveBeenCalledWith(
      "download",
      "team_export_2024-01-02.csv",
    );
    expect(append_child).toHaveBeenCalledWith(link);
    expect(click).toHaveBeenCalledOnce();
    expect(remove_child).toHaveBeenCalledWith(link);
  });
});
