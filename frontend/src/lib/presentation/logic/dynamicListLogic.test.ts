import { describe, it, expect } from "vitest";
import type {
  BaseEntity,
  FieldMetadata,
  EntityMetadata,
} from "../../core/entities/BaseEntity";
import type { SubEntityFilter } from "../../core/types/SubEntityFilter";
import {
  extract_items_from_result_data,
  extract_total_count_from_result_data,
  extract_error_message_from_result,
  build_default_visible_column_names,
  check_if_all_entities_selected,
  check_if_some_entities_selected,
  determine_if_bulk_actions_available,
  build_filter_from_sub_entity_config,
  get_display_value_for_entity_field,
  toggle_sort_direction,
  toggle_column_in_set,
  apply_filters_to_entities,
  sort_entities,
  apply_filters_and_sorting,
  build_csv_content,
  build_csv_filename,
  create_new_entity_with_defaults,
  get_selected_entities_from_list,
  remove_entities_by_ids,
  build_display_name_from_metadata,
  clear_filter_state,
  toggle_select_all_entities,
  toggle_single_entity_selection,
} from "./dynamicListLogic";

function create_test_entity(
  id: string,
  name: string,
  status: string = "active",
): BaseEntity {
  return {
    id,
    name,
    status,
    created_at: "2024-01-01",
    updated_at: "2024-01-01",
  } as unknown as BaseEntity;
}

function create_test_field_metadata(
  field_name: string,
  field_type: string,
  options: Partial<FieldMetadata> = {},
): FieldMetadata {
  return {
    field_name,
    field_type,
    display_name: options.display_name || field_name,
    show_in_list: options.show_in_list ?? true,
    show_in_form: options.show_in_form ?? true,
    is_required: options.is_required ?? false,
    is_read_only: options.is_read_only ?? false,
    foreign_key_entity: options.foreign_key_entity,
    ...options,
  } as FieldMetadata;
}

function create_test_entity_metadata(
  fields: FieldMetadata[],
  display_name: string = "Test Entity",
): EntityMetadata {
  return {
    entity_name: "test_entity",
    display_name,
    fields,
  } as EntityMetadata;
}

describe("extract_items_from_result_data", () => {
  it("should return empty array for null data", () => {
    const result = extract_items_from_result_data(null);
    expect(result).toEqual([]);
  });

  it("should return empty array for undefined data", () => {
    const result = extract_items_from_result_data(undefined);
    expect(result).toEqual([]);
  });

  it("should return the array directly when data is an array", () => {
    const entities = [
      create_test_entity("1", "Entity 1"),
      create_test_entity("2", "Entity 2"),
    ];
    const result = extract_items_from_result_data(entities);
    expect(result).toEqual(entities);
    expect(result).toHaveLength(2);
  });

  it("should extract items array from paginated result object", () => {
    const items = [
      create_test_entity("1", "Entity 1"),
      create_test_entity("2", "Entity 2"),
    ];
    const paginated_data = { items, total_count: 10 };
    const result = extract_items_from_result_data(paginated_data);
    expect(result).toEqual(items);
    expect(result).toHaveLength(2);
  });

  it("should return empty array for object without items property", () => {
    const invalid_data = { total_count: 10 } as unknown as {
      items: BaseEntity[];
      total_count: number;
    };
    const result = extract_items_from_result_data(invalid_data);
    expect(result).toEqual([]);
  });
});

describe("extract_total_count_from_result_data", () => {
  it("should return 0 for null data", () => {
    const result = extract_total_count_from_result_data(null);
    expect(result).toBe(0);
  });

  it("should return 0 for undefined data", () => {
    const result = extract_total_count_from_result_data(undefined);
    expect(result).toBe(0);
  });

  it("should return array length when data is an array", () => {
    const entities = [
      create_test_entity("1", "A"),
      create_test_entity("2", "B"),
      create_test_entity("3", "C"),
    ];
    const result = extract_total_count_from_result_data(entities);
    expect(result).toBe(3);
  });

  it("should return total_count from paginated result object", () => {
    const paginated_data = {
      items: [create_test_entity("1", "A")],
      total_count: 100,
    };
    const result = extract_total_count_from_result_data(paginated_data);
    expect(result).toBe(100);
  });

  it("should return 0 for empty array", () => {
    const result = extract_total_count_from_result_data([]);
    expect(result).toBe(0);
  });
});

