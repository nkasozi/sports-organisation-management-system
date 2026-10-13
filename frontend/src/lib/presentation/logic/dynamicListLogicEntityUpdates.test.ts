import { describe, expect, it } from "vitest";

import type { SubEntityFilter } from "../../core/types/SubEntityFilter";
import {
  create_new_entity_with_defaults,
  remove_entities_by_ids,
} from "./dynamicListLogic";
import { create_test_entity } from "./dynamicListLogic.test_support";

describe("create_new_entity_with_defaults", () => {
  it("should create entity with empty id for a missing filter state", () => {
    const result = create_new_entity_with_defaults({ status: "missing" });
    expect(result).toEqual({ id: "" });
  });

  it("should create entity defaults from a present filter state", () => {
    const result = create_new_entity_with_defaults({
      status: "present",
      filter: {
        foreign_key_field: "team_id",
        foreign_key_value: "team-123",
      } as SubEntityFilter,
    });
    expect(result).toEqual({ id: "", team_id: "team-123" });
  });

  it("should include holder type from a present filter state", () => {
    const result = create_new_entity_with_defaults({
      status: "present",
      filter: {
        foreign_key_field: "holder_id",
        foreign_key_value: "holder-456",
        holder_type_field: "holder_type",
        holder_type_value: "competition",
      } as SubEntityFilter,
    });
    expect(result).toEqual({
      id: "",
      holder_id: "holder-456",
      holder_type: "competition",
    });
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
