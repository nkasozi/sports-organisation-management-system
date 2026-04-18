import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  build_profiles_with_public_viewer,
  clear_auth_storage,
  create_public_viewer_profile,
  fetch_current_user_profile_from_convex,
  generate_token_for_profile,
  load_saved_profile_id,
  load_saved_token,
  load_sidebar_menu_for_role,
  save_profile_id,
  save_token,
  sync_user_context_with_event_bus,
} from "./authHelpers";

const {
  clear_user_context_mock,
  generate_token_mock,
  get_authentication_adapter_mock,
  get_authorization_adapter_mock,
  get_convex_client_mock,
  get_setting_mock,
  get_sidebar_menu_for_role_mock,
  query_mock,
  remove_setting_mock,
  set_setting_mock,
  set_user_context_mock,
} = vi.hoisted(() => ({
  clear_user_context_mock: vi.fn(),
  generate_token_mock: vi.fn(),
  get_authentication_adapter_mock: vi.fn(),
  get_authorization_adapter_mock: vi.fn(),
  get_convex_client_mock: vi.fn(),
  get_setting_mock: vi.fn(),
  get_sidebar_menu_for_role_mock: vi.fn(),
  query_mock: vi.fn(),
  remove_setting_mock: vi.fn(),
  set_setting_mock: vi.fn(),
  set_user_context_mock: vi.fn(),
}));

vi.mock("$lib/adapters/iam/LocalAuthenticationAdapter", () => ({
  get_authentication_adapter: get_authentication_adapter_mock,
}));

vi.mock("$lib/adapters/repositories/InBrowserSystemUserRepository", () => ({
  get_system_user_repository: vi.fn(() => ({ repository: "system_user" })),
}));

vi.mock("$lib/infrastructure/AuthorizationProvider", () => ({
  get_authorization_adapter: get_authorization_adapter_mock,
}));

vi.mock("$lib/infrastructure/container", () => ({
  get_app_settings_storage: vi.fn(() => ({
    get_setting: get_setting_mock,
    set_setting: set_setting_mock,
    remove_setting: remove_setting_mock,
  })),
}));

vi.mock("$lib/infrastructure/events/EventBus", () => ({
  clear_user_context: clear_user_context_mock,
  set_user_context: set_user_context_mock,
}));

vi.mock("$lib/infrastructure/sync/convexSyncService", () => ({
  get_sync_manager: vi.fn(() => ({
    get_convex_client: get_convex_client_mock,
  })),
}));

