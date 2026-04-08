import { beforeEach, describe, expect, it, vi } from "vitest";

import type { BaseEntity } from "$lib/core/entities/BaseEntity";

const {
  build_dynamic_entity_list_sub_entity_defaults_mock,
  delete_dynamic_entity_list_entities_mock,
} = vi.hoisted(() => ({
  build_dynamic_entity_list_sub_entity_defaults_mock: vi.fn(),
  delete_dynamic_entity_list_entities_mock: vi.fn(),
}));

vi.mock("./dynamicEntityListMutations", () => ({
  build_dynamic_entity_list_sub_entity_defaults:
    build_dynamic_entity_list_sub_entity_defaults_mock,
  delete_dynamic_entity_list_entities: delete_dynamic_entity_list_entities_mock,
}));

import {
  confirm_dynamic_entity_list_deletion,
  get_dynamic_entity_list_bulk_delete_state,
  get_dynamic_entity_list_create_state,
  get_dynamic_entity_list_edit_state,
  get_dynamic_entity_list_inline_cancel_state,
  get_dynamic_entity_list_single_delete_state,
} from "./dynamicEntityListControllerCrud";

function create_entity<TExtra extends Record<string, unknown>>(
  id: string,
  extra: TExtra,
): BaseEntity & TExtra {
  return {
    id,
    created_at: "2024-01-01T00:00:00.000Z",
    updated_at: "2024-01-01T00:00:00.000Z",
    ...extra,
  };
}

describe("dynamicEntityListControllerCrud", () => {
  beforeEach(() => {
    build_dynamic_entity_list_sub_entity_defaults_mock.mockReset();
    delete_dynamic_entity_list_entities_mock.mockReset();
  });

  it("delegates create and edit requests to view callbacks when inline forms are unavailable", () => {
    const on_create_requested = vi.fn();
    const on_edit_requested = vi.fn();
    const entity = create_entity("entity-1", { name: "Lions" });

    expect(
      get_dynamic_entity_list_create_state(null, {
        on_create_requested,
      } as never),
    ).toEqual({ inline_form_entity: null, show_inline_form: false });
    expect(
      get_dynamic_entity_list_edit_state(entity as never, null, {
        on_edit_requested,
      } as never),
    ).toEqual({ inline_form_entity: null, show_inline_form: false });
    expect(on_create_requested).toHaveBeenCalledOnce();
    expect(on_edit_requested).toHaveBeenCalledWith(entity);
  });

  it("builds inline create, edit, and cancel state for sub-entities", () => {
    const sub_entity_filter = {
      foreign_key_field: "team_id",
      foreign_key_value: "team-1",
    };
    const entity = create_entity("entity-2", {
      team_id: "team-1",
      name: "Rhinos",
    });

    build_dynamic_entity_list_sub_entity_defaults_mock.mockReturnValueOnce({
      id: "",
      team_id: "team-1",
    });

    expect(
      get_dynamic_entity_list_create_state(sub_entity_filter as never, null),
    ).toEqual({
      inline_form_entity: { id: "", team_id: "team-1" },
      show_inline_form: true,
    });
    expect(
      get_dynamic_entity_list_edit_state(
        entity as never,
        sub_entity_filter as never,
        null,
      ),
    ).toEqual({
      inline_form_entity: entity,
      show_inline_form: true,
    });
    expect(get_dynamic_entity_list_inline_cancel_state()).toEqual({
      inline_form_entity: null,
      show_inline_form: false,
    });
  });

  it("derives single and bulk delete selections from the current state", () => {
    const entities = [
      create_entity("entity-1", {}),
      create_entity("entity-2", {}),
      create_entity("entity-3", {}),
    ];

    expect(
      get_dynamic_entity_list_single_delete_state(entities[0] as never),
    ).toEqual([entities[0]]);
    expect(
      get_dynamic_entity_list_bulk_delete_state(
        entities as never,
        new Set(["entity-1", "entity-3"]),
      ),
    ).toEqual([entities[0], entities[2]]);
  });

  it("normalizes deletion success and failure results for controller state", async () => {
    const entity = create_entity("entity-1", {});

    delete_dynamic_entity_list_entities_mock
      .mockResolvedValueOnce({
        success: true,
        deleted_entities: [entity],
        entities: [],
        error_message: "",
      })
      .mockResolvedValueOnce({
        success: false,
        deleted_entities: [],
        entities: [entity],
        error_message: "Delete failed",
      });

    await expect(
      confirm_dynamic_entity_list_deletion({
        crud_handlers: null,
        entities: [entity],
        entities_to_delete: [entity],
        entity_type: "team",
      }),
    ).resolves.toEqual({
      deleted_entities: [entity],
      entities: [],
      error_message: "",
      success: true,
    });
    await expect(
      confirm_dynamic_entity_list_deletion({
        crud_handlers: null,
        entities: [entity],
        entities_to_delete: [entity],
        entity_type: "team",
      }),
    ).resolves.toEqual({
      deleted_entities: [],
      entities: [entity],
      error_message: "Delete failed",
      success: false,
    });
  });
});
