import { beforeEach, describe, expect, it, vi } from "vitest";

import type { BaseEntity } from "$lib/core/entities/BaseEntity";

const {
  apply_filters_and_sorting_mock,
  check_if_all_entities_selected_mock,
  check_if_some_entities_selected_mock,
  format_entity_display_name_mock,
  get_dynamic_entity_list_available_fields_mock,
  get_dynamic_entity_list_metadata_mock,
  is_functionality_disabled_mock,
} = vi.hoisted(() => ({
  apply_filters_and_sorting_mock: vi.fn(),
  check_if_all_entities_selected_mock: vi.fn(),
  check_if_some_entities_selected_mock: vi.fn(),
  format_entity_display_name_mock: vi.fn(),
  get_dynamic_entity_list_available_fields_mock: vi.fn(),
  get_dynamic_entity_list_metadata_mock: vi.fn(),
  is_functionality_disabled_mock: vi.fn(),
}));

vi.mock("$lib/core/types/EntityHandlers", () => ({
  is_functionality_disabled: is_functionality_disabled_mock,
}));

vi.mock("$lib/presentation/logic/dynamicEntityListControllerFields", () => ({
  get_dynamic_entity_list_available_fields:
    get_dynamic_entity_list_available_fields_mock,
}));

vi.mock("$lib/presentation/logic/dynamicEntityListData", () => ({
  get_dynamic_entity_list_metadata: get_dynamic_entity_list_metadata_mock,
}));

vi.mock("$lib/presentation/logic/dynamicFormLogic", () => ({
  format_entity_display_name: format_entity_display_name_mock,
}));

vi.mock("$lib/presentation/logic/dynamicListLogic", () => ({
  apply_filters_and_sorting: apply_filters_and_sorting_mock,
  check_if_all_entities_selected: check_if_all_entities_selected_mock,
  check_if_some_entities_selected: check_if_some_entities_selected_mock,
}));

import { build_dynamic_entity_list_view_state } from "./dynamicEntityListControllerStateBuilder";

function create_entity<TExtra extends Record<string, unknown>>(
  id: string,
  extra: TExtra,
): BaseEntity & TExtra {
  return {
    id,
    created_at: "2024-01-01T00:00:00.000Z",
    updated_at: "2024-01-01T00:00:00.000Z",
    ...extra,
  };
}

describe("dynamicEntityListControllerStateBuilder", () => {
  beforeEach(() => {
    apply_filters_and_sorting_mock.mockReset();
    check_if_all_entities_selected_mock.mockReset();
    check_if_some_entities_selected_mock.mockReset();
    format_entity_display_name_mock.mockReset();
    get_dynamic_entity_list_available_fields_mock.mockReset();
    get_dynamic_entity_list_metadata_mock.mockReset();
    is_functionality_disabled_mock.mockReset();
  });

  it("builds a default view state when no current state has been provided", () => {
    get_dynamic_entity_list_metadata_mock.mockReturnValueOnce(null);
    format_entity_display_name_mock.mockReturnValueOnce("Team Profiles");
    get_dynamic_entity_list_available_fields_mock.mockReturnValueOnce([]);
    apply_filters_and_sorting_mock.mockReturnValueOnce([]);
    check_if_all_entities_selected_mock.mockReturnValueOnce(false);
    check_if_some_entities_selected_mock.mockReturnValueOnce(false);
    is_functionality_disabled_mock.mockImplementation(
      (name: string): boolean => name === "create",
    );

    expect(
      build_dynamic_entity_list_view_state(
        {
          bulk_create_handler: null,
          button_color_class: "primary",
          crud_handlers: null,
          disabled_functionalities: ["create"],
          enable_bulk_import: true,
          entity_type: "team_profile",
          info_message: "Info",
          is_mobile_view: false,
          show_actions: true,
          sub_entity_filter: null,
        } as never,
        {},
      ),
    ).toMatchObject({
      all_selected: false,
      available_fields: [],
      button_color_class: "primary",
      can_show_bulk_actions: false,
      current_page: 1,
      display_name: "Team Profiles",
      entity_metadata: null,
      entity_type: "team_profile",
      has_bulk_create_handler: false,
      is_create_disabled: true,
      is_delete_disabled: false,
      is_edit_disabled: false,
      items_per_page: 10,
      page_size_options: [10, 20, 50],
      paginated_entities: [],
      total_pages: 1,
      visible_column_list: [],
    });
  });

  it("derives filtered entities, selection flags, and pagination from current state", () => {
    const entity_metadata = {
      display_name: "Teams",
      fields: [{ field_name: "name" }],
    };
    const filtered_entities = [
      create_entity("entity-1", {}),
      create_entity("entity-2", {}),
      create_entity("entity-3", {}),
    ];
    const draft_entity = create_entity("draft", {});
    const club = create_entity("club-1", {});

    get_dynamic_entity_list_metadata_mock.mockReturnValueOnce(entity_metadata);
    get_dynamic_entity_list_available_fields_mock.mockReturnValueOnce([
      { field_name: "name" },
    ]);
    apply_filters_and_sorting_mock.mockReturnValueOnce(filtered_entities);
    check_if_all_entities_selected_mock.mockReturnValueOnce(true);
    check_if_some_entities_selected_mock.mockReturnValueOnce(true);
    is_functionality_disabled_mock.mockImplementation(
      (name: string): boolean => name === "delete",
    );

    expect(
      build_dynamic_entity_list_view_state(
        {
          bulk_create_handler: {} as never,
          button_color_class: "secondary",
          crud_handlers: {} as never,
          disabled_functionalities: ["delete"],
          enable_bulk_import: false,
          entity_type: "team",
          info_message: "Updated",
          is_mobile_view: true,
          show_actions: true,
          sub_entity_filter: {
            foreign_key_field: "club_id",
            foreign_key_value: "club-1",
          } as never,
        } as never,
        {
          columns_restored_from_cache: true,
          current_page: 4,
          entities: filtered_entities,
          entities_to_delete: [filtered_entities[1]],
          filter_values: { name: "Lions" },
          foreign_key_options: { club_id: [club] },
          inline_form_entity: draft_entity,
          is_deleting: true,
          is_inline_form_visible: true,
          is_loading: true,
          items_per_page: 2,
          selected_entity_ids: new Set(["entity-1", "entity-2", "entity-3"]),
          show_advanced_filter: true,
          show_bulk_import_modal: true,
          show_column_selector: true,
          show_delete_confirmation: true,
          show_export_modal: true,
          sort_column: "name",
          sort_direction: "desc",
          visible_columns: new Set(["name", "status"]),
        },
      ),
    ).toMatchObject({
      all_selected: true,
      available_fields: [{ field_name: "name" }],
      can_show_bulk_actions: true,
      columns_restored_from_cache: true,
      current_page: 2,
      display_name: "Teams",
      entities: filtered_entities,
      has_bulk_create_handler: true,
      is_delete_disabled: true,
      paginated_entities: [{ id: "entity-3" }],
      total_pages: 2,
      visible_column_list: ["name", "status"],
    });
  });
});
