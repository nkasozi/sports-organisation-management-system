import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  create_public_viewer_profile,
  generate_token_for_profile,
  load_sidebar_menu_for_role,
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
