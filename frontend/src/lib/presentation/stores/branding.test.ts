import { get } from "svelte/store";
import { beforeEach, describe, expect, it, vi } from "vitest";

const branding_mocks = vi.hoisted(() => {
  let auth_state = { current_profile: { role: "org_admin" } };
  const auth_subscribers = new Set<(value: typeof auth_state) => void>();

  return {
    set_auth_state: (next_state: typeof auth_state): void => {
      auth_state = next_state;
      auth_subscribers.forEach((subscriber) => subscriber(auth_state));
    },
    auth_store: {
      subscribe(subscriber: (value: typeof auth_state) => void): () => void {
        subscriber(auth_state);
        auth_subscribers.add(subscriber);
        return () => auth_subscribers.delete(subscriber);
      },
    },
    get_setting: vi.fn(),
    set_setting: vi.fn(),
    remove_setting: vi.fn(),
    get_by_organization_id: vi.fn(),
    save_or_update: vi.fn(),
    update_theme_colors: vi.fn(),
  };
});

vi.mock("$app/environment", () => ({
  browser: true,
}));

vi.mock("$lib/infrastructure/container", () => ({
  get_app_settings_storage: () => ({
    get_setting: branding_mocks.get_setting,
    set_setting: branding_mocks.set_setting,
    remove_setting: branding_mocks.remove_setting,
  }),
  get_use_cases_container: () => ({
    organization_settings_use_cases: {
      get_by_organization_id: branding_mocks.get_by_organization_id,
      save_or_update: branding_mocks.save_or_update,
    },
  }),
}));

vi.mock("$lib/presentation/stores/auth", () => ({
  auth_store: branding_mocks.auth_store,
}));

vi.mock("$lib/presentation/stores/theme", () => ({
  update_theme_colors: branding_mocks.update_theme_colors,
}));

function build_branding_config(
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
  };
}

function build_organization_settings(
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
  };
}

describe("branding", () => {
  beforeEach(() => {
    vi.resetModules();
    branding_mocks.set_auth_state({ current_profile: { role: "org_admin" } });
    branding_mocks.get_setting.mockReset();
    branding_mocks.set_setting.mockReset();
    branding_mocks.remove_setting.mockReset();
    branding_mocks.get_by_organization_id.mockReset();
    branding_mocks.save_or_update.mockReset();
    branding_mocks.update_theme_colors.mockReset();
  });

  it("loads stored platform branding when no organization context is active", async () => {
    const stored_branding = build_branding_config({
      organization_name: "Local Platform",
      organization_logo_url: "/local.svg",
    });
    branding_mocks.get_setting
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(JSON.stringify(stored_branding));

    const { branding_store } = await import("./branding");

    await branding_store.initialize();

    expect(get(branding_store)).toEqual(stored_branding);
  });

  it("loads organization settings and updates the active theme colors", async () => {
    const organization_settings = build_organization_settings();

    branding_mocks.get_by_organization_id.mockResolvedValue({
      success: true,
      data: organization_settings,
    });

    const { branding_store } = await import("./branding");

    await branding_store.set_organization_context("organization-1");

    expect(get(branding_store)).toEqual(
      expect.objectContaining({
        organization_name: "City Hawks",
        organization_logo_url: "/hawks.svg",
        organization_email: "info@hawks.test",
      }),
    );
    expect(branding_store.get_current_org_id()).toBe("organization-1");
    expect(branding_mocks.set_setting).toHaveBeenCalledWith(
      "sports-org-branding-current-org-id",
      "organization-1",
    );
    expect(branding_mocks.update_theme_colors).toHaveBeenCalledWith({
      primaryColor: "red",
      secondaryColor: "blue",
    });
  });

  it("migrates the current branding into organization settings when none exist", async () => {
    branding_mocks.get_by_organization_id.mockResolvedValue({
      success: false,
    });

    const { branding_store } = await import("./branding");

    await branding_store.set(
      build_branding_config({
        organization_name: "Local Club",
        organization_logo_url: "/club.svg",
        organization_tagline: "For every match",
        organization_email: "club@example.test",
        organization_address: "22 Arena Road",
        social_media_links: [
          { platform: "instagram", url: "https://ig.test/club" },
        ],
        background_pattern_url: "/club-bg.svg",
        show_panel_borders: true,
      }) as never,
    );
    branding_mocks.set_setting.mockReset();

    await branding_store.set_organization_context(
      "organization-2",
      "Fallback Club",
      "fallback@example.test",
      "1 Field Road",
    );

    expect(branding_mocks.save_or_update).toHaveBeenCalledWith(
      "org_admin",
      "organization-2",
      {
        display_name: "Fallback Club",
        logo_url: "/club.svg",
        tagline: "For every match",
        contact_email: "fallback@example.test",
        contact_address: "1 Field Road",
        social_media_links: [
          { platform: "instagram", url: "https://ig.test/club" },
        ],
        header_pattern: "pattern",
        footer_pattern: "solid_color",
        background_pattern_url: "/club-bg.svg",
        show_panel_borders: true,
      },
    );
  });
});