describe("extract_error_message_from_result", () => {
  it("should return 'Unknown error' for null result", () => {
    const result = extract_error_message_from_result(null);
    expect(result).toBe("Unknown error");
  });

  it("should return 'Unknown error' for undefined result", () => {
    const result = extract_error_message_from_result(undefined);
    expect(result).toBe("Unknown error");
  });

  it("should return error_message when present on failed result", () => {
    const api_result = { success: false, error_message: "Entity not found" };
    const result = extract_error_message_from_result(api_result);
    expect(result).toBe("Entity not found");
  });

  it("should return error when error_message is not present but error is", () => {
    const api_result = { success: false, error: "Connection failed" };
    const result = extract_error_message_from_result(api_result);
    expect(result).toBe("Connection failed");
  });

  it("should prefer error_message over error", () => {
    const api_result = {
      success: false,
      error_message: "Specific error",
      error: "Generic error",
    };
    const result = extract_error_message_from_result(api_result);
    expect(result).toBe("Specific error");
  });

  it("should return 'Unknown error' for successful result without error fields", () => {
    const api_result = { success: true };
    const result = extract_error_message_from_result(api_result);
    expect(result).toBe("Unknown error");
  });
});

describe("build_default_visible_column_names", () => {
  it("should return empty array for empty fields", () => {
    const result = build_default_visible_column_names([], 5);
    expect(result).toEqual([]);
  });

  it("should return empty array for null fields", () => {
    const result = build_default_visible_column_names(
      null as unknown as FieldMetadata[],
      5,
    );
    expect(result).toEqual([]);
  });

  it("should exclude sub_entity fields from visible columns", () => {
    const fields = [
      create_test_field_metadata("name", "text"),
      create_test_field_metadata("players", "sub_entity"),
      create_test_field_metadata("status", "text"),
    ];
    const result = build_default_visible_column_names(fields, 5);
    expect(result).not.toContain("players");
    expect(result).toContain("name");
    expect(result).toContain("status");
  });

  it("should prioritize fields with show_in_list=true", () => {
    const fields = [
      create_test_field_metadata("id", "text", { show_in_list: false }),
      create_test_field_metadata("name", "text", { show_in_list: true }),
      create_test_field_metadata("description", "text", {
        show_in_list: false,
      }),
      create_test_field_metadata("status", "text", { show_in_list: true }),
    ];
    const result = build_default_visible_column_names(fields, 5);
    expect(result).toEqual(["name", "status"]);
  });

  it("should respect max_columns limit", () => {
    const fields = [
      create_test_field_metadata("field1", "text"),
      create_test_field_metadata("field2", "text"),
      create_test_field_metadata("field3", "text"),
      create_test_field_metadata("field4", "text"),
      create_test_field_metadata("field5", "text"),
    ];
    const result = build_default_visible_column_names(fields, 3);
    expect(result).toHaveLength(3);
    expect(result).toEqual(["field1", "field2", "field3"]);
  });

  it("should handle max_columns of 0", () => {
    const fields = [create_test_field_metadata("name", "text")];
    const result = build_default_visible_column_names(fields, 0);
    expect(result).toEqual([]);
  });

  it("should handle negative max_columns by treating as 0", () => {
    const fields = [create_test_field_metadata("name", "text")];
    const result = build_default_visible_column_names(fields, -5);
    expect(result).toEqual([]);
  });

  it("should use all displayable fields when none have show_in_list explicitly set to true", () => {
    const fields = [
      create_test_field_metadata("name", "text", { show_in_list: undefined }),
      create_test_field_metadata("status", "text", { show_in_list: false }),
    ];
    const result = build_default_visible_column_names(fields, 5);
    expect(result).toContain("name");
    expect(result).toContain("status");
  });
});

