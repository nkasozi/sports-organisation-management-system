import { beforeEach, describe, expect, it, vi } from "vitest";

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

import { create_settings_page_shell_controller_runtime } from "./settingsPageShellControllerRuntime";

describe("settingsPageShellControllerRuntime", () => {
  function create_command() {
    const state = {
      current_form_values: {
        organization_name: "Org One",
        organization_logo_url: "/logo.svg",
        organization_tagline: "Tagline",
        organization_email: "org@example.com",
        organization_address: "Address",
        social_media_links: [],
        header_pattern: "dots",
        footer_pattern: "waves",
        background_pattern_url: "/pattern.svg",
        show_panel_borders: true,
      },
      organizations: [{ id: "organization-1", name: "Org One" }],
      selected_organization_id: "organization-1",
    };

    const command = {
      apply_form_values: vi.fn((value: unknown) => {
        state.current_form_values = value as never;
      }),
      get_branding_state: () => ({ brand: "default" }) as never,
      get_current_form_values: () => state.current_form_values as never,
      get_current_profile_organization_id: () => "organization-1",
      get_pathname: () => "/settings",
      get_selected_organization_id: () => state.selected_organization_id,
      get_theme_state: () => ({ theme: "light" }) as never,
      get_organizations: () => state.organizations as never,
      is_browser: true,
      set_error_message: vi.fn(),
      set_is_loading: vi.fn(),
      set_organizations: vi.fn((value: unknown[]) => {
        state.organizations = value as never;
      }),
      set_selected_organization_id: vi.fn((value: string) => {
        state.selected_organization_id = value;
      }),
      show_toast: vi.fn(),
      update_logo_url: vi.fn(),
    };

    return { command, state };
  }

  beforeEach(() => {
    apply_organization_settings_form_values_mock.mockReset();
    branding_store_set_mock.mockReset();
    create_settings_form_values_mock.mockReset();
    ensure_auth_profile_mock.mockReset();
    ensure_route_access_mock.mockReset();
    get_default_selected_organization_id_mock.mockReset();
    get_use_cases_container_mock.mockReset();
  });

  it("skips initialization when not in the browser or when route access/auth fails", async () => {
    const non_browser_case = create_command();
    await create_settings_page_shell_controller_runtime({
      ...non_browser_case.command,
      is_browser: false,
    } as never).initialize_page();
    expect(non_browser_case.command.apply_form_values).not.toHaveBeenCalled();

    const auth_failed_case = create_command();
    ensure_route_access_mock.mockResolvedValueOnce(true);
    ensure_auth_profile_mock.mockResolvedValueOnce({
      success: false,
      error_message: "Access denied",
    });
    get_use_cases_container_mock.mockReturnValue({
      organization_settings_use_cases: { get_by_organization_id: vi.fn() },
      organization_use_cases: { list: vi.fn() },
    });

    await create_settings_page_shell_controller_runtime(
      auth_failed_case.command as never,
    ).initialize_page();
    expect(auth_failed_case.command.set_error_message).toHaveBeenCalledWith(
      "Access denied",
    );
    expect(auth_failed_case.command.set_is_loading).toHaveBeenCalledWith(false);
  });

  it("loads organizations, selects the default organization, and applies organization settings", async () => {
    const { command } = create_command();
    const get_by_organization_id = vi.fn().mockResolvedValueOnce({
      success: true,
      data: { timezone: "UTC" },
    });
    get_use_cases_container_mock.mockReturnValue({
      organization_settings_use_cases: { get_by_organization_id },
      organization_use_cases: {
        list: vi.fn().mockResolvedValueOnce({
          success: true,
          data: { items: [{ id: "organization-1", name: "Org One" }] },
        }),
      },
    });
    ensure_route_access_mock.mockResolvedValueOnce(true);
    ensure_auth_profile_mock.mockResolvedValueOnce({ success: true });
    create_settings_form_values_mock.mockReturnValueOnce({ form: "base" });
    get_default_selected_organization_id_mock.mockReturnValueOnce(
      "organization-1",
    );
    apply_organization_settings_form_values_mock.mockReturnValueOnce({
      form: "merged",
    });

    await create_settings_page_shell_controller_runtime(
      command as never,
    ).initialize_page();

    expect(command.apply_form_values).toHaveBeenCalledWith({ form: "base" });
    expect(command.set_organizations).toHaveBeenCalledWith([
      { id: "organization-1", name: "Org One" },
    ]);
    expect(command.set_selected_organization_id).toHaveBeenCalledWith(
      "organization-1",
    );
    expect(command.apply_form_values).toHaveBeenCalledWith({ form: "merged" });
    expect(command.set_is_loading).toHaveBeenCalledWith(false);
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

    expect(branding_store_set_mock).toHaveBeenCalledWith({
      organization_name: "Org One",
      organization_logo_url: "/logo.svg",
      organization_tagline: "Tagline",
      organization_email: "org@example.com",
      organization_address: "Address",
      social_media_links: [],
      header_footer_style: "pattern",
      header_pattern: "dots",
      footer_pattern: "waves",
      background_pattern_url: "/pattern.svg",
      show_panel_borders: true,
    });
    expect(command.show_toast).toHaveBeenCalledWith(
      "Organization settings saved",
      "success",
    );
  });
});
