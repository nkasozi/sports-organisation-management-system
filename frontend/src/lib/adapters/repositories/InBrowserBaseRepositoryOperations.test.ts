import { describe, expect, it, vi } from "vitest";

import type { BaseEntity } from "../../core/entities/BaseEntity";
import { find_all_entities } from "./InBrowserBaseRepositoryOperations";

type TestEntity = BaseEntity & {
  name: string;
};

type TestFilter = {
  name: string;
};

function create_test_entity(id: string, name: string): TestEntity {
  return {
    id,
    created_at: "2024-01-01T00:00:00.000Z",
    updated_at: "2024-01-01T00:00:00.000Z",
    name,
  } as TestEntity;
}

describe("InBrowserBaseRepositoryOperations", () => {
  it("skips apply_entity_filter when the filter object is empty", async () => {
    const all_entities = [
      create_test_entity("entity_1", "Alpha"),
      create_test_entity("entity_2", "Bravo"),
    ];
    const table = {
      toArray: vi.fn().mockResolvedValue(all_entities),
    } as never;
    const apply_entity_filter = vi.fn(
      (entities: TestEntity[], filter: TestFilter): TestEntity[] =>
        entities.filter((entity) => entity.name === filter.name),
    );

    const result = await find_all_entities(table, {}, apply_entity_filter, {
      page_number: 1,
      page_size: 1,
    });

    expect(apply_entity_filter).not.toHaveBeenCalled();
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.items).toEqual([all_entities[0]]);
      expect(result.data.total_count).toBe(2);
    }
  });

  it("applies non-empty filters before pagination", async () => {
    const all_entities = [
      create_test_entity("entity_1", "Alpha"),
      create_test_entity("entity_2", "Bravo"),
    ];
    const table = {
      toArray: vi.fn().mockResolvedValue(all_entities),
    } as never;
    const apply_entity_filter = vi.fn(
      (entities: TestEntity[], filter: TestFilter): TestEntity[] =>
        entities.filter((entity) => entity.name === filter.name),
    );

    const result = await find_all_entities(
      table,
      { name: "Bravo" },
      apply_entity_filter,
      { page_number: 1, page_size: 10 },
    );

    expect(apply_entity_filter).toHaveBeenCalledWith(all_entities, {
      name: "Bravo",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.items).toEqual([all_entities[1]]);
      expect(result.data.total_count).toBe(1);
    }
  });
});
