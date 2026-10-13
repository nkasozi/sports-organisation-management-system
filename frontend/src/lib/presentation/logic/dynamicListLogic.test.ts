import { describe, expect, it } from "vitest";

import type { BaseEntity } from "../../core/entities/BaseEntity";
import type { SubEntityFilter } from "../../core/types/SubEntityFilter";
import {
  build_filter_from_sub_entity_config,
  extract_error_message_from_result,
  extract_items_from_result_data,
  extract_total_count_from_result_data,
} from "./dynamicListLogic";
import { create_test_entity } from "./dynamicListLogic.test_support";

describe("extract_items_from_result_data", () => {
  it("should return empty array for missing data", () => {
    const result = extract_items_from_result_data();
    expect(result).toEqual([]);
  });

  it("should return empty array for undefined data", () => {
    const result = extract_items_from_result_data();
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
  it("should return 0 for missing data", () => {
    const result = extract_total_count_from_result_data();
    expect(result).toBe(0);
  });

  it("should return 0 for undefined data", () => {
    const result = extract_total_count_from_result_data();
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
  it("should return 'Unknown error' for missing result", () => {
    const result = extract_error_message_from_result();
    expect(result).toBe("Unknown error");
  });

  it("should return 'Unknown error' for undefined result", () => {
    const result = extract_error_message_from_result();
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

describe("build_filter_from_sub_entity_config", () => {
  it("should return undefined for missing config", () => {
    const result = build_filter_from_sub_entity_config();
    expect(result).toBeUndefined();
  });

  it("should return undefined for undefined config", () => {
    const result = build_filter_from_sub_entity_config();
    expect(result).toBeUndefined();
  });

  it("should build filter with foreign key field", () => {
    const config = {
      foreign_key_field: "team_id",
      foreign_key_value: "team-123",
    } as SubEntityFilter;
    const result = build_filter_from_sub_entity_config(config);
    expect(result).toEqual({ team_id: "team-123" });
  });

  it("should include holder type fields when present", () => {
    const config = {
      foreign_key_field: "holder_id",
      foreign_key_value: "holder-456",
      holder_type_field: "holder_type",
      holder_type_value: "competition",
    } as SubEntityFilter;
    const result = build_filter_from_sub_entity_config(config);
    expect(result).toEqual({
      holder_id: "holder-456",
      holder_type: "competition",
    });
  });

  it("should not include holder type when holder_type_field is missing", () => {
    const config = {
      foreign_key_field: "team_id",
      foreign_key_value: "team-123",
      holder_type_value: "competition",
    } as SubEntityFilter;
    const result = build_filter_from_sub_entity_config(config);
    expect(result).toEqual({ team_id: "team-123" });
  });
});