describe("check_if_all_entities_selected", () => {
  it("should return false for empty entity list", () => {
    const result = check_if_all_entities_selected([], new Set(["1", "2"]));
    expect(result).toBe(false);
  });

  it("should return false for empty selected ids", () => {
    const entities = [create_test_entity("1", "A")];
    const result = check_if_all_entities_selected(entities, new Set());
    expect(result).toBe(false);
  });

  it("should return false for null selected ids", () => {
    const entities = [create_test_entity("1", "A")];
    const result = check_if_all_entities_selected(
      entities,
      null as unknown as Set<string>,
    );
    expect(result).toBe(false);
  });

  it("should return true when all entities are selected", () => {
    const entities = [
      create_test_entity("1", "A"),
      create_test_entity("2", "B"),
    ];
    const selected = new Set(["1", "2"]);
    const result = check_if_all_entities_selected(entities, selected);
    expect(result).toBe(true);
  });

  it("should return false when only some entities are selected", () => {
    const entities = [
      create_test_entity("1", "A"),
      create_test_entity("2", "B"),
      create_test_entity("3", "C"),
    ];
    const selected = new Set(["1", "3"]);
    const result = check_if_all_entities_selected(entities, selected);
    expect(result).toBe(false);
  });

  it("should return true when selected ids has extra ids beyond entity list", () => {
    const entities = [create_test_entity("1", "A")];
    const selected = new Set(["1", "999"]);
    const result = check_if_all_entities_selected(entities, selected);
    expect(result).toBe(true);
  });
});

describe("check_if_some_entities_selected", () => {
  it("should return false for empty set", () => {
    const result = check_if_some_entities_selected(new Set());
    expect(result).toBe(false);
  });

  it("should return false for null set", () => {
    const result = check_if_some_entities_selected(null);
    expect(result).toBe(false);
  });

  it("should return false for undefined set", () => {
    const result = check_if_some_entities_selected(undefined);
    expect(result).toBe(false);
  });

  it("should return true when at least one entity is selected", () => {
    const result = check_if_some_entities_selected(new Set(["1"]));
    expect(result).toBe(true);
  });

  it("should return true when multiple entities are selected", () => {
    const result = check_if_some_entities_selected(new Set(["1", "2", "3"]));
    expect(result).toBe(true);
  });
});

describe("determine_if_bulk_actions_available", () => {
  it("should return false when no selection and actions disabled", () => {
    const result = determine_if_bulk_actions_available(false, false);
    expect(result).toBe(false);
  });

  it("should return false when has selection but actions disabled", () => {
    const result = determine_if_bulk_actions_available(true, false);
    expect(result).toBe(false);
  });

  it("should return false when no selection but actions enabled", () => {
    const result = determine_if_bulk_actions_available(false, true);
    expect(result).toBe(false);
  });

  it("should return true when has selection and actions enabled", () => {
    const result = determine_if_bulk_actions_available(true, true);
    expect(result).toBe(true);
  });
});

describe("build_filter_from_sub_entity_config", () => {
  it("should return undefined for null config", () => {
    const result = build_filter_from_sub_entity_config(null);
    expect(result).toBeUndefined();
  });

  it("should return undefined for undefined config", () => {
    const result = build_filter_from_sub_entity_config(undefined);
    expect(result).toBeUndefined();
  });

  it("should build filter with foreign key field", () => {
    const config: SubEntityFilter = {
      foreign_key_field: "team_id",
      foreign_key_value: "team-123",
    };
    const result = build_filter_from_sub_entity_config(config);
    expect(result).toEqual({ team_id: "team-123" });
  });

  it("should include holder type fields when present", () => {
    const config: SubEntityFilter = {
      foreign_key_field: "holder_id",
      foreign_key_value: "holder-456",
      holder_type_field: "holder_type",
      holder_type_value: "competition",
    };
    const result = build_filter_from_sub_entity_config(config);
    expect(result).toEqual({
      holder_id: "holder-456",
      holder_type: "competition",
    });
  });

  it("should not include holder type when holder_type_field is missing", () => {
    const config: SubEntityFilter = {
      foreign_key_field: "team_id",
      foreign_key_value: "team-123",
      holder_type_value: "competition",
    };
    const result = build_filter_from_sub_entity_config(config);
    expect(result).toEqual({ team_id: "team-123" });
  });
});

