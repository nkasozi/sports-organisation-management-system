import { get } from "svelte/store";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  auth_store_mock,
  build_dynamic_entity_list_view_state_mock,
  create_dynamic_entity_list_controller_crud_actions_mock,
  create_dynamic_entity_list_controller_view_actions_mock,
  ensure_auth_profile_mock,
  load_dynamic_entity_list_columns_mock,
  load_dynamic_entity_list_entities_mock,
  load_dynamic_entity_list_filter_options_mock,
} = vi.hoisted(() => {
  const create_store = (initial_value: Record<string, unknown>) => {
    let current_value = initial_value;
    const subscribers = new Set<(value: Record<string, unknown>) => void>();
    return {
      set: (next_value: Record<string, unknown>): void => {
        current_value = next_value;
        subscribers.forEach((subscriber) => subscriber(current_value));
      },
      subscribe: (subscriber: (value: Record<string, unknown>) => void) => {
        subscriber(current_value);
        subscribers.add(subscriber);
        return () => subscribers.delete(subscriber);
      },
      update: (
        updater: (value: Record<string, unknown>) => Record<string, unknown>,
      ): void => {
        current_value = updater(current_value);
        subscribers.forEach((subscriber) => subscriber(current_value));
      },
    };
  };
  return {
    auth_store_mock: create_store({
      current_profile: { organization_id: "org-1" },
      current_token: { raw_token: "token-1" },
    }),
    build_dynamic_entity_list_view_state_mock: vi.fn(),
    create_dynamic_entity_list_controller_crud_actions_mock: vi.fn(),
    create_dynamic_entity_list_controller_view_actions_mock: vi.fn(),
    ensure_auth_profile_mock: vi.fn(),
    load_dynamic_entity_list_columns_mock: vi.fn(),
    load_dynamic_entity_list_entities_mock: vi.fn(),
    load_dynamic_entity_list_filter_options_mock: vi.fn(),
  };
});

vi.mock("$lib/presentation/logic/authGuard", () => ({
  ensure_auth_profile: ensure_auth_profile_mock,
}));

vi.mock(
  "$lib/presentation/logic/dynamicEntityListControllerRuntimeCrud",
  () => ({
    create_dynamic_entity_list_controller_crud_actions:
      create_dynamic_entity_list_controller_crud_actions_mock,
  }),
);

vi.mock(
  "$lib/presentation/logic/dynamicEntityListControllerRuntimeView",
  () => ({
    create_dynamic_entity_list_controller_view_actions:
      create_dynamic_entity_list_controller_view_actions_mock,
  }),
);

vi.mock(
  "$lib/presentation/logic/dynamicEntityListControllerStateBuilder",
  () => ({
    build_dynamic_entity_list_view_state:
      build_dynamic_entity_list_view_state_mock,
  }),
);

vi.mock("$lib/presentation/logic/dynamicEntityListData", () => ({
  load_dynamic_entity_list_columns: load_dynamic_entity_list_columns_mock,
  load_dynamic_entity_list_entities: load_dynamic_entity_list_entities_mock,
  load_dynamic_entity_list_filter_options:
    load_dynamic_entity_list_filter_options_mock,
}));

vi.mock("$lib/presentation/stores/auth", () => ({
  auth_store: auth_store_mock,
}));

import { create_dynamic_entity_list_controller_runtime } from "./dynamicEntityListControllerRuntime";

