import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  SETTINGS_PAGE_EVENT,
  SETTINGS_PAGE_MESSAGE,
} from "./settingsPageMessages";
import { create_settings_page_shell_controller_runtime } from "./settingsPageShellControllerRuntime";
import { TOAST_KIND } from "./toastConfig";

const {
  apply_organization_settings_form_values_mock,
  ensure_auth_profile_mock,
  ensure_route_access_mock,
  get_use_cases_container_mock,
} = vi.hoisted(() => ({
  apply_organization_settings_form_values_mock: vi.fn(),
  ensure_auth_profile_mock: vi.fn(),
  ensure_route_access_mock: vi.fn(),
  get_use_cases_container_mock: vi.fn(),
}));

vi.mock("$lib/infrastructure/container", () => ({
  get_use_cases_container: get_use_cases_container_mock,
}));

vi.mock("$lib/presentation/stores/branding", () => ({
  branding_store: { set: vi.fn() },
}));

vi.mock("./authGuard", () => ({
  ensure_auth_profile: ensure_auth_profile_mock,
  ensure_route_access: ensure_route_access_mock,
}));

vi.mock("./settingsPageState", () => ({
  apply_organization_settings_form_values:
    apply_organization_settings_form_values_mock,
  create_settings_form_values: vi.fn(() => ({ form: "base" })),
  get_default_selected_organization_id: vi.fn(() => "organization-1"),
}));

function create_command(): Record<string, unknown> {
  return {
    apply_form_values: vi.fn(),
    get_branding_state: () => ({}),
    get_current_form_values: () => ({ form: "current" }),
    get_current_profile_organization_id: () => "organization-1",
    get_pathname: () => "/settings",
    get_selected_organization_id: () => "",
    get_theme_state: () => ({}),
    get_organizations: () => [{ id: "organization-1", name: "Org One" }],
    is_browser: true,
    set_error_message: vi.fn(),
    set_is_loading: vi.fn(),
    set_organizations: vi.fn(),
    set_selected_organization_id: vi.fn(),
    show_toast: vi.fn(),
    update_logo_url: vi.fn(),
  };
}

describe("settingsPageShellControllerRuntime organization flows", () => {
  beforeEach(() => {
    apply_organization_settings_form_values_mock.mockReset();
    ensure_auth_profile_mock.mockReset();
    ensure_route_access_mock.mockReset();
  });

  it("clears organization settings without a lookup when switching to no organization", async () => {
    const get_by_organization_id = vi.fn();
    get_use_cases_container_mock.mockReturnValue({
      organization_settings_use_cases: { get_by_organization_id },
    });
    apply_organization_settings_form_values_mock.mockReturnValueOnce({
      form: "cleared",
    });
    const command = create_command();

    await expect(
      create_settings_page_shell_controller_runtime(
        command as never,
      ).handle_org_switch(""),
    ).resolves.toBe(true);

    expect(get_by_organization_id).not.toHaveBeenCalled();
    expect(apply_organization_settings_form_values_mock).toHaveBeenCalledWith(
      { form: "current" },
      { status: "missing" },
      { status: "missing" },
    );
    expect(command.apply_form_values).toHaveBeenCalledWith({ form: "cleared" });
  });

  it("finishes loading without selecting an organization when none are listed", async () => {
    get_use_cases_container_mock.mockReturnValue({
      organization_use_cases: {
        list: vi.fn().mockResolvedValue({ success: true, data: { items: [] } }),
      },
    });
    ensure_route_access_mock.mockResolvedValueOnce(true);
    ensure_auth_profile_mock.mockResolvedValueOnce({ success: true });
    const command = create_command();

    await create_settings_page_shell_controller_runtime(
      command as never,
    ).initialize_page();

    expect(command.set_organizations).not.toHaveBeenCalled();
    expect(command.set_selected_organization_id).not.toHaveBeenCalled();
    expect(command.set_is_loading).toHaveBeenCalledWith(false);
  });

  it("shows a friendly toast and logs when organizations cannot be listed", async () => {
    const error_spy = vi.spyOn(console, "error").mockImplementation(() => {});
    get_use_cases_container_mock.mockReturnValue({
      organization_use_cases: {
        list: vi
          .fn()
          .mockResolvedValue({ success: false, error: "db connection lost" }),
      },
    });
    ensure_route_access_mock.mockResolvedValueOnce(true);
    ensure_auth_profile_mock.mockResolvedValueOnce({ success: true });
    const command = create_command();

    await create_settings_page_shell_controller_runtime(
      command as never,
    ).initialize_page();

    expect(command.show_toast).toHaveBeenCalledWith(
      SETTINGS_PAGE_MESSAGE.ORGANIZATIONS_LOAD_FAILED,
      TOAST_KIND.ERROR,
    );
    expect(error_spy).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        event: SETTINGS_PAGE_EVENT.ORGANIZATIONS_LOAD_FAILED,
      }),
    );
    expect(command.set_organizations).not.toHaveBeenCalled();
    expect(command.set_is_loading).toHaveBeenCalledWith(false);
    error_spy.mockRestore();
  });
});