describe("get_display_value_for_entity_field", () => {
  it("should return empty string for null entity", () => {
    const result = get_display_value_for_entity_field(
      null as unknown as BaseEntity,
      "name",
      {},
    );
    expect(result).toBe("");
  });

  it("should return empty string for empty field name", () => {
    const entity = create_test_entity("1", "Test");
    const result = get_display_value_for_entity_field(entity, "", {});
    expect(result).toBe("");
  });

  it("should return empty string for null field value", () => {
    const entity = { id: "1", nullable_field: null } as unknown as BaseEntity;
    const result = get_display_value_for_entity_field(
      entity,
      "nullable_field",
      {},
    );
    expect(result).toBe("");
  });

  it("should return empty string for undefined field value", () => {
    const entity = create_test_entity("1", "Test");
    const result = get_display_value_for_entity_field(
      entity,
      "nonexistent_field",
      {},
    );
    expect(result).toBe("");
  });

  it("should return string value directly", () => {
    const entity = create_test_entity("1", "Test Name");
    const result = get_display_value_for_entity_field(entity, "name", {});
    expect(result).toBe("Test Name");
  });

  it("should convert number to string", () => {
    const entity = { id: "1", count: 42 } as unknown as BaseEntity;
    const result = get_display_value_for_entity_field(entity, "count", {});
    expect(result).toBe("42");
  });

  it("should convert boolean true to 'Yes'", () => {
    const entity = { id: "1", is_active: true } as unknown as BaseEntity;
    const result = get_display_value_for_entity_field(entity, "is_active", {});
    expect(result).toBe("Yes");
  });

  it("should convert boolean false to 'No'", () => {
    const entity = { id: "1", is_active: false } as unknown as BaseEntity;
    const result = get_display_value_for_entity_field(entity, "is_active", {});
    expect(result).toBe("No");
  });

  it("should resolve foreign key to display name", () => {
    const entity = { id: "1", team_id: "team-123" } as unknown as BaseEntity;
    const foreign_key_options = {
      team_id: [
        { id: "team-123", name: "Manchester United" } as unknown as BaseEntity,
        { id: "team-456", name: "Liverpool" } as unknown as BaseEntity,
      ],
    };
    const result = get_display_value_for_entity_field(
      entity,
      "team_id",
      foreign_key_options,
    );
    expect(result).toBe("Manchester United");
  });

  it("should return formatted value when foreign key option not found", () => {
    const entity = {
      id: "1",
      team_id: "unknown-team",
    } as unknown as BaseEntity;
    const foreign_key_options = {
      team_id: [
        { id: "team-123", name: "Manchester United" } as unknown as BaseEntity,
      ],
    };
    const result = get_display_value_for_entity_field(
      entity,
      "team_id",
      foreign_key_options,
    );
    expect(result).toBe("Unknown-team");
  });
});

describe("toggle_sort_direction", () => {
  it("should toggle from asc to desc when clicking same column", () => {
    const result = toggle_sort_direction("name", "name", "asc");
    expect(result).toEqual({ sort_column: "name", sort_direction: "desc" });
  });

  it("should toggle from desc to asc when clicking same column", () => {
    const result = toggle_sort_direction("name", "name", "desc");
    expect(result).toEqual({ sort_column: "name", sort_direction: "asc" });
  });

  it("should set new column with asc direction when clicking different column", () => {
    const result = toggle_sort_direction("name", "status", "desc");
    expect(result).toEqual({ sort_column: "status", sort_direction: "asc" });
  });

  it("should set new column with asc when current column is empty", () => {
    const result = toggle_sort_direction("", "name", "asc");
    expect(result).toEqual({ sort_column: "name", sort_direction: "asc" });
  });
});

describe("toggle_column_in_set", () => {
  it("should add column when not present", () => {
    const visible = new Set(["name", "status"]);
    const result = toggle_column_in_set(visible, "description");
    expect(result.has("description")).toBe(true);
    expect(result.size).toBe(3);
  });

  it("should remove column when present", () => {
    const visible = new Set(["name", "status", "description"]);
    const result = toggle_column_in_set(visible, "status");
    expect(result.has("status")).toBe(false);
    expect(result.size).toBe(2);
  });

  it("should not mutate the original set", () => {
    const original = new Set(["name"]);
    const result = toggle_column_in_set(original, "status");
    expect(original.has("status")).toBe(false);
    expect(result.has("status")).toBe(true);
  });
});

