import { describe, expect, it } from "vitest";

import type { BaseEntity } from "../../core/entities/BaseEntity";
import {
  apply_filters_to_entities,
  clear_filter_state,
} from "./dynamicListLogic";
import {
  create_test_entity,
  create_test_entity_metadata,
  create_test_field_metadata,
} from "./dynamicListLogic.test_support";

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
