import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  build_crud_handlers_for_entity_type,
  build_form_view_callbacks,
  build_list_view_callbacks,
  build_page_title_for_current_view,
  compute_effective_disabled_functionalities,
  get_disabled_crud_actions_for_profile,
  normalize_entity_type,
} from "./entityCrudWrapperLogic";

const {
  check_entity_permission_mock,
  get_entity_data_category_mock,
  get_entity_level_disabled_operations_mock,
  get_use_cases_for_entity_type_mock,
  normalize_to_entity_type_mock,
} = vi.hoisted(() => ({
  check_entity_permission_mock: vi.fn(),
  get_entity_data_category_mock: vi.fn(),
  get_entity_level_disabled_operations_mock: vi.fn(),
  get_use_cases_for_entity_type_mock: vi.fn(),
  normalize_to_entity_type_mock: vi.fn(),
}));

vi.mock("$lib/core/interfaces/ports", () => ({
  check_entity_permission: check_entity_permission_mock,
  get_entity_data_category: get_entity_data_category_mock,
  get_entity_level_disabled_operations:
    get_entity_level_disabled_operations_mock,
  normalize_to_entity_type: normalize_to_entity_type_mock,
}));

vi.mock("../../infrastructure/registry/entityUseCasesRegistry", () => ({
  get_use_cases_for_entity_type: get_use_cases_for_entity_type_mock,
}));

describe("entityCrudWrapperLogic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    normalize_to_entity_type_mock.mockImplementation((value: string) =>
      value.toLowerCase(),
    );
    get_entity_data_category_mock.mockReturnValue("organisation_level");
    get_entity_level_disabled_operations_mock.mockReturnValue(["edit"]);
  });

  it("disables all crud actions when no profile is available", () => {
    expect(
      get_disabled_crud_actions_for_profile("team", { status: "missing" }),
    ).toEqual(["create", "edit", "delete"]);
  });

  it("combines permission-based and explicit disabled functionalities", () => {
    check_entity_permission_mock.mockImplementation(
      (_role: string, _entity_type: string, action: string) =>
        action === "update",
    );

    expect(
      get_disabled_crud_actions_for_profile("team", {
        status: "present",
        profile: {
          role: "org_admin",
        } as never,
      }),
    ).toEqual(["create", "delete", "edit"]);

    expect(
      compute_effective_disabled_functionalities(
        ["delete"],
        ["edit", "delete"],
        "team",
      ),
    ).toEqual(["delete", "edit"]);
  });

  it("normalizes entity types and builds page titles for each view", () => {
    expect(normalize_entity_type(" Team Profile ")).toBe("teamprofile");
    expect(build_page_title_for_current_view("create", "team_staff_role")).toBe(
      "Create New Team Staff Role",
    );
    expect(build_page_title_for_current_view("edit", "TeamProfile")).toBe(
      "Edit Team Profile",
    );
    expect(build_page_title_for_current_view("list", "team")).toBe(
      "Team Management",
    );
  });

  it("builds crud handlers around resolved use cases and merges list filters", async () => {
    get_use_cases_for_entity_type_mock.mockReturnValue({
      success: true,
      data: {
        create: vi.fn().mockResolvedValue({ success: true }),
        update: vi.fn().mockResolvedValue({ success: true }),
        delete: vi.fn().mockResolvedValue({ success: true }),
        list: vi.fn().mockResolvedValue({ success: true, data: [] }),
        get_by_id: vi
          .fn()
          .mockResolvedValue({ success: true, data: { id: "team_1" } }),
      },
    });

    const handlers = build_crud_handlers_for_entity_type("team", {
      organization_id: "org_1",
    });

    expect(handlers).not.toBeNull();
    if (!handlers?.list) {
      throw new Error("Expected list handler");
    }

    await handlers.list(
      { status: "active" },
      { page_number: 2, page_size: 10 },
    );
    expect(get_use_cases_for_entity_type_mock().data.list).toHaveBeenCalledWith(
      { organization_id: "org_1", status: "active" },
      { page_number: 2, page_size: 10 },
    );
  });

  it("returns an empty handler object when no use case registry entry exists", () => {
    get_use_cases_for_entity_type_mock.mockReturnValue({
      success: false,
    });

    expect(build_crud_handlers_for_entity_type("team", {})).toEqual({});
  });

  it("builds list and form view callbacks based on disabled actions", () => {
    const handle_create_requested = vi.fn();
    const handle_edit_requested = vi.fn();
    const handle_entity_deleted = vi.fn();
    const list_callbacks = build_list_view_callbacks(["delete"], "team", {
      handle_create_requested,
      handle_edit_requested,
      handle_entity_deleted,
    });

    expect(list_callbacks.on_create_requested).toBe(handle_create_requested);
    expect(list_callbacks.on_edit_requested).toBe(handle_edit_requested);
    expect(list_callbacks.on_delete_completed).toBeUndefined();

    const form_callbacks = build_form_view_callbacks({
      handle_save_completed: vi.fn(),
      handle_form_cancelled: vi.fn(),
    });
    expect(form_callbacks.on_save_completed).toBeTypeOf("function");
    expect(form_callbacks.on_cancel).toBeTypeOf("function");
  });
});
