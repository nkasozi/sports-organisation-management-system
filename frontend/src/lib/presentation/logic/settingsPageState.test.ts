import { describe, expect, it } from "vitest";

import type { Organization } from "$lib/core/entities/Organization";
import type { OrganizationSettings } from "$lib/core/entities/OrganizationSettings";
import type { ScalarInput } from "$lib/core/types/DomainScalars";
import type { BrandingConfig } from "$lib/presentation/stores/branding";
import type { ThemeConfig } from "$lib/presentation/stores/theme";

import {
  add_social_media_link,
  apply_organization_settings_form_values,
  create_settings_form_values,
  get_default_selected_organization_id,
  is_allowed_sync_interval,
  remove_social_media_link,
  update_social_media_platform,
  update_social_media_url,
} from "./settingsPageState";

function create_test_branding_config(
  overrides: Partial<BrandingConfig>,
): BrandingConfig {
  return {
    organization_name: overrides.organization_name ?? "Platform Name",
    organization_logo_url: overrides.organization_logo_url ?? "",
    organization_tagline: overrides.organization_tagline ?? "Welcome",
    organization_email: overrides.organization_email ?? "info@example.com",
    organization_address: overrides.organization_address ?? "123 Arena Street",
    social_media_links: overrides.social_media_links ?? [],
    header_footer_style: overrides.header_footer_style ?? "pattern",
    header_pattern: overrides.header_pattern ?? "pattern",
    footer_pattern: overrides.footer_pattern ?? "solid_color",
    background_pattern_url:
      overrides.background_pattern_url ?? "/african-mosaic-bg.svg",
    show_panel_borders: overrides.show_panel_borders ?? false,
  } as BrandingConfig;
}

function create_test_theme_config(
  overrides: Partial<ThemeConfig>,
): ThemeConfig {
  return {
    mode: overrides.mode ?? "dark",
    primary_color: overrides.primary_color ?? "red",
    secondary_color: overrides.secondary_color ?? "blue",
  } as ThemeConfig;
}

function create_test_organization(
  overrides: Partial<ScalarInput<Organization>>,
): Organization {
  return {
    id: overrides.id ?? "organization_1",
    created_at: overrides.created_at ?? "2024-01-01T00:00:00.000Z",
    updated_at: overrides.updated_at ?? "2024-01-01T00:00:00.000Z",
    name: overrides.name ?? "Premier League",
    description: overrides.description ?? "",
    sport_id: overrides.sport_id ?? "sport_1",
    founded_date: overrides.founded_date ?? "",
    contact_email: overrides.contact_email ?? "info@example.com",
    contact_phone: overrides.contact_phone ?? "",
    address: overrides.address ?? "Arena Road",
    website: overrides.website ?? "",
    status: overrides.status ?? "active",
  } as Organization;
}

function create_test_organization_settings(
  overrides: Partial<ScalarInput<OrganizationSettings>>,
): OrganizationSettings {
  return {
    id: overrides.id ?? "settings_1",
    created_at: overrides.created_at ?? "2024-01-01T00:00:00.000Z",
    updated_at: overrides.updated_at ?? "2024-01-01T00:00:00.000Z",
    organization_id: overrides.organization_id ?? "organization_1",
    display_name: overrides.display_name ?? "League Office",
    logo_url: overrides.logo_url ?? "https://example.com/logo.png",
    tagline: overrides.tagline ?? "Competition first",
    contact_email: overrides.contact_email ?? "office@example.com",
    contact_address: overrides.contact_address ?? "1 Stadium Way",
    social_media_links: overrides.social_media_links ?? [
      { platform: "twitter", url: "https://x.com/league" },
    ],
    header_pattern: overrides.header_pattern ?? "pattern",
    footer_pattern: overrides.footer_pattern ?? "solid_color",
    background_pattern_url:
      overrides.background_pattern_url ?? "/custom-pattern.svg",
    show_panel_borders: overrides.show_panel_borders ?? true,
    primary_color: overrides.primary_color ?? "emerald",
    secondary_color: overrides.secondary_color ?? "purple",
    sync_interval_ms: overrides.sync_interval_ms ?? 900_000,
  } as OrganizationSettings;
}

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

describe("settings social media helpers", () => {
  it("adds the next available social platform", () => {
    const result = add_social_media_link([
      { platform: "twitter", url: "https://x.com/league" },
    ]);

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    expect(result.data).toEqual([
      { platform: "twitter", url: "https://x.com/league" },
      { platform: "facebook", url: "" },
    ]);
  });

  it("rejects duplicate social platform changes", () => {
    const result = update_social_media_platform(
      [
        { platform: "twitter", url: "https://x.com/league" },
        { platform: "facebook", url: "https://facebook.com/league" },
      ],
      "twitter",
      "facebook",
    );

    expect(result).toEqual({
      success: false,
      error_message: "This platform is already added",
    });
  });

  it("updates and removes social links", () => {
    const updated_links = update_social_media_url(
      [{ platform: "twitter", url: "" }],
      "twitter",
      "https://x.com/league",
    );

    expect(updated_links).toEqual([
      { platform: "twitter", url: "https://x.com/league" },
    ]);

    expect(remove_social_media_link(updated_links, "twitter")).toEqual([]);
  });
});

describe("settings sync interval helpers", () => {
  it("accepts only allowed sync intervals", () => {
    expect(is_allowed_sync_interval(600_000)).toBe(true);
    expect(is_allowed_sync_interval(123_456)).toBe(false);
  });
});
