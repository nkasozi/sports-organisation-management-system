import { beforeEach, describe, expect, it, vi } from "vitest";

import { create_settings_page_shell_controller_runtime } from "./settingsPageShellControllerRuntime";
import {
  create_command,
  EXPECTED_SAVED_BRANDING_VALUES,
} from "./settingsPageShellControllerRuntime.test_support";

const {
  apply_organization_settings_form_values_mock,
  branding_store_set_mock,
  create_settings_form_values_mock,
  ensure_auth_profile_mock,
  ensure_route_access_mock,
  get_default_selected_organization_id_mock,
  get_use_cases_container_mock,
} = vi.hoisted(() => ({
  apply_organization_settings_form_values_mock: vi.fn(),
  branding_store_set_mock: vi.fn(),
  create_settings_form_values_mock: vi.fn(),
  ensure_auth_profile_mock: vi.fn(),
  ensure_route_access_mock: vi.fn(),
  get_default_selected_organization_id_mock: vi.fn(),
  get_use_cases_container_mock: vi.fn(),
}));

vi.mock("$lib/infrastructure/container", () => ({
  get_use_cases_container: get_use_cases_container_mock,
}));

vi.mock("$lib/presentation/stores/branding", () => ({
  branding_store: { set: branding_store_set_mock },
}));

vi.mock("./authGuard", () => ({
  ensure_auth_profile: ensure_auth_profile_mock,
  ensure_route_access: ensure_route_access_mock,
}));

vi.mock("./settingsPageState", () => ({
  apply_organization_settings_form_values:
    apply_organization_settings_form_values_mock,
  create_settings_form_values: create_settings_form_values_mock,
  get_default_selected_organization_id:
    get_default_selected_organization_id_mock,
}));

describe("settingsPageShellControllerRuntime actions", () => {
  beforeEach(() => {
    apply_organization_settings_form_values_mock.mockReset();
    branding_store_set_mock.mockReset();
    create_settings_form_values_mock.mockReset();
    ensure_auth_profile_mock.mockReset();
    ensure_route_access_mock.mockReset();
    get_default_selected_organization_id_mock.mockReset();
    get_use_cases_container_mock.mockReset();
  });

  it("switches organizations through the selected organization handler and updates the logo URL", async () => {
    const { command } = create_command();
    get_use_cases_container_mock.mockReturnValue({
      organization_settings_use_cases: {
        get_by_organization_id: vi
          .fn()
          .mockResolvedValueOnce({ success: false }),
      },
      organization_use_cases: { list: vi.fn() },
    });
    apply_organization_settings_form_values_mock.mockReturnValueOnce({
      form: "switched",
    });
    const runtime = create_settings_page_shell_controller_runtime(
      command as never,
    );

    await runtime.handle_selected_organization_switch();
    runtime.handle_logo_change({ detail: { url: "/new-logo.svg" } } as never);

    expect(apply_organization_settings_form_values_mock).toHaveBeenCalledWith(
      expect.objectContaining({ organization_name: "Org One" }),
      {
        status: "present",
        organization: { id: "organization-1", name: "Org One" },
      },
      { status: "missing" },
    );
    expect(command.apply_form_values).toHaveBeenCalledWith({
      form: "switched",
    });
    expect(command.update_logo_url).toHaveBeenCalledWith("/new-logo.svg");
  });

  it("saves organization branding values and shows a success toast", async () => {
    const { command } = create_command();
    get_use_cases_container_mock.mockReturnValue({
      organization_settings_use_cases: { get_by_organization_id: vi.fn() },
      organization_use_cases: { list: vi.fn() },
    });

    await create_settings_page_shell_controller_runtime(
      command as never,
    ).handle_save_organization_settings();

    expect(branding_store_set_mock).toHaveBeenCalledWith(
      EXPECTED_SAVED_BRANDING_VALUES,
    );
    expect(command.show_toast).toHaveBeenCalledWith(
      "Organization settings saved",
      "success",
    );
  });
});
