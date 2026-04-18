import { describe, expect, it } from "vitest";

import type { OrganizationSettings } from "$lib/core/entities/OrganizationSettings";

import {
  CURRENT_ORG_ID_KEY,
  DEFAULT_PLATFORM_BRANDING,
  map_branding_to_settings_input,
  map_settings_to_branding,
  PLATFORM_STORAGE_KEY,
} from "./brandingTypes";

describe("brandingTypes", () => {
  it("maps organization settings into branding config fields", () => {
    const settings = {
      id: "settings-1",
      created_at: "2024-01-01T00:00:00.000Z",
      updated_at: "2024-01-02T00:00:00.000Z",
      organization_id: "organization-1",
      display_name: "City Hawks",
      logo_url: "/hawks.svg",
      tagline: "Built for match day",
      contact_email: "info@hawks.test",
      contact_address: "1 Stadium Way",
      social_media_links: [
        { platform: "twitter", url: "https://x.test/hawks" },
      ],
      header_pattern: "pattern",
      footer_pattern: "solid_color",
      background_pattern_url: "/pattern.svg",
      show_panel_borders: true,
      primary_color: "red",
      secondary_color: "blue",
      sync_interval_ms: 600000,
    } as OrganizationSettings;

    expect(map_settings_to_branding(settings)).toEqual({
      organization_name: "City Hawks",
      organization_logo_url: "/hawks.svg",
      organization_tagline: "Built for match day",
      organization_email: "info@hawks.test",
      organization_address: "1 Stadium Way",
      social_media_links: [
        { platform: "twitter", url: "https://x.test/hawks" },
      ],
      header_footer_style: "pattern",
      header_pattern: "pattern",
      footer_pattern: "solid_color",
      background_pattern_url: "/pattern.svg",
      show_panel_borders: true,
    });
  });

  it("maps branding config back into an organization settings input", () => {
    expect(
      map_branding_to_settings_input({
        organization_name: "Northern Lions",
        organization_logo_url: "/lions.svg",
        organization_tagline: "For every fixture",
        organization_email: "contact@lions.test",
        organization_address: "22 Arena Road",
        social_media_links: [
          { platform: "linkedin", url: "https://linkedin.test/lions" },
        ],
        header_footer_style: "solid_color",
        header_pattern: "solid_color",
        footer_pattern: "pattern",
        background_pattern_url: "/lions-bg.svg",
        show_panel_borders: false,
      }),
    ).toEqual({
      display_name: "Northern Lions",
      logo_url: "/lions.svg",
      tagline: "For every fixture",
      contact_email: "contact@lions.test",
      contact_address: "22 Arena Road",
      social_media_links: [
        { platform: "linkedin", url: "https://linkedin.test/lions" },
      ],
      header_pattern: "solid_color",
      footer_pattern: "pattern",
      background_pattern_url: "/lions-bg.svg",
      show_panel_borders: false,
    });
    expect(DEFAULT_PLATFORM_BRANDING.organization_name).toBe("Sport-Sync");
    expect(DEFAULT_PLATFORM_BRANDING.social_media_links).toHaveLength(3);
    expect(PLATFORM_STORAGE_KEY).toBe("sports-org-branding-platform");
    expect(CURRENT_ORG_ID_KEY).toBe("sports-org-branding-current-org-id");
  });
});
