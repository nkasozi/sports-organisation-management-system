import { describe, expect, it } from "vitest";

import {
  check_if_all_entities_selected,
  check_if_some_entities_selected,
  determine_if_bulk_actions_available,
  get_selected_entities_from_list,
  toggle_select_all_entities,
  toggle_single_entity_selection,
} from "./dynamicListLogic";
import { create_test_entity } from "./dynamicListLogic.test_support";

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
    const result = check_if_all_entities_selected(entities, new Set());
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

  it("should return false for an empty set", () => {
    const result = check_if_some_entities_selected(new Set());
    expect(result).toBe(false);
  });

  it("should remain false for repeated empty-set checks", () => {
    const result = check_if_some_entities_selected(new Set());
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