describe("apply_filters_to_entities", () => {
  const metadata = create_test_entity_metadata([
    create_test_field_metadata("name", "text"),
    create_test_field_metadata("status", "text"),
    create_test_field_metadata("team_id", "foreign_key", {
      foreign_key_entity: "team",
    }),
  ]);

  it("should return empty array for empty entity list", () => {
    const result = apply_filters_to_entities(
      [],
      { name: "test" },
      metadata,
      {},
    );
    expect(result).toEqual([]);
  });

  it("should return all entities when no filters applied", () => {
    const entities = [
      create_test_entity("1", "A"),
      create_test_entity("2", "B"),
    ];
    const result = apply_filters_to_entities(entities, {}, metadata, {});
    expect(result).toHaveLength(2);
  });

  it("should return all entities when filters are empty strings", () => {
    const entities = [
      create_test_entity("1", "A"),
      create_test_entity("2", "B"),
    ];
    const result = apply_filters_to_entities(
      entities,
      { name: "", status: "  " },
      metadata,
      {},
    );
    expect(result).toHaveLength(2);
  });

  it("should filter by text field using case-insensitive partial match", () => {
    const entities = [
      create_test_entity("1", "Manchester United"),
      create_test_entity("2", "Liverpool"),
      create_test_entity("3", "Manchester City"),
    ];
    const result = apply_filters_to_entities(
      entities,
      { name: "manchester" },
      metadata,
      {},
    );
    expect(result).toHaveLength(2);
    expect(result.map((e) => (e as unknown as { name: string }).name)).toEqual([
      "Manchester United",
      "Manchester City",
    ]);
  });

  it("should filter by foreign key using exact match", () => {
    const entities = [
      { id: "1", name: "Player 1", team_id: "team-1" } as unknown as BaseEntity,
      { id: "2", name: "Player 2", team_id: "team-2" } as unknown as BaseEntity,
      { id: "3", name: "Player 3", team_id: "team-1" } as unknown as BaseEntity,
    ];
    const result = apply_filters_to_entities(
      entities,
      { team_id: "team-1" },
      metadata,
      {},
    );
    expect(result).toHaveLength(2);
  });

  it("should apply multiple filters with AND logic", () => {
    const entities = [
      {
        id: "1",
        name: "John Smith",
        status: "active",
      } as unknown as BaseEntity,
      { id: "2", name: "John Doe", status: "pending" } as unknown as BaseEntity,
      {
        id: "3",
        name: "Jane Smith",
        status: "active",
      } as unknown as BaseEntity,
    ];
    const result = apply_filters_to_entities(
      entities,
      { name: "John", status: "pending" },
      metadata,
      {},
    );
    expect(result).toHaveLength(1);
    expect((result[0] as unknown as { id: string }).id).toBe("2");
  });
});

describe("sort_entities", () => {
  it("should return empty array for empty entity list", () => {
    const result = sort_entities([], "name", "asc", {});
    expect(result).toEqual([]);
  });

  it("should return copy of list when no sort column specified", () => {
    const entities = [
      create_test_entity("1", "B"),
      create_test_entity("2", "A"),
    ];
    const result = sort_entities(entities, "", "asc", {});
    expect(result).toHaveLength(2);
    expect((result[0] as unknown as { name: string }).name).toBe("B");
  });

  it("should sort ascending by text field", () => {
    const entities = [
      create_test_entity("1", "Charlie"),
      create_test_entity("2", "Alice"),
      create_test_entity("3", "Bob"),
    ];
    const result = sort_entities(entities, "name", "asc", {});
    expect(result.map((e) => (e as unknown as { name: string }).name)).toEqual([
      "Alice",
      "Bob",
      "Charlie",
    ]);
  });

  it("should sort descending by text field", () => {
    const entities = [
      create_test_entity("1", "Charlie"),
      create_test_entity("2", "Alice"),
      create_test_entity("3", "Bob"),
    ];
    const result = sort_entities(entities, "name", "desc", {});
    expect(result.map((e) => (e as unknown as { name: string }).name)).toEqual([
      "Charlie",
      "Bob",
      "Alice",
    ]);
  });

  it("should sort numbers numerically", () => {
    const entities = [
      { id: "1", name: "A", count: "10" } as unknown as BaseEntity,
      { id: "2", name: "B", count: "2" } as unknown as BaseEntity,
      { id: "3", name: "C", count: "100" } as unknown as BaseEntity,
    ];
    const result = sort_entities(entities, "count", "asc", {});
    expect(
      result.map((e) => (e as unknown as { count: string }).count),
    ).toEqual(["2", "10", "100"]);
  });

  it("should not mutate the original array", () => {
    const original = [
      create_test_entity("1", "B"),
      create_test_entity("2", "A"),
    ];
    const result = sort_entities(original, "name", "asc", {});
    expect((original[0] as unknown as { name: string }).name).toBe("B");
    expect((result[0] as unknown as { name: string }).name).toBe("A");
  });
});

