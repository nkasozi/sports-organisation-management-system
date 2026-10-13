import { describe, expect, it } from "vitest";

import {
  apply_organization_settings_form_values,
  create_settings_form_values,
  get_default_selected_organization_id,
} from "./settingsPageState";
import {
  create_test_branding_config,
  create_test_organization,
  create_test_organization_settings,
  create_test_theme_config,
} from "./settingsPageState.test_support";

describe("settings form values", () => {
  it("creates settings form values from branding and theme stores", () => {
    expect(
      create_settings_form_values(
        create_test_branding_config({
          organization_name: "My League",
          show_panel_borders: true,
        }),
        create_test_theme_config({
          primary_color: "emerald",
          secondary_color: "purple",
        }),
        1_800_000,
      ),
    ).toMatchObject({
      organization_name: "My League",
      selected_primary_color: "green",
      selected_secondary_color: "purple",
      selected_sync_interval_ms: 1_800_000,
      show_panel_borders: true,
    });
  });

  it("applies organization settings on top of the current form values", () => {
    const current_values = create_settings_form_values(
      create_test_branding_config({ organization_name: "Platform Name" }),
      create_test_theme_config({}),
    );

    expect(
      apply_organization_settings_form_values(
        current_values,
        {
          status: "present",
          organization: create_test_organization({ name: "Premier League" }),
        },
        {
          status: "present",
          organization_settings: create_test_organization_settings({}),
        },
      ),
    ).toMatchObject({
      organization_name: "League Office",
      organization_logo_url: "https://example.com/logo.png",
      selected_primary_color: "red",
      selected_sync_interval_ms: 900_000,
      show_panel_borders: true,
    });
  });

  it("falls back to the selected organization name when settings are missing", () => {
    const current_values = create_settings_form_values(
      create_test_branding_config({ organization_name: "Platform Name" }),
      create_test_theme_config({}),
    );

    expect(
      apply_organization_settings_form_values(
        current_values,
        {
          status: "present",
          organization: create_test_organization({ name: "Premier League" }),
        },
        { status: "missing" },
      ).organization_name,
    ).toBe("Premier League");
  });
});

describe("settings organization selection", () => {
  it("returns the scoped organization when present", () => {
    const organizations = [
      create_test_organization({ id: "organization_1" }),
      create_test_organization({ id: "organization_2" }),
    ];

    expect(
      get_default_selected_organization_id(organizations, "organization_2"),
    ).toBe("organization_2");
  });

  it("falls back to the first organization when the scope is missing", () => {
    const organizations = [
      create_test_organization({ id: "organization_1" }),
      create_test_organization({ id: "organization_2" }),
    ];

    expect(
      get_default_selected_organization_id(organizations, "missing_org"),
    ).toBe("organization_1");
  });
});
