import { get, writable } from "svelte/store";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { create_dynamic_entity_list_controller_crud_actions } from "./dynamicEntityListControllerRuntimeCrud";
import {
  create_entity,
  create_options,
  create_state,
} from "./dynamicEntityListControllerRuntimeCrud.test_support";
import type { DynamicEntityListViewState } from "./dynamicEntityListControllerTypes";

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

  it("opens and closes the inline form for create, edit, cancel, and save flows", async () => {
    const entity = create_entity("entity-1");
    const state_store = writable(
      create_state({
        entities: [entity],
        entities_to_delete: [],

        is_inline_form_visible: false,
        selected_entity_ids: new Set<string>(),
        show_bulk_import_modal: false,
        show_delete_confirmation: false,
      }),
    );
    const load_all_entities_for_display = vi
      .fn()
      .mockImplementation(async () => {});
    const set_state = (updates: Partial<DynamicEntityListViewState>): void =>
      state_store.update((state) => ({ ...state, ...updates }));
    const options = create_options();
    const actions = create_dynamic_entity_list_controller_crud_actions({
      get_options: () => options,
      load_all_entities_for_display,
      set_state,
      state_store,
    });

    get_dynamic_entity_list_create_state_mock.mockReturnValueOnce({
      inline_form_entity: { id: "draft" },
      show_inline_form: true,
    });
    get_dynamic_entity_list_edit_state_mock.mockReturnValueOnce({
      inline_form_entity: { id: "entity-1" },
      show_inline_form: true,
    });
    get_dynamic_entity_list_inline_cancel_state_mock
      .mockReturnValueOnce({
        show_inline_form: false,
      })
      .mockReturnValueOnce({
        show_inline_form: false,
      });

    expect(actions.handle_create_new_entity()).toBe(true);
    expect(get(state_store).inline_form_entity).toEqual({ id: "draft" });
    expect(actions.handle_edit_entity(entity)).toBe(true);
    expect(get(state_store).inline_form_entity).toEqual({ id: "entity-1" });
    expect(actions.handle_inline_form_cancel()).toBe(true);
    expect(get(state_store).is_inline_form_visible).toBe(false);
    await expect(actions.handle_inline_form_save()).resolves.toBe(true);
    expect(load_all_entities_for_display).toHaveBeenCalledOnce();
  });

  it("opens and closes the bulk import modal and reloads data on close", async () => {
    const state_store = writable(
      create_state({ show_bulk_import_modal: false }),
    );
    const load_all_entities_for_display = vi
      .fn()
      .mockImplementation(async () => {});
    const set_state = (updates: Partial<DynamicEntityListViewState>): void =>
      state_store.update((state) => ({ ...state, ...updates }));
    const options = create_options();
    const actions = create_dynamic_entity_list_controller_crud_actions({
      get_options: () => options,
      load_all_entities_for_display,
      set_state,
      state_store,
    });

    actions.open_bulk_import();
    expect(get(state_store).show_bulk_import_modal).toBe(true);
    await actions.close_bulk_import();
    expect(get(state_store).show_bulk_import_modal).toBe(false);
    expect(load_all_entities_for_display).toHaveBeenCalledOnce();
  });
});
