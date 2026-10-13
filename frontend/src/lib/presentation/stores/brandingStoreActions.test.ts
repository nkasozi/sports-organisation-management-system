import { get } from "svelte/store";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { OrganizationSettings } from "$lib/core/entities/OrganizationSettings";

import { DEFAULT_PLATFORM_BRANDING } from "./brandingTypes";

const branding_action_mocks = vi.hoisted(() => ({
  auth_store: {
    subscribe(
      subscriber: (value: Record<string, unknown>) => void,
    ): () => void {
      subscriber({
        current_profile: {
          status: "present",
          profile: { role: "super_admin" },
        },
      });
      return (): boolean => true;
    },
  },
  get_setting: vi.fn(),
  set_setting: vi.fn(),
  remove_setting: vi.fn(),
  get_by_organization_id: vi.fn(),
  save_or_update: vi.fn(),
  update_theme_colors: vi.fn(),
}));

vi.mock("$app/environment", () => ({ browser: true }));

vi.mock("$lib/infrastructure/container", () => ({
  get_app_settings_storage: () => ({
    get_setting: branding_action_mocks.get_setting,
    set_setting: branding_action_mocks.set_setting,
    remove_setting: branding_action_mocks.remove_setting,
  }),
  get_use_cases_container: () => ({
    organization_settings_use_cases: {
      get_by_organization_id: branding_action_mocks.get_by_organization_id,
      save_or_update: branding_action_mocks.save_or_update,
    },
  }),
}));

vi.mock("$lib/presentation/stores/auth", () => ({
  auth_store: branding_action_mocks.auth_store,
}));

vi.mock("$lib/presentation/stores/theme", () => ({
  update_theme_colors: branding_action_mocks.update_theme_colors,
}));

const PLATFORM_KEY = "sports-org-branding-platform";
const CURRENT_ORG_KEY = "sports-org-branding-current-org-id";

async function load_branding_store(): Promise<
  (typeof import("./branding"))["branding_store"]
> {
  const branding_module = await import("./branding");
  return branding_module.branding_store;
}

describe("branding store actions", () => {
  beforeEach(() => {
    vi.resetModules();
    Object.values(branding_action_mocks).forEach((mock) => {
      if (typeof mock === "function" && "mockReset" in mock) mock.mockReset();
    });
    branding_action_mocks.save_or_update.mockResolvedValue({
      success: true,
      data: {},
    });
  });

  it("initializes scoped branding from the stored organization id", async () => {
    branding_action_mocks.get_setting.mockResolvedValueOnce("organization-9");
    branding_action_mocks.get_by_organization_id.mockResolvedValue({
      success: false,
    });
    const branding_store = await load_branding_store();

    await branding_store.initialize();

    expect(branding_store.get_current_org_id_state()).toEqual({
      status: "scoped",
      organization_id: "organization-9",
    });
    expect(branding_action_mocks.save_or_update).toHaveBeenCalledWith(
      "super_admin",
      "organization-9",
      expect.objectContaining({
        display_name: DEFAULT_PLATFORM_BRANDING.organization_name,
      }),
    );
  });

  it("falls back to default branding when no platform branding is stored", async () => {
    branding_action_mocks.get_setting.mockResolvedValue("");
    const branding_store = await load_branding_store();

    await branding_store.set_organization_context({ status: "platform" });

    expect(branding_action_mocks.remove_setting).toHaveBeenCalledWith(
      CURRENT_ORG_KEY,
    );
    expect(branding_store.get_current_org_id_state()).toEqual({
      status: "platform",
    });
    expect(get(branding_store)).toEqual(DEFAULT_PLATFORM_BRANDING);
  });

  it("persists platform updates to app settings", async () => {
    const branding_store = await load_branding_store();

    await branding_store.update_organization_name("Platform One");
    await branding_store.update_organization_logo("/one.svg");
    await branding_store.update_social_media_links([]);
    await branding_store.update((config) => ({
      ...config,
      organization_tagline: "Tagline",
    }));

    const expected = {
      ...DEFAULT_PLATFORM_BRANDING,
      organization_name: "Platform One",
      organization_logo_url: "/one.svg",
      social_media_links: [],
      organization_tagline: "Tagline",
    };
    expect(get(branding_store)).toEqual(expected);
    expect(branding_action_mocks.set_setting).toHaveBeenLastCalledWith(
      PLATFORM_KEY,
      JSON.stringify(expected),
    );
    expect(branding_action_mocks.save_or_update).not.toHaveBeenCalled();
  });

  it("persists scoped updates through organization settings", async () => {
    branding_action_mocks.get_by_organization_id.mockResolvedValue({
      success: false,
    });
    const branding_store = await load_branding_store();
    await branding_store.set_organization_context({
      status: "scoped",
      organization_id: "organization-3",
    });
    branding_action_mocks.save_or_update.mockClear();

    await branding_store.update_organization_name("Scoped Club");

    expect(branding_action_mocks.save_or_update).toHaveBeenCalledWith(
      "super_admin",
      "organization-3",
      expect.objectContaining({ display_name: "Scoped Club" }),
    );
    expect(get(branding_store).organization_name).toBe("Scoped Club");
  });

  it("refreshes from realtime settings and resets to defaults", async () => {
    const branding_store = await load_branding_store();

    branding_store.refresh_from_organization_settings({
      organization_id: "organization-4",
      display_name: "Realtime Club",
      primary_color: "green",
      secondary_color: "white",
      social_media_links: [],
    } as unknown as OrganizationSettings);

    expect(get(branding_store).organization_name).toBe("Realtime Club");
    expect(branding_action_mocks.update_theme_colors).toHaveBeenCalledWith({
      primaryColor: "green",
      secondaryColor: "white",
    });

    await branding_store.reset_to_default();
    expect(get(branding_store)).toEqual(DEFAULT_PLATFORM_BRANDING);
  });
});
