import { describe, expect, it } from "vitest";

import {
  apply_organization_settings_form_values,
  COLOR_OPTIONS,
  create_settings_form_values,
  DEFAULT_BACKGROUND_PATTERN_URL,
  DEFAULT_FOOTER_PATTERN,
  DEFAULT_HEADER_PATTERN,
  DEFAULT_LOGO_SVG,
  DEFAULT_PRIMARY_COLOR_OPTION,
  DEFAULT_SECONDARY_COLOR_OPTION,
  map_theme_color_to_option,
  SOCIAL_MEDIA_OPTIONS,
  SYNC_INTERVAL_OPTIONS,
} from "./settingsPageConstants";

describe("settingsPageConstants", () => {
  it("maps theme palette names and exposes stable option tables", () => {
    expect(map_theme_color_to_option("amber")).toBe("yellow");
    expect(map_theme_color_to_option("emerald")).toBe("green");
    expect(map_theme_color_to_option("sky")).toBe("sky");
    expect(DEFAULT_HEADER_PATTERN).toBe("pattern");
    expect(DEFAULT_FOOTER_PATTERN).toBe("solid_color");
    expect(DEFAULT_PRIMARY_COLOR_OPTION).toBe("red");
    expect(DEFAULT_SECONDARY_COLOR_OPTION).toBe("blue");
    expect(DEFAULT_BACKGROUND_PATTERN_URL).toBe("/african-mosaic-bg.svg");
    expect(DEFAULT_LOGO_SVG.startsWith("data:image/svg+xml")).toBe(true);
    expect(SYNC_INTERVAL_OPTIONS).toHaveLength(4);
    expect(SOCIAL_MEDIA_OPTIONS.map((option) => option.value)).toContain(
      "twitter",
    );
    expect(COLOR_OPTIONS.map((option) => option.value)).toContain("red");
  });

  it("creates form values from branding and theme settings with color normalization", () => {
    expect(
      create_settings_form_values(
        {
          organization_name: "City Hawks",
          organization_logo_url: "/hawks.svg",
          organization_tagline: "Built for match day",
          organization_email: "info@hawks.test",
          organization_address: "1 Stadium Way",
          header_pattern: "pattern",
          footer_pattern: "solid_color",
          background_pattern_url: "",
          show_panel_borders: true,
          social_media_links: [
            { platform: "twitter", url: "https://x.test/hawks" },
          ],
        } as never,
        {
          primary_color: "amber",
          secondary_color: "emerald",
        } as never,
      ),
    ).toEqual(
      expect.objectContaining({
        organization_name: "City Hawks",
        selected_primary_color: "yellow",
        selected_secondary_color: "green",
        background_pattern_url: DEFAULT_BACKGROUND_PATTERN_URL,
      }),
    );
  });

  it("applies organization settings over the current form values and falls back to the selected organization name", () => {
    const current_values = create_settings_form_values(
      {
        organization_name: "Default Name",
        organization_logo_url: "",
        organization_tagline: "",
        organization_email: "",
        organization_address: "",
        header_pattern: "pattern",
        footer_pattern: "solid_color",
        background_pattern_url: DEFAULT_BACKGROUND_PATTERN_URL,
        show_panel_borders: false,
        social_media_links: [],
      } as never,
      { primary_color: "red", secondary_color: "blue" } as never,
    );

    expect(
      apply_organization_settings_form_values(
        current_values,
        { name: "Selected Club" } as never,
        null,
      ).organization_name,
    ).toBe("Selected Club");

    expect(
      apply_organization_settings_form_values(
        current_values,
        { name: "Selected Club" } as never,
        {
          display_name: "Stored Club",
          logo_url: "/stored.svg",
          tagline: "Stored tagline",
          contact_email: "stored@test.example",
          contact_address: "22 Arena Road",
          header_pattern: "solid_color",
          footer_pattern: "pattern",
          background_pattern_url: "/stored-bg.svg",
          show_panel_borders: true,
          social_media_links: [
            { platform: "linkedin", url: "https://linkedin.test/club" },
          ],
          sync_interval_ms: 900000,
        } as never,
      ),
    ).toEqual(
      expect.objectContaining({
        organization_name: "Stored Club",
        organization_logo_url: "/stored.svg",
        footer_pattern: "pattern",
        selected_sync_interval_ms: 900000,
      }),
    );
  });
});
