import { get, writable } from "svelte/store";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { BaseEntity } from "$lib/core/entities/BaseEntity";

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

import { create_dynamic_entity_list_controller_crud_actions } from "./dynamicEntityListControllerRuntimeCrud";
import type {
  DynamicEntityListControllerOptions,
  DynamicEntityListViewState,
} from "./dynamicEntityListControllerTypes";

describe("dynamicEntityListControllerRuntimeCrud", () => {
  function create_entity(id: string): BaseEntity {
    return {
      id,
      created_at: "2024-01-01T00:00:00.000Z",
      updated_at: "2024-01-01T00:00:00.000Z",
    } as BaseEntity;
  }

  function create_options(
    overrides: Partial<DynamicEntityListControllerOptions> = {},
  ): DynamicEntityListControllerOptions {
    return {
      bulk_create_handler: null,
      button_color_class: "",
      crud_handlers: null,
      disabled_functionalities: [],
      enable_bulk_import: false,
      entity_type: "team",
      info_message: null,
      is_mobile_view: false,
      on_entities_batch_deleted: null,
      on_selection_changed: null,
      on_total_count_changed: null,
      show_actions: true,
      sub_entity_filter: null,
      view_callbacks: null,
      ...overrides,
    } as DynamicEntityListControllerOptions;
  }

  function create_state(
    overrides: Partial<DynamicEntityListViewState> = {},
  ): DynamicEntityListViewState {
    const entities = overrides.entities ?? [];
    const filtered_entities = overrides.filtered_entities ?? entities;
    const paginated_entities =
      overrides.paginated_entities ?? filtered_entities;
    return {
      all_selected: false,
      available_fields: [],
      button_color_class: "",
      can_show_bulk_actions: false,
      columns_restored_from_cache: false,
      crud_handlers: null,
      current_page: 1,
      display_name: "Team",
      enable_bulk_import: false,
      entities,
      entities_to_delete: [],
      entity_metadata: null,
      entity_type: "team",
      error_message: "",
      filtered_entities,
      filter_values: {},
      foreign_key_options: {},
      has_bulk_create_handler: false,
      info_message: null,
      inline_form_entity: null,
      is_create_disabled: false,
      is_delete_disabled: false,
      is_deleting: false,
      is_edit_disabled: false,
      is_inline_form_visible: false,
      is_loading: false,
      is_mobile_view: false,
      is_sub_entity_mode: false,
      items_per_page: 10,
      page_size_options: [10, 20, 50],
      paginated_entities,
      selected_entity_ids: new Set<string>(),
      show_actions: true,
      show_advanced_filter: false,
      show_bulk_import_modal: false,
      show_column_selector: false,
      show_delete_confirmation: false,
      show_export_modal: false,
      sort_column: "",
      sort_direction: "asc",
      sub_entity_filter: null,
      total_pages: 1,
      visible_column_list: [],
      visible_columns: new Set<string>(),
      ...overrides,
    } as DynamicEntityListViewState;
  }

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
        inline_form_entity: null,
        is_inline_form_visible: false,
        selected_entity_ids: new Set<string>(),
        show_bulk_import_modal: false,
        show_delete_confirmation: false,
      }),
    );
    const load_all_entities_for_display = vi.fn().mockResolvedValue(undefined);
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
        inline_form_entity: null,
        show_inline_form: false,
      })
      .mockReturnValueOnce({
        inline_form_entity: null,
        show_inline_form: false,
      });

    expect(actions.handle_create_new_entity()).toBe(true);
    expect(get(state_store).inline_form_entity).toEqual({ id: "draft" });
    expect(actions.handle_edit_entity(entity)).toBe(true);
    expect(get(state_store).inline_form_entity).toEqual({ id: "entity-1" });
    expect(actions.handle_inline_form_cancel()).toBe(true);
    expect(get(state_store).is_inline_form_visible).toBe(false);
    await expect(
      actions.handle_inline_form_save({
        detail: { entity },
      } as CustomEvent<{ entity: BaseEntity }>),
    ).resolves.toBe(true);
    expect(load_all_entities_for_display).toHaveBeenCalledOnce();
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

  it("opens and closes the bulk import modal and reloads data on close", async () => {
    const state_store = writable(
      create_state({ show_bulk_import_modal: false }),
    );
    const load_all_entities_for_display = vi.fn().mockResolvedValue(undefined);
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
