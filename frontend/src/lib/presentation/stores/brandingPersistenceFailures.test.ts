import { get } from "svelte/store";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DEFAULT_PLATFORM_BRANDING } from "./brandingTypes";

const failure_mocks = vi.hoisted(() => ({
  auth_store: {
    subscribe(
      subscriber: (value: Record<string, unknown>) => void,
    ): () => void {
      subscriber({
        current_profile: { status: "present", profile: { role: "org_admin" } },
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
    get_setting: failure_mocks.get_setting,
    set_setting: failure_mocks.set_setting,
    remove_setting: failure_mocks.remove_setting,
  }),
  get_use_cases_container: () => ({
    organization_settings_use_cases: {
      get_by_organization_id: failure_mocks.get_by_organization_id,
      save_or_update: failure_mocks.save_or_update,
    },
  }),
}));

vi.mock("$lib/presentation/stores/auth", () => ({
  auth_store: failure_mocks.auth_store,
}));

vi.mock("$lib/presentation/stores/theme", () => ({
  update_theme_colors: failure_mocks.update_theme_colors,
}));

async function load_branding_store(): Promise<
  (typeof import("./branding"))["branding_store"]
> {
  return (await import("./branding")).branding_store;
}

describe("branding persistence failures", () => {
  beforeEach(() => {
    vi.resetModules();
    Object.values(failure_mocks).forEach((mock) => {
      if (typeof mock === "function" && "mockReset" in mock) mock.mockReset();
    });
    vi.spyOn(console, "error").mockImplementation(() => true);
    vi.spyOn(console, "warn").mockImplementation(() => true);
  });

  it("keeps the current branding when saving organization settings fails", async () => {
    failure_mocks.get_by_organization_id.mockResolvedValue({
      success: false,
      error: "not found",
    });
    failure_mocks.save_or_update.mockResolvedValue({
      success: false,
      error: "Permission denied",
    });
    const branding_store = await load_branding_store();
    await branding_store.set_organization_context({
      status: "scoped",
      organization_id: "organization-9",
    });

    await branding_store.update_organization_name("Unsaved Club");

    expect(get(branding_store).organization_name).toBe(
      DEFAULT_PLATFORM_BRANDING.organization_name,
    );
    expect(console.error).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        event: "branding_settings_save_failed",
        organization_id: "organization-9",
      }),
    );
  });

  it("uses the default branding when the stored platform branding is unreadable", async () => {
    failure_mocks.get_setting.mockImplementation(async (key: string) =>
      key === "sports-org-branding-platform" ? "{not json" : "",
    );
    const branding_store = await load_branding_store();

    await branding_store.initialize();

    expect(get(branding_store)).toEqual(DEFAULT_PLATFORM_BRANDING);
    expect(console.warn).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        event: "branding_stored_platform_branding_parse_failed",
      }),
    );
  });
});