describe("apply_filters_and_sorting", () => {
  const metadata = create_test_entity_metadata([
    create_test_field_metadata("name", "text"),
    create_test_field_metadata("status", "text"),
  ]);

  it("should apply both filtering and sorting", () => {
    const entities = [
      { id: "1", name: "Zebra", status: "enabled" } as unknown as BaseEntity,
      { id: "2", name: "Apple", status: "disabled" } as unknown as BaseEntity,
      { id: "3", name: "Mango", status: "enabled" } as unknown as BaseEntity,
      { id: "4", name: "Banana", status: "enabled" } as unknown as BaseEntity,
    ];
    const result = apply_filters_and_sorting(
      entities,
      { status: "enabled" },
      "name",
      "asc",
      metadata,
      {},
    );
    expect(result.map((e) => (e as unknown as { name: string }).name)).toEqual([
      "Banana",
      "Mango",
      "Zebra",
    ]);
  });
});

describe("build_csv_content", () => {
  const metadata = create_test_entity_metadata([
    create_test_field_metadata("name", "text", { display_name: "Name" }),
    create_test_field_metadata("status", "text", { display_name: "Status" }),
  ]);

  it("should return empty string for empty entities", () => {
    const result = build_csv_content([], ["name"], metadata, {});
    expect(result).toBe("");
  });

  it("should return empty string for empty column list", () => {
    const entities = [create_test_entity("1", "Test")];
    const result = build_csv_content(entities, [], metadata, {});
    expect(result).toBe("");
  });

  it("should build CSV with headers from metadata display names", () => {
    const entities = [create_test_entity("1", "Entity A", "active")];
    const result = build_csv_content(
      entities,
      ["name", "status"],
      metadata,
      {},
    );
    const lines = result.split("\n");
    expect(lines[0]).toBe("Name,Status");
  });

  it("should build CSV with properly escaped values", () => {
    const entities = [
      {
        id: "1",
        name: 'Value with "quotes"',
        status: "active",
      } as unknown as BaseEntity,
    ];
    const result = build_csv_content(
      entities,
      ["name", "status"],
      metadata,
      {},
    );
    const lines = result.split("\n");
    expect(lines[1]).toContain('""');
  });

  it("should handle multiple rows", () => {
    const entities = [
      create_test_entity("1", "A", "active"),
      create_test_entity("2", "B", "inactive"),
    ];
    const result = build_csv_content(
      entities,
      ["name", "status"],
      metadata,
      {},
    );
    const lines = result.split("\n");
    expect(lines).toHaveLength(3);
  });
});

describe("build_csv_filename", () => {
  it("should build filename with entity type and date", () => {
    const date = new Date("2024-06-15T12:00:00Z");
    const result = build_csv_filename("teams", date);
    expect(result).toBe("teams_export_2024-06-15.csv");
  });

  it("should handle different entity types", () => {
    const date = new Date("2024-01-01");
    const result = build_csv_filename("player_positions", date);
    expect(result).toContain("player_positions_export_");
  });
});

describe("create_new_entity_with_defaults", () => {
  it("should create entity with empty id for null filter", () => {
    const result = create_new_entity_with_defaults(null);
    expect(result).toEqual({ id: "" });
  });

  it("should create entity with empty id for undefined filter", () => {
    const result = create_new_entity_with_defaults(undefined);
    expect(result).toEqual({ id: "" });
  });

  it("should include foreign key from filter config", () => {
    const filter: SubEntityFilter = {
      foreign_key_field: "team_id",
      foreign_key_value: "team-123",
    };
    const result = create_new_entity_with_defaults(filter);
    expect(result).toEqual({ id: "", team_id: "team-123" });
  });

  it("should include holder type from filter config", () => {
    const filter: SubEntityFilter = {
      foreign_key_field: "holder_id",
      foreign_key_value: "holder-456",
      holder_type_field: "holder_type",
      holder_type_value: "competition",
    };
    const result = create_new_entity_with_defaults(filter);
    expect(result).toEqual({
      id: "",
      holder_id: "holder-456",
      holder_type: "competition",
    });
  });
});

