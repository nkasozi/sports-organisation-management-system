import { describe, expect, it, vi } from "vitest";

import type { BaseEntity } from "$lib/core/entities/BaseEntity";
import type { ScalarInput } from "$lib/core/types/DomainScalars";

vi.mock("./listDisplayValueLogic", () => ({
  get_display_value_for_entity_field: vi.fn(
    (entity: Record<string, unknown>, field_name: string) =>
      String(entity[field_name] ?? ""),
  ),
}));

import {
  apply_filters_and_sorting,
  apply_filters_to_entities,
  build_filter_from_sub_entity_config,
  clear_filter_state,
  sort_entities,
} from "./listFilterSortLogic";

type TestEntity = BaseEntity & {
  name: string;
  status: string;
  team_id: string;
};

function create_entity(
  overrides: Partial<ScalarInput<TestEntity>> = {},
): TestEntity {
  return {
    id: "entity_1",
    created_at: "2024-01-01T00:00:00.000Z",
    updated_at: "2024-01-01T00:00:00.000Z",
    name: "Uganda Cranes",
    team_id: "team_1",
    status: "active",
    ...overrides,
  } as unknown as TestEntity;
}

describe("listFilterSortLogic", () => {
  it("builds a filter from sub-entity configuration", () => {
    expect(
      build_filter_from_sub_entity_config({
        foreign_key_field: "competition_id",
        foreign_key_value: "competition_1",
        holder_type_field: "holder_type",
        holder_type_value: "team",
      } as never),
    ).toEqual({
      competition_id: "competition_1",
      holder_type: "team",
    });
    expect(build_filter_from_sub_entity_config(null)).toBeUndefined();
  });

  it("filters entities by foreign keys and text values", () => {
    const entities = [
      create_entity(),
      create_entity({
        id: "entity_2",
        name: "Kenya Select",
        team_id: "team_2",
      }),
    ];

    expect(
      apply_filters_to_entities(
        entities,
        { name: "uganda", team_id: "team_1" },
        {
          fields: [{ field_name: "team_id", field_type: "foreign_key" }],
        } as never,
        {},
      ),
    ).toEqual([entities[0]]);
  });

  it("sorts and combines filtering with sorting without mutating the source", () => {
    const entities = [
      create_entity({ id: "entity_1", name: "Zulu" }),
      create_entity({ id: "entity_2", name: "Alpha" }),
      create_entity({ id: "entity_3", name: "Bravo", status: "archived" }),
    ];

    expect(
      sort_entities(entities, "name", "asc", {}).map((entity) => entity.id),
    ).toEqual(["entity_2", "entity_3", "entity_1"]);

    expect(
      apply_filters_and_sorting(
        entities,
        { status: "active" },
        "name",
        "desc",
        null,
        {},
      ).map((entity) => entity.id),
    ).toEqual(["entity_1", "entity_2"]);
    expect(entities.map((entity) => entity.id)).toEqual([
      "entity_1",
      "entity_2",
      "entity_3",
    ]);
  });

  it("clears filter state to defaults", () => {
    expect(clear_filter_state()).toEqual({
      filter_values: {},
      sort_column: "",
      sort_direction: "asc",
    });
  });
});
