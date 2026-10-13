import type { Mock } from "vitest";
import { vi } from "vitest";

interface SettingsShellTestState {
  current_form_values: Record<string, unknown>;
  organizations: unknown[];
  selected_organization_id: string;
}

export const EXPECTED_SAVED_BRANDING_VALUES = {
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
};

function create_test_state(): SettingsShellTestState {
  return {
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
}

export function create_command(): {
  command: {
    apply_form_values: Mock;
    get_branding_state: () => never;
    get_current_form_values: () => never;
    get_current_profile_organization_id: () => string;
    get_pathname: () => string;
    get_selected_organization_id: () => string;
    get_theme_state: () => never;
    get_organizations: () => never;
    is_browser: boolean;
    set_error_message: Mock;
    set_is_loading: Mock;
    set_organizations: Mock;
    set_selected_organization_id: Mock;
    show_toast: Mock;
    update_logo_url: Mock;
  };
  state: SettingsShellTestState;
} {
  const state = create_test_state();
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