describe("get_selected_entities_from_list", () => {
  it("should return empty array for empty entity list", () => {
    const result = get_selected_entities_from_list([], new Set(["1"]));
    expect(result).toEqual([]);
  });

  it("should return empty array for empty selected ids", () => {
    const entities = [create_test_entity("1", "A")];
    const result = get_selected_entities_from_list(entities, new Set());
    expect(result).toEqual([]);
  });

  it("should return only selected entities", () => {
    const entities = [
      create_test_entity("1", "A"),
      create_test_entity("2", "B"),
      create_test_entity("3", "C"),
    ];
    const selected = new Set(["1", "3"]);
    const result = get_selected_entities_from_list(entities, selected);
    expect(result).toHaveLength(2);
    expect(result.map((e) => e.id)).toEqual(["1", "3"]);
  });
});

describe("remove_entities_by_ids", () => {
  it("should return empty array for empty entity list", () => {
    const result = remove_entities_by_ids([], ["1"]);
    expect(result).toEqual([]);
  });

  it("should return copy of list when no ids to remove", () => {
    const entities = [create_test_entity("1", "A")];
    const result = remove_entities_by_ids(entities, []);
    expect(result).toHaveLength(1);
  });

  it("should remove entities with matching ids", () => {
    const entities = [
      create_test_entity("1", "A"),
      create_test_entity("2", "B"),
      create_test_entity("3", "C"),
    ];
    const result = remove_entities_by_ids(entities, ["2"]);
    expect(result).toHaveLength(2);
    expect(result.map((e) => e.id)).toEqual(["1", "3"]);
  });

  it("should remove multiple entities", () => {
    const entities = [
      create_test_entity("1", "A"),
      create_test_entity("2", "B"),
      create_test_entity("3", "C"),
    ];
    const result = remove_entities_by_ids(entities, ["1", "3"]);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("2");
  });

  it("should not mutate original array", () => {
    const original = [
      create_test_entity("1", "A"),
      create_test_entity("2", "B"),
    ];
    const result = remove_entities_by_ids(original, ["1"]);
    expect(original).toHaveLength(2);
    expect(result).toHaveLength(1);
  });
});

describe("build_display_name_from_metadata", () => {
  it("should use metadata display_name when valid", () => {
    const metadata = create_test_entity_metadata([], "Team");
    const result = build_display_name_from_metadata(metadata, "teams");
    expect(result).toBe("Team");
  });

  it("should fall back to entity_type when metadata is null", () => {
    const result = build_display_name_from_metadata(null, "players");
    expect(result).toBe("players");
  });

  it("should fall back to entity_type when display_name is empty", () => {
    const metadata = create_test_entity_metadata([], "");
    const result = build_display_name_from_metadata(metadata, "competitions");
    expect(result).toBe("competitions");
  });

  it("should return 'Entity' when both are empty", () => {
    const result = build_display_name_from_metadata(null, "");
    expect(result).toBe("Entity");
  });
});

describe("clear_filter_state", () => {
  it("should return default filter state", () => {
    const result = clear_filter_state();
    expect(result).toEqual({
      filter_values: {},
      sort_column: "",
      sort_direction: "asc",
    });
  });
});

describe("toggle_select_all_entities", () => {
  it("should select all entities when none are selected", () => {
    const entities = [
      create_test_entity("1", "A"),
      create_test_entity("2", "B"),
    ];
    const result = toggle_select_all_entities(entities, false);
    expect(result.size).toBe(2);
    expect(result.has("1")).toBe(true);
    expect(result.has("2")).toBe(true);
  });

  it("should deselect all when all are selected", () => {
    const entities = [
      create_test_entity("1", "A"),
      create_test_entity("2", "B"),
    ];
    const result = toggle_select_all_entities(entities, true);
    expect(result.size).toBe(0);
  });

  it("should return empty set for empty entity list when deselecting", () => {
    const result = toggle_select_all_entities([], true);
    expect(result.size).toBe(0);
  });
});

describe("toggle_single_entity_selection", () => {
  it("should add entity to selection when not present", () => {
    const selected = new Set(["1"]);
    const result = toggle_single_entity_selection(selected, "2");
    expect(result.has("2")).toBe(true);
    expect(result.size).toBe(2);
  });

  it("should remove entity from selection when present", () => {
    const selected = new Set(["1", "2"]);
    const result = toggle_single_entity_selection(selected, "2");
    expect(result.has("2")).toBe(false);
    expect(result.size).toBe(1);
  });

  it("should not mutate the original set", () => {
    const original = new Set(["1"]);
    const result = toggle_single_entity_selection(original, "2");
    expect(original.has("2")).toBe(false);
    expect(result.has("2")).toBe(true);
  });
});
