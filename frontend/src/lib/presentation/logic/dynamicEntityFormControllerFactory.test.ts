import { beforeEach, describe, expect, it, vi } from "vitest";

import { create_dynamic_entity_form_controller } from "./dynamicEntityFormControllerFactory";

const {
  build_dynamic_form_fake_data_state_mock,
  create_dynamic_form_field_callbacks_mock,
  load_dynamic_form_initial_state_mock,
  submit_dynamic_entity_form_mock,
} = vi.hoisted(() => ({
  build_dynamic_form_fake_data_state_mock: vi.fn(),
  create_dynamic_form_field_callbacks_mock: vi.fn(),
  load_dynamic_form_initial_state_mock: vi.fn(),
  submit_dynamic_entity_form_mock: vi.fn(),
}));

vi.mock("./dynamicEntityFormFieldCallbacks", () => ({
  create_dynamic_form_field_callbacks: create_dynamic_form_field_callbacks_mock,
}));

vi.mock("./dynamicEntityFormInitialLoad", () => ({
  load_dynamic_form_initial_state: load_dynamic_form_initial_state_mock,
}));

vi.mock("./dynamicEntityFormLocalActions", () => ({
  build_dynamic_form_fake_data_state: build_dynamic_form_fake_data_state_mock,
  navigate_to_dynamic_form_foreign_entity: vi.fn(),
}));

vi.mock("./dynamicEntityFormSubmitFlow", () => ({
  submit_dynamic_entity_form: submit_dynamic_entity_form_mock,
}));

describe("dynamicEntityFormControllerFactory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    create_dynamic_form_field_callbacks_mock.mockReturnValue({
      handle_change: vi.fn(),
    });
  });

  function create_controller_dependencies(command?: {
    is_inline_mode?: boolean;
    entity_metadata?: Record<string, unknown> | undefined;
  }) {
    let form_state = {
      form_data: { name: "Uganda" },
      validation_errors: { stale: "error" },
      filtered_fields_loading: { team_id: true },
    } as never;
    let ui_state = {
      is_loading: false,
      is_save_in_progress: false,
      save_error_message: "",
      permission_denied: false,
    } as never;
    let warning_state = { conflict: false } as never;
    const on_inline_save_success = vi.fn();
    const on_save_completed = vi.fn();
    const on_inline_cancel = vi.fn();
    const on_cancel = vi.fn();

    const controller = create_dynamic_entity_form_controller({
      entity_type: "team",
      crud_handlers: {} as never,
      is_inline_mode: command?.is_inline_mode ?? false,
      player_team_membership_use_cases: {} as never,
      get_entity_metadata: () =>
        (command?.entity_metadata ?? { fields: [] }) as never,
      get_is_edit_mode: () => false,
      get_entity_data: () => ({}) as never,
      get_form_state: () => form_state,
      set_form_state: (next_state) => {
        form_state = next_state as never;
      },
      get_ui_state: () => ui_state,
      set_ui_state: (next_state) => {
        ui_state = next_state as never;
      },
      get_warning_state: () => warning_state,
      set_warning_state: (next_state) => {
        warning_state = next_state as never;
      },
      on_inline_save_success,
      on_save_completed,
      on_inline_cancel,
      on_cancel,
      conflict_dependencies: {} as never,
      gender_dependencies: {} as never,
    });

    return {
      controller,
      get_form_state: () => form_state,
      get_ui_state: () => ui_state,
      get_warning_state: () => warning_state,
      on_inline_save_success,
      on_save_completed,
      on_inline_cancel,
      on_cancel,
    };
  }

  it("initializes options by loading form and warning state", async () => {
    load_dynamic_form_initial_state_mock.mockResolvedValue({
      form_state: { foreign_key_options: { team_id: [{ id: "team_1" }] } },
      warning_state: { conflict_warning: true },
    });
    const { controller, get_form_state, get_ui_state, get_warning_state } =
      create_controller_dependencies();

    expect(controller.callbacks).toEqual({
      handle_change: expect.any(Function),
    });
    await controller.initialize_options({ name: "Uganda" });

    expect(get_ui_state()).toMatchObject({ is_loading: false });
    expect(get_form_state()).toMatchObject({
      foreign_key_options: { team_id: [{ id: "team_1" }] },
      validation_errors: {},
      filtered_fields_loading: {},
    });
    expect(get_warning_state()).toMatchObject({ conflict_warning: true });
  });

  it("applies validation errors returned from submit", async () => {
    submit_dynamic_entity_form_mock.mockResolvedValue({
      save_error_message: "",
      validation_errors: { name: "Required" },
    });
    const { controller, get_form_state, get_ui_state, on_save_completed } =
      create_controller_dependencies();

    await controller.handle_submit();

    expect(get_ui_state()).toMatchObject({
      is_save_in_progress: false,
      save_error_message: "",
    });
    expect(get_form_state()).toMatchObject({
      validation_errors: { name: "Required" },
    });
    expect(on_save_completed).not.toHaveBeenCalled();
  });

  it("routes saved entities to the correct inline or standard callbacks", async () => {
    submit_dynamic_entity_form_mock.mockResolvedValue({
      save_error_message: "",
      validation_errors: {},
      saved_entity: { id: "team_1" },
    });
    const standard = create_controller_dependencies();
    await standard.controller.handle_submit();
    expect(standard.on_save_completed).toHaveBeenCalledWith(
      { id: "team_1" },
      true,
    );

    const inline = create_controller_dependencies({ is_inline_mode: true });
    await inline.controller.handle_submit();
    expect(inline.on_inline_save_success).toHaveBeenCalledWith({
      id: "team_1",
    });
  });

  it("cancels correctly and generates fake data through the helper", () => {
    build_dynamic_form_fake_data_state_mock.mockReturnValue({
      form_data: { name: "Generated" },
      validation_errors: {},
    });
    const standard = create_controller_dependencies();
    standard.controller.handle_cancel();
    expect(standard.on_cancel).toHaveBeenCalled();

    const inline = create_controller_dependencies({ is_inline_mode: true });
    inline.controller.handle_cancel();
    expect(inline.on_inline_cancel).toHaveBeenCalled();

    standard.controller.handle_generate_fake_data();
    expect(standard.get_form_state()).toEqual({
      form_data: { name: "Generated" },
      validation_errors: {},
    });
  });
});
