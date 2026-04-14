import { describe, expect, it } from "vitest";

import type { BaseEntity } from "../../core/entities/BaseEntity";
import type { QueryOptions } from "../../core/interfaces/ports";
import type { ScalarInput } from "../../core/types/DomainScalars";
import {
  create_paginated_result_from_options,
  format_repository_error,
  paginate_entity_slice,
  sort_entities_by_options,
} from "./InBrowserBaseRepositoryHelpers";

type TestEntity = BaseEntity & {
  name: string;
  order: number;
};

function create_entity(
  overrides: Partial<ScalarInput<TestEntity>> = {},
): TestEntity {
  return {
    id: "team_1",
    created_at: "2024-01-01T00:00:00.000Z",
    updated_at: "2024-01-01T00:00:00.000Z",
    name: "Zulu",
    order: 1,
    ...overrides,
  } as TestEntity;
}

describe("InBrowserBaseRepositoryHelpers", () => {
  it("formats repository errors and paginated result metadata", () => {
    const first_team = create_entity({ id: "team_1" });

    expect(
      format_repository_error(new Error("disk failed"), "load teams"),
    ).toBe("Failed to load teams: disk failed");
    expect(format_repository_error("unknown", "save team")).toBe(
      "Failed to save team: Unknown error occurred",
    );

    expect(
      create_paginated_result_from_options([first_team], 42, {
        page_number: 2,
        page_size: 10,
      }),
    ).toEqual({
      items: [first_team],
      total_count: 42,
      page_number: 2,
      page_size: 10,
      total_pages: 5,
    });
  });

  it("sorts and paginates entity slices from query options", () => {
    const entities =  [
      create_entity({ id: "team_1", name: "Zulu", order: 3 }),
      create_entity({ id: "team_2", name: "Alpha", order: 1 }),
      create_entity({ id: "team_3", name: "Bravo", order: 2 }),
    ] as TestEntity[];
    const name_sort_options =  {
      sort_by: "name",
      sort_direction: "asc",
    } as QueryOptions;
    const order_sort_options =  {
      sort_by: "order",
      sort_direction: "desc",
    } as QueryOptions;
    const pagination_options =  {
      page_number: 2,
      page_size: 1,
    } as QueryOptions;

    expect(
      sort_entities_by_options(entities, name_sort_options).map(
        (entity: TestEntity) => entity.id,
      ),
    ).toEqual(["team_2", "team_3", "team_1"]);
    expect(
      sort_entities_by_options(entities, order_sort_options).map(
        (entity: TestEntity) => entity.id,
      ),
    ).toEqual(["team_1", "team_3", "team_2"]);
    expect(paginate_entity_slice(entities, pagination_options)).toEqual([
      entities[1],
    ]);
  });
});
