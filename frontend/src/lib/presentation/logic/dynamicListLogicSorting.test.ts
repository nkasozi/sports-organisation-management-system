import { describe, expect, it } from "vitest";

import type { BaseEntity } from "../../core/entities/BaseEntity";
import {
  apply_filters_and_sorting,
  sort_entities,
  toggle_sort_direction,
} from "./dynamicListLogic";
import {
  create_test_entity,
  create_test_entity_metadata,
  create_test_field_metadata,
} from "./dynamicListLogic.test_support";

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
