export function build_branding_config(
  overrides: Partial<Record<string, unknown>> = {},
): Record<string, unknown> {
  return {
    organization_name: "Sport-Sync",
    organization_logo_url: "",
    organization_tagline:
      "Professional sports management platform for competitions, teams, players and officials.",
    organization_email: "info@sport-sync.local",
    organization_address: "Sports Management HQ",
    social_media_links: [
      { platform: "twitter", url: "" },
      { platform: "github", url: "" },
      { platform: "linkedin", url: "" },
    ],
    header_footer_style: "pattern",
    header_pattern: "pattern",
    footer_pattern: "solid_color",
    background_pattern_url: "/african-mosaic-bg.svg",
    show_panel_borders: false,
    ...overrides,
  } as Record<string, unknown>;
}

export function build_organization_settings(
  overrides: Partial<Record<string, unknown>> = {},
): Record<string, unknown> {
  return {
    id: "settings-1",
    created_at: "2024-01-01T00:00:00.000Z",
    updated_at: "2024-01-02T00:00:00.000Z",
    organization_id: "organization-1",
    display_name: "City Hawks",
    logo_url: "/hawks.svg",
    tagline: "Built for match day",
    contact_email: "info@hawks.test",
    contact_address: "1 Stadium Way",
    social_media_links: [{ platform: "twitter", url: "https://x.test/hawks" }],
    header_pattern: "pattern",
    footer_pattern: "solid_color",
    background_pattern_url: "/hawks-bg.svg",
    show_panel_borders: true,
    primary_color: "red",
    secondary_color: "blue",
    sync_interval_ms: 600000,
    ...overrides,
  } as Record<string, unknown>;
}
