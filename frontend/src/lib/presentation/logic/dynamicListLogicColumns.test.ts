import { describe, expect, it } from "vitest";

import {
  build_default_visible_column_names,
  get_column_responsive_class,
  normalize_entity_type_for_filter,
  toggle_column_in_set,
} from "./dynamicListLogic";
import { create_test_field_metadata } from "./dynamicListLogic.test_support";

describe("build_default_visible_column_names", () => {
  it("should return empty array for empty fields", () => {
    const result = build_default_visible_column_names([], 5);
    expect(result).toEqual([]);
  });

  it("should return empty array for missing fields", () => {
    const result = build_default_visible_column_names([], 5);
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
      create_test_field_metadata("name", "text", { show_in_list: false }),
      create_test_field_metadata("status", "text", { show_in_list: false }),
    ];
    const result = build_default_visible_column_names(fields, 5);
    expect(result).toContain("name");
    expect(result).toContain("status");
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

describe("get_column_responsive_class", () => {
  it("returns empty string for first column", () => {
    expect(get_column_responsive_class(0)).toBe("");
  });

  it("returns sm hide class for second column", () => {
    expect(get_column_responsive_class(1)).toBe("hidden sm:table-cell");
  });

  it("returns md hide class for third column", () => {
    expect(get_column_responsive_class(2)).toBe("hidden md:table-cell");
  });

  it("returns lg hide class for fourth column and beyond", () => {
    expect(get_column_responsive_class(3)).toBe("hidden lg:table-cell");
    expect(get_column_responsive_class(10)).toBe("hidden lg:table-cell");
  });
});

describe("normalize_entity_type_for_filter", () => {
  it("lowercases and removes spaces", () => {
    expect(normalize_entity_type_for_filter("Player Profile")).toBe(
      "playerprofile",
    );
  });

  it("removes underscores", () => {
    expect(normalize_entity_type_for_filter("player_team_membership")).toBe(
      "playerteammembership",
    );
  });

  it("removes hyphens", () => {
    expect(normalize_entity_type_for_filter("player-transfer")).toBe(
      "playertransfer",
    );
  });

  it("lowercases already clean strings", () => {
    expect(normalize_entity_type_for_filter("Team")).toBe("team");
  });
});