describe("dynamicEntityListControllerRuntime", () => {
  beforeEach(() => {
    auth_store_mock.set({
      current_profile: { organization_id: "org-1" },
      current_token: { raw_token: "token-1" },
    });
    build_dynamic_entity_list_view_state_mock.mockReset();
    create_dynamic_entity_list_controller_crud_actions_mock.mockReset();
    create_dynamic_entity_list_controller_view_actions_mock.mockReset();
    ensure_auth_profile_mock.mockReset();
    load_dynamic_entity_list_columns_mock.mockReset();
    load_dynamic_entity_list_entities_mock.mockReset();
    load_dynamic_entity_list_filter_options_mock.mockReset();
    build_dynamic_entity_list_view_state_mock.mockImplementation(
      (
        options: Record<string, unknown>,
        current_state: Record<string, unknown>,
      ) => ({
        button_color_class: options.button_color_class,
        columns_restored_from_cache:
          current_state.columns_restored_from_cache ?? false,
        current_page: current_state.current_page ?? 1,
        display_name: current_state.display_name ?? "Teams",
        entities: current_state.entities ?? [],
        entity_metadata: current_state.entity_metadata ?? {
          fields: [{ field_name: "name" }],
        },
        entity_type: options.entity_type,
        error_message: current_state.error_message ?? "",
        foreign_key_options: current_state.foreign_key_options ?? {},
        is_loading: current_state.is_loading ?? false,
        visible_columns: current_state.visible_columns ?? new Set<string>(),
      }),
    );
    create_dynamic_entity_list_controller_crud_actions_mock.mockReturnValue({
      cancel_deletion: vi.fn(),
      close_bulk_import: vi.fn(),
      confirm_deletion_action: vi.fn(),
      handle_create_new_entity: vi.fn().mockReturnValue(true),
    });
    create_dynamic_entity_list_controller_view_actions_mock.mockReturnValue({
      clear_all_selections: vi.fn(),
      export_to_csv: vi.fn(),
      reset_filters: vi.fn(),
      toggle_sort_by_column: vi.fn(),
    });
  });

  it("initializes columns, entities, and filter options and exposes composed actions", async () => {
    const on_total_count_changed = vi.fn();

    load_dynamic_entity_list_columns_mock.mockResolvedValueOnce({
      columns_restored_from_cache: true,
      visible_columns: new Set(["name"]),
    });
    ensure_auth_profile_mock.mockResolvedValueOnce({ success: true });
    load_dynamic_entity_list_entities_mock.mockResolvedValueOnce({
      auth_profile_missing: false,
      entities: [{ id: "entity-1" }],
      error_message: "",
    });
    load_dynamic_entity_list_filter_options_mock.mockResolvedValueOnce({
      club_id: [{ id: "club-1" }],
    });

    const runtime = create_dynamic_entity_list_controller_runtime({
      button_color_class: "primary",
      entity_type: "team",
      on_total_count_changed,
      sub_entity_filter: null,
    } as never);

    await runtime.initialize();
    expect(load_dynamic_entity_list_columns_mock).toHaveBeenCalledWith({
      entity_metadata: { fields: [{ field_name: "name" }] },
      entity_type: "team",
      sub_entity_filter: null,
    });
    expect(load_dynamic_entity_list_entities_mock).toHaveBeenCalledWith({
      crud_handlers: undefined,
      current_profile: { organization_id: "org-1" },
      display_name: "Teams",
      entity_metadata: { fields: [{ field_name: "name" }] },
      entity_type: "team",
      raw_token: "token-1",
      sub_entity_filter: null,
    });
    expect(load_dynamic_entity_list_filter_options_mock).toHaveBeenCalledWith([
      { field_name: "name" },
    ]);
    expect(get(runtime.state_store)).toMatchObject({
      columns_restored_from_cache: true,
      entities: [{ id: "entity-1" }],
      foreign_key_options: { club_id: [{ id: "club-1" }] },
    });
    expect(on_total_count_changed).toHaveBeenCalledWith(1);
    expect(runtime.handle_create_new_entity()).toBe(true);
  });

  it("stops initialization when auth profile setup fails", async () => {
    load_dynamic_entity_list_columns_mock.mockResolvedValueOnce({
      columns_restored_from_cache: false,
      visible_columns: new Set(["name"]),
    });
    ensure_auth_profile_mock.mockResolvedValueOnce({
      success: false,
      error_message: "Profile required",
    });

    const runtime = create_dynamic_entity_list_controller_runtime({
      button_color_class: "primary",
      entity_type: "team",
      sub_entity_filter: null,
    } as never);

    await runtime.initialize();
    expect(load_dynamic_entity_list_entities_mock).not.toHaveBeenCalled();
    expect(load_dynamic_entity_list_filter_options_mock).not.toHaveBeenCalled();
    expect(get(runtime.state_store).error_message).toBe("Profile required");
  });

  it("rebuilds state when options change and uses updated options for later loads", async () => {
    load_dynamic_entity_list_entities_mock.mockResolvedValueOnce({
      auth_profile_missing: false,
      entities: [{ id: "entity-9" }],
      error_message: "",
    });

    const runtime = create_dynamic_entity_list_controller_runtime({
      button_color_class: "primary",
      entity_type: "team",
      sub_entity_filter: null,
    } as never);

    runtime.update_options({
      button_color_class: "secondary",
      entity_type: "player",
      sub_entity_filter: null,
    } as never);
    expect(get(runtime.state_store).button_color_class).toBe("secondary");
    await runtime.load_all_entities_for_display();
    expect(load_dynamic_entity_list_entities_mock).toHaveBeenCalledWith({
      crud_handlers: undefined,
      current_profile: { organization_id: "org-1" },
      display_name: "Teams",
      entity_metadata: { fields: [{ field_name: "name" }] },
      entity_type: "player",
      raw_token: "token-1",
      sub_entity_filter: null,
    });
  });
});