describe("authHelpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    get_authentication_adapter_mock.mockReturnValue({
      generate_token: generate_token_mock,
    });
    get_authorization_adapter_mock.mockReturnValue({
      get_sidebar_menu_for_role: get_sidebar_menu_for_role_mock,
    });
  });

  it("returns a failure result when the convex client is unavailable", async () => {
    get_convex_client_mock.mockReturnValue({
      success: false,
      error: "Convex client not initialized",
    });

    await expect(fetch_current_user_profile_from_convex()).resolves.toEqual({
      success: false,
      error: "Convex client not initialized",
    });
  });

  it("loads the current user profile from convex and surfaces query failures", async () => {
    get_convex_client_mock.mockReturnValue({
      success: true,
      data: { query: query_mock },
    });
    query_mock.mockResolvedValueOnce({
      success: true,
      data: { email: "admin@example.com", role: "org_admin" },
    });

    await expect(fetch_current_user_profile_from_convex()).resolves.toEqual({
      success: true,
      data: { email: "admin@example.com", role: "org_admin" },
    });

    query_mock.mockRejectedValueOnce(new Error("query failed"));
    await expect(fetch_current_user_profile_from_convex()).resolves.toEqual({
      success: false,
      error: "query failed",
    });
  });

  it("reads, writes, and clears saved auth storage keys", async () => {
    get_setting_mock.mockResolvedValueOnce("profile_1");
    get_setting_mock.mockResolvedValueOnce("raw_token");

    await expect(load_saved_profile_id()).resolves.toEqual({
      status: "present",
      profile_id: "profile_1",
    });
    await save_profile_id("profile_2");
    await expect(load_saved_token()).resolves.toEqual({
      status: "present",
      raw_token: "raw_token",
    });
    await save_token("next_raw_token");
    await clear_auth_storage();

    expect(set_setting_mock).toHaveBeenCalledWith(
      "sports-org-current-profile-id",
      "profile_2",
    );
    expect(set_setting_mock).toHaveBeenCalledWith(
      "sports-org-auth-token",
      "next_raw_token",
    );
    expect(remove_setting_mock).toHaveBeenCalledWith("sports-org-auth-token");
    expect(remove_setting_mock).toHaveBeenCalledWith(
      "sports-org-current-profile-id",
    );
  });

  it("creates a public viewer profile and prepends it only once", () => {
    const public_viewer = create_public_viewer_profile();

    expect(public_viewer).toEqual({
      id: "public-viewer",
      display_name: "Public Viewer",
      email: "public-viewer@anonymous.invalid",
      role: "public_viewer",
      organization_id: "*",
      organization_name: "",
      team_id: "*",
    });

    expect(
      build_profiles_with_public_viewer([{ id: "profile_1" }] as never[]),
    ).toEqual([public_viewer, { id: "profile_1" }]);
    expect(
      build_profiles_with_public_viewer([public_viewer] as never[]),
    ).toEqual([public_viewer]);
  });

  it("generates tokens for profiles and returns failures when generation fails", async () => {
    const profile = {
      id: "profile_1",
      email: "admin@example.com",
      display_name: "Admin User",
      role: "org_admin",
      organization_id: "org_1",
      team_id: "team_1",
    } as never;

    generate_token_mock.mockResolvedValueOnce({
      success: true,
      data: { raw_token: "abc.def.sig" },
    });

    await expect(generate_token_for_profile(profile)).resolves.toEqual({
      success: true,
      data: { raw_token: "abc.def.sig" },
    });

    generate_token_mock.mockResolvedValueOnce({
      success: false,
      error: "token failed",
    });

    await expect(generate_token_for_profile(profile)).resolves.toEqual({
      success: false,
      error: "token failed",
    });
  });

  it("generates public viewer tokens with anonymous scope values", async () => {
    const profile = create_public_viewer_profile();

    generate_token_mock.mockResolvedValueOnce({
      success: true,
      data: { raw_token: "public.token.sig" },
    });

    await expect(generate_token_for_profile(profile)).resolves.toEqual({
      success: true,
      data: { raw_token: "public.token.sig" },
    });

    expect(generate_token_mock).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "public-viewer",
        role: "public_viewer",
        organization_id: "*",
        team_id: "*",
      }),
    );

    const generated_payload = generate_token_mock.mock.calls[0]?.[0];

    expect(generated_payload.email).not.toBe("");
  });

  it("fails before token generation when the profile identifiers are invalid", async () => {
    const invalid_profile = {
      id: "",
      email: "admin@example.com",
      display_name: "Admin User",
      role: "org_admin",
      organization_id: "*",
      team_id: "team_1",
    } as never;

    await expect(generate_token_for_profile(invalid_profile)).resolves.toEqual({
      success: false,
      error: "User ID is invalid",
    });

    expect(generate_token_mock).not.toHaveBeenCalled();
  });

  it("syncs event-bus user context and loads sidebar menus for a role", async () => {
    get_sidebar_menu_for_role_mock.mockResolvedValueOnce({
      success: true,
      data: [{ group_name: "General", items: [] }],
    });
    get_sidebar_menu_for_role_mock.mockResolvedValueOnce({
      success: false,
      error: "menu failed",
    });

    sync_user_context_with_event_bus({ status: "cleared" });
    sync_user_context_with_event_bus({
      status: "present",
      profile: {
        id: "profile_1",
        email: "admin@example.com",
        display_name: "Admin User",
        organization_id: "org_1",
      } as never,
    });

    await expect(
      load_sidebar_menu_for_role("org_admin" as never),
    ).resolves.toEqual([{ group_name: "General", items: [] }]);
    await expect(
      load_sidebar_menu_for_role("org_admin" as never),
    ).resolves.toEqual([]);

    expect(clear_user_context_mock).toHaveBeenCalled();
    expect(set_user_context_mock).toHaveBeenCalledWith({
      user_id: "profile_1",
      user_email: "admin@example.com",
      user_display_name: "Admin User",
      organization_id: "org_1",
    });
  });
});
