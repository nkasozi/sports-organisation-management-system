import { get } from "svelte/store";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { auth_store } from "./auth";
import {
  mock_app_settings_store,
  mock_convex_query,
} from "./authStoreModuleMocks.test_support";

vi.mock("$lib/infrastructure/container", async () =>
  (
    await import("./authStoreModuleMocks.test_support")
  ).create_container_module_mock(),
);

vi.mock("$app/environment", () => ({
  browser: true,
}));

vi.mock("$app/navigation", () => ({
  goto: vi.fn(),
}));

vi.mock("$lib/adapters/initialization/brandingSyncService", () => ({
  sync_branding_with_profile: vi.fn().mockImplementation(async () => {}),
}));

vi.mock("$lib/infrastructure/sync/convexSyncService", async () =>
  (
    await import("./authStoreModuleMocks.test_support")
  ).create_convex_sync_service_module_mock(),
);

vi.mock("$lib/adapters/iam/clerkAuthService", async () =>
  (
    await import("./authStoreModuleMocks.test_support")
  ).create_clerk_auth_service_module_mock(),
);

vi.mock("./profileLoader", async () =>
  (
    await import("./authStoreModuleMocks.test_support")
  ).create_profile_loader_module_mock(),
);

describe("auth_store persistence", () => {
  beforeEach(() => {
    Object.keys(mock_app_settings_store).forEach(
      (key) => delete mock_app_settings_store[key],
    );
  });

  it("saves profile id to localStorage on switch", async () => {
    expect((await auth_store.initialize()).success).toBe(true);
    auth_store.mark_as_demo_session();
    const profiles = get(auth_store).available_profiles;

    await auth_store.switch_profile(profiles[0].id);

    expect(mock_app_settings_store["sports-org-current-profile-id"]).toBe(
      profiles[0].id,
    );
  });

  it("saves token to localStorage on switch", async () => {
    expect((await auth_store.initialize()).success).toBe(true);
    auth_store.mark_as_demo_session();
    const profiles = get(auth_store).available_profiles;

    await auth_store.switch_profile(profiles[0].id);

    expect(mock_app_settings_store["sports-org-auth-token"]).toBeDefined();
  });

  it("clears localStorage on logout", async () => {
    expect((await auth_store.initialize()).success).toBe(true);
    auth_store.mark_as_demo_session();
    const profiles = get(auth_store).available_profiles;
    await auth_store.switch_profile(profiles[0].id);

    await auth_store.logout();

    expect(
      mock_app_settings_store["sports-org-current-profile-id"],
    ).toBeUndefined();
    expect(mock_app_settings_store["sports-org-auth-token"]).toBeUndefined();
  });
});

describe("auth_store — Convex unavailable fallback", () => {
  beforeEach(async () => {
    Object.keys(mock_app_settings_store).forEach(
      (key) => delete mock_app_settings_store[key],
    );
    await auth_store.logout();
    mock_convex_query.mockResolvedValue({
      success: true,
      data: { email: "admin@test.com", role: "super_admin" },
    });
  });

  afterEach(async () => {
    await auth_store.logout();
    mock_convex_query.mockResolvedValue({
      success: true,
      data: { email: "admin@test.com", role: "super_admin" },
    });
  });

  it("succeeds using clerk email when Convex throws Not authenticated", async () => {
    mock_convex_query.mockRejectedValueOnce(new Error("Not authenticated"));

    const result = await auth_store.initialize();

    expect(result.success).toBe(true);
    const state = get(auth_store);
    expect(state.is_initialized).toBe(true);
    expect(state.current_profile.status).toBe("present");
    expect(
      state.current_profile.status === "present"
        ? state.current_profile.profile.email
        : "",
    ).toBe("admin@test.com");
  });

  it("succeeds using clerk email when Convex returns a failed response", async () => {
    mock_convex_query.mockResolvedValueOnce({
      success: false,
      error: "Not authenticated",
    });

    const result = await auth_store.initialize();

    expect(result.success).toBe(true);
    const state = get(auth_store);
    expect(state.is_initialized).toBe(true);
    expect(
      state.current_profile.status === "present"
        ? state.current_profile.profile.email
        : "",
    ).toBe("admin@test.com");
  });

  it("initializes is_initialized to false before the fallback succeeds", async () => {
    mock_convex_query.mockRejectedValueOnce(new Error("Not authenticated"));

    const state_before = get(auth_store);
    expect(state_before.is_initialized).toBe(false);

    expect((await auth_store.initialize()).success).toBe(true);

    const state_after = get(auth_store);
    expect(state_after.is_initialized).toBe(true);
  });
});
