import { get } from "svelte/store";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { create_dynamic_entity_list_controller_runtime } from "./dynamicEntityListControllerRuntime";
import {
  build_dynamic_entity_list_view_state_mock,
  ensure_auth_profile_mock,
  load_dynamic_entity_list_columns_mock,
  load_dynamic_entity_list_entities_mock,
  load_dynamic_entity_list_filter_options_mock,
  reset_dynamic_entity_list_runtime_mocks,
} from "./dynamicEntityListControllerRuntime.test_support";

vi.mock("$lib/presentation/logic/authGuard", async () =>
  (
    await import("./dynamicEntityListControllerRuntime.test_support")
  ).create_auth_guard_module_mock(),
);

vi.mock(
  "$lib/presentation/logic/dynamicEntityListControllerRuntimeCrud",
  async () =>
    (
      await import("./dynamicEntityListControllerRuntime.test_support")
    ).create_runtime_crud_module_mock(),
);

vi.mock(
  "$lib/presentation/logic/dynamicEntityListControllerRuntimeView",
  async () =>
    (
      await import("./dynamicEntityListControllerRuntime.test_support")
    ).create_runtime_view_module_mock(),
);

vi.mock(
  "$lib/presentation/logic/dynamicEntityListControllerStateBuilder",
  async () =>
    (
      await import("./dynamicEntityListControllerRuntime.test_support")
    ).create_state_builder_module_mock(),
);

vi.mock("$lib/presentation/logic/dynamicEntityListData", async () =>
  (
    await import("./dynamicEntityListControllerRuntime.test_support")
  ).create_list_data_module_mock(),
);

vi.mock("$lib/presentation/stores/auth", async () =>
  (
    await import("./dynamicEntityListControllerRuntime.test_support")
  ).create_auth_store_module_mock(),
);

describe("dynamicEntityListControllerRuntime", () => {
  beforeEach(() => {
    reset_dynamic_entity_list_runtime_mocks();
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
    } as never);

    await runtime.initialize();
    expect(load_dynamic_entity_list_columns_mock).toHaveBeenCalledWith({
      entity_metadata: { fields: [{ field_name: "name" }] },
      entity_type: "team",
    });
    expect(load_dynamic_entity_list_entities_mock).toHaveBeenCalledWith({
      current_profile_state: {
        status: "present",
        profile: { organization_id: "org-1" },
      },
      display_name: "Teams",
      entity_metadata: { fields: [{ field_name: "name" }] },
      entity_type: "team",
      raw_token: "token-1",
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
    } as never);

    runtime.update_options({
      button_color_class: "secondary",
      entity_type: "player",
    } as never);
    expect(get(runtime.state_store).button_color_class).toBe("secondary");
    await runtime.load_all_entities_for_display();
    expect(load_dynamic_entity_list_entities_mock).toHaveBeenCalledWith({
      current_profile_state: {
        status: "present",
        profile: { organization_id: "org-1" },
      },
      display_name: "Teams",
      entity_metadata: { fields: [{ field_name: "name" }] },
      entity_type: "player",
      raw_token: "token-1",
    });
  });

  it("skips rebuilding state when updated options are shallow-equal", () => {
    const crud_handlers = { delete: vi.fn() };
    const runtime = create_dynamic_entity_list_controller_runtime({
      button_color_class: "primary",
      crud_handlers,
      disabled_functionalities: ["create"],
      entity_type: "team",
    } as never);
    const subscriber = vi.fn();
    const unsubscribe = runtime.state_store.subscribe(subscriber);
    const build_calls_before_update =
      build_dynamic_entity_list_view_state_mock.mock.calls.length;

    const options_changed = runtime.update_options({
      button_color_class: "primary",
      crud_handlers,
      disabled_functionalities: ["create"],
      entity_type: "team",
    } as never);
    unsubscribe();

    expect(options_changed).toBe(false);
    expect(build_dynamic_entity_list_view_state_mock.mock.calls.length).toBe(
      build_calls_before_update,
    );
    expect(subscriber).toHaveBeenCalledTimes(1);
  });
});
