import { get, writable } from "svelte/store";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { create_dynamic_entity_list_controller_crud_actions } from "./dynamicEntityListControllerRuntimeCrud";
import {
  create_entity,
  create_options,
  create_state,
} from "./dynamicEntityListControllerRuntimeCrud.test_support";
import type {
  DynamicEntityListControllerOptions,
  DynamicEntityListViewState,
} from "./dynamicEntityListControllerTypes";

const {
  confirm_dynamic_entity_list_deletion_mock,
  get_dynamic_entity_list_bulk_delete_state_mock,
  get_dynamic_entity_list_create_state_mock,
  get_dynamic_entity_list_edit_state_mock,
  get_dynamic_entity_list_inline_cancel_state_mock,
  get_dynamic_entity_list_single_delete_state_mock,
} = vi.hoisted(() => ({
  confirm_dynamic_entity_list_deletion_mock: vi.fn(),
  get_dynamic_entity_list_bulk_delete_state_mock: vi.fn(),
  get_dynamic_entity_list_create_state_mock: vi.fn(),
  get_dynamic_entity_list_edit_state_mock: vi.fn(),
  get_dynamic_entity_list_inline_cancel_state_mock: vi.fn(),
  get_dynamic_entity_list_single_delete_state_mock: vi.fn(),
}));

vi.mock("$lib/presentation/logic/dynamicEntityListControllerCrud", () => ({
  confirm_dynamic_entity_list_deletion:
    confirm_dynamic_entity_list_deletion_mock,
  get_dynamic_entity_list_bulk_delete_state:
    get_dynamic_entity_list_bulk_delete_state_mock,
  get_dynamic_entity_list_create_state:
    get_dynamic_entity_list_create_state_mock,
  get_dynamic_entity_list_edit_state: get_dynamic_entity_list_edit_state_mock,
  get_dynamic_entity_list_inline_cancel_state:
    get_dynamic_entity_list_inline_cancel_state_mock,
  get_dynamic_entity_list_single_delete_state:
    get_dynamic_entity_list_single_delete_state_mock,
}));

describe("dynamicEntityListControllerRuntimeCrud", () => {
  beforeEach(() => {
    confirm_dynamic_entity_list_deletion_mock.mockReset();
    get_dynamic_entity_list_bulk_delete_state_mock.mockReset();
    get_dynamic_entity_list_create_state_mock.mockReset();
    get_dynamic_entity_list_edit_state_mock.mockReset();
    get_dynamic_entity_list_inline_cancel_state_mock.mockReset();
    get_dynamic_entity_list_single_delete_state_mock.mockReset();
  });

  it("stages single and bulk deletion confirmation state", () => {
    const entities = [create_entity("entity-1"), create_entity("entity-2")];
    const state_store = writable(
      create_state({
        entities,
        entities_to_delete: [],
        selected_entity_ids: new Set(["entity-2"]),
        show_delete_confirmation: false,
      }),
    );
    const set_state = (updates: Partial<DynamicEntityListViewState>): void =>
      state_store.update((state) => ({ ...state, ...updates }));
    const options = create_options();
    const actions = create_dynamic_entity_list_controller_crud_actions({
      get_options: () => options,
      load_all_entities_for_display: vi.fn(),
      set_state,
      state_store,
    });

    get_dynamic_entity_list_single_delete_state_mock.mockReturnValueOnce([
      entities[0],
    ]);
    get_dynamic_entity_list_bulk_delete_state_mock.mockReturnValueOnce([
      entities[1],
    ]);

    expect(actions.handle_delete_single_entity(entities[0])).toBe(true);
    expect(get(state_store).entities_to_delete).toEqual([entities[0]]);
    expect(actions.handle_delete_multiple_entities()).toBe(true);
    expect(get(state_store).entities_to_delete).toEqual([entities[1]]);
    expect(get(state_store).show_delete_confirmation).toBe(true);
  });

  it("confirms deletions and invokes single or bulk completion callbacks", async () => {
    const deleted_entity = create_entity("entity-1");
    const batch_deleted_entities = [
      create_entity("entity-2"),
      create_entity("entity-3"),
    ];
    const on_delete_completed = vi.fn();
    const on_entities_batch_deleted = vi.fn();
    const state_store = writable(
      create_state({
        current_page: 3,
        entities: [deleted_entity, ...batch_deleted_entities],
        entities_to_delete: [deleted_entity],
        error_message: "",
        is_deleting: false,
        selected_entity_ids: new Set(["entity-1"]),
        show_delete_confirmation: true,
      }),
    );
    const set_state = (updates: Partial<DynamicEntityListViewState>): void =>
      state_store.update((state) => ({ ...state, ...updates }));
    const options = create_options({
      on_entities_batch_deleted,
      view_callbacks: {
        on_delete_completed,
      } as DynamicEntityListControllerOptions["view_callbacks"],
    });
    const actions = create_dynamic_entity_list_controller_crud_actions({
      get_options: () => options,
      load_all_entities_for_display: vi.fn(),
      set_state,
      state_store,
    });

    confirm_dynamic_entity_list_deletion_mock
      .mockResolvedValueOnce({
        deleted_entities: [deleted_entity],
        entities: batch_deleted_entities,
        error_message: "",
        success: true,
      })
      .mockResolvedValueOnce({
        deleted_entities: batch_deleted_entities,
        entities: [],
        error_message: "",
        success: true,
      });

    await actions.confirm_deletion_action();
    expect(on_delete_completed).toHaveBeenCalledWith(deleted_entity);
    expect(get(state_store)).toMatchObject({
      current_page: 1,
      entities: batch_deleted_entities,
      is_deleting: false,
      show_delete_confirmation: false,
    });
    set_state({
      entities: batch_deleted_entities,
      entities_to_delete: batch_deleted_entities,
      selected_entity_ids: new Set(["entity-2", "entity-3"]),
      show_delete_confirmation: true,
    });
    await actions.confirm_deletion_action();
    expect(on_entities_batch_deleted).toHaveBeenCalledWith(
      batch_deleted_entities,
    );
    expect(get(state_store).entities).toEqual([]);
  });
});
