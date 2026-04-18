import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  build_dynamic_entity_list_sub_entity_defaults,
  delete_dynamic_entity_list_entities,
} from "./dynamicEntityListMutations";

const { get_use_cases_for_entity_type_mock } = vi.hoisted(() => ({
  get_use_cases_for_entity_type_mock: vi.fn(),
}));

vi.mock("$lib/infrastructure/registry/entityUseCasesRegistry", () => ({
  get_use_cases_for_entity_type: get_use_cases_for_entity_type_mock,
}));

describe("dynamicEntityListMutations", () => {
  beforeEach(() => {
    get_use_cases_for_entity_type_mock.mockReset();
  });

  it("builds sub-entity defaults with foreign key and holder type values", () => {
    expect(build_dynamic_entity_list_sub_entity_defaults(void 0)).toEqual({
      id: "",
    });
    expect(
      build_dynamic_entity_list_sub_entity_defaults({
        foreign_key_field: "competition_id",
        foreign_key_value: "competition-1",
        holder_type_field: "holder_type",
        holder_type_value: "team",
      } as never),
    ).toEqual({
      competition_id: "competition-1",
      holder_type: "team",
      id: "",
    });
  });

  it("deletes entities with custom handlers and removes them from the current list", async () => {
    const delete_handler = vi
      .fn()
      .mockResolvedValueOnce({ success: true })
      .mockResolvedValueOnce({ success: true });
    const entities = [
      { id: "entity-1" },
      { id: "entity-2" },
      { id: "entity-3" },
    ];

    await expect(
      delete_dynamic_entity_list_entities({
        crud_handlers: { delete: delete_handler } as never,
        entities: entities as never,
        entities_to_delete: [entities[0], entities[2]] as never,
        entity_type: "team",
      }),
    ).resolves.toEqual({
      deleted_entities: [entities[0], entities[2]],
      entities: [entities[1]],
      error_message: "",
      success: true,
    });
    expect(delete_handler).toHaveBeenNthCalledWith(1, "entity-1");
    expect(delete_handler).toHaveBeenNthCalledWith(2, "entity-3");
  });

  it("returns the first custom delete failure without mutating the list", async () => {
    const entities = [{ id: "entity-1" }, { id: "entity-2" }];

    await expect(
      delete_dynamic_entity_list_entities({
        crud_handlers: {
          delete: vi.fn().mockResolvedValueOnce({
            success: false,
            error: "Delete failed",
          }),
        } as never,
        entities: entities as never,
        entities_to_delete: [entities[0]] as never,
        entity_type: "team",
      }),
    ).resolves.toEqual({
      deleted_entities: [],
      entities,
      error_message: "Delete failed",
      success: false,
    });
  });

  it("uses bulk delete use cases when no custom handler is present", async () => {
    const delete_multiple = vi.fn().mockResolvedValueOnce({ success: true });
    const entities = [
      { id: "entity-1" },
      { id: "entity-2" },
      { id: "entity-3" },
    ];

    get_use_cases_for_entity_type_mock.mockReturnValueOnce({
      success: true,
      data: { delete: vi.fn(), delete_multiple },
    });

    await expect(
      delete_dynamic_entity_list_entities({
        crud_handlers: void 0,
        entities: entities as never,
        entities_to_delete: [entities[0], entities[1]] as never,
        entity_type: "team",
      }),
    ).resolves.toEqual({
      deleted_entities: [entities[0], entities[1]],
      entities: [entities[2]],
      error_message: "",
      success: true,
    });
    expect(delete_multiple).toHaveBeenCalledWith(["entity-1", "entity-2"]);
  });

  it("reports missing use cases for default deletions", async () => {
    const entities = [{ id: "entity-1" }];

    get_use_cases_for_entity_type_mock.mockReturnValueOnce({ success: false });

    await expect(
      delete_dynamic_entity_list_entities({
        crud_handlers: void 0,
        entities: entities as never,
        entities_to_delete: entities as never,
        entity_type: "team",
      }),
    ).resolves.toEqual({
      deleted_entities: [],
      entities,
      error_message: "No use cases found for entity type: team",
      success: false,
    });
  });
});
