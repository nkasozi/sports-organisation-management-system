import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  build_auth_state,
  build_profile,
  reset_auth_initialize_mocks,
} from "./authInitialize.test_support";

const auth_initialize_mocks = await vi.hoisted(async () =>
  (
    await import("./authInitialize.test_support")
  ).create_auth_initialize_mocks(),
);

vi.mock("$lib/adapters/iam/clerkAuthService", () => ({
  is_signed_in: auth_initialize_mocks.is_signed_in,
}));

vi.mock("$lib/adapters/initialization/brandingSyncService", () => ({
  sync_branding_with_profile: auth_initialize_mocks.sync_branding_with_profile,
}));

vi.mock("./initialSyncStore", () => ({
  resolve_current_device_session:
    auth_initialize_mocks.resolve_current_device_session,
}));

vi.mock("./authOfflineVerifiedSessionRuntime", () => ({
  restore_offline_verified_session_from_device:
    auth_initialize_mocks.restore_offline_verified_session,
}));

vi.mock("./authOfflineVerifiedIdentityRuntime", () => ({
  remember_verified_identity_for_profile: async () => true,
}));

vi.mock("./authHelpers", async () =>
  (
    await import("./authInitialize.test_support")
  ).build_auth_helpers_module_mock(auth_initialize_mocks),
);

vi.mock("./authInitializationHelpers", () => ({
  create_default_anonymous_state:
    auth_initialize_mocks.create_default_anonymous_state,
  get_clerk_email: auth_initialize_mocks.get_clerk_email,
  load_available_profiles: auth_initialize_mocks.load_available_profiles,
  try_restore_anonymous_session:
    auth_initialize_mocks.try_restore_anonymous_session,
  try_restore_signed_in_session:
    auth_initialize_mocks.try_restore_signed_in_session,
  wait_for_clerk: auth_initialize_mocks.wait_for_clerk,
}));

describe("authInitialize", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});
    reset_auth_initialize_mocks(auth_initialize_mocks);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("restores a signed-in session and loads the matching sidebar", async () => {
    const profile = build_profile();
    const token = { raw_token: "restored-token" };
    const sidebar_groups = [{ title: "Operations", items: [] }];
    const state_setter = vi.fn();

    auth_initialize_mocks.set_signed_in(true);
    auth_initialize_mocks.load_available_profiles.mockResolvedValue([profile]);
    auth_initialize_mocks.load_saved_token.mockResolvedValue({
      status: "present",
      raw_token: "restored-token",
    });
    auth_initialize_mocks.get_clerk_email.mockReturnValue({
      status: "present",
      email: "jane@example.test",
    });
    auth_initialize_mocks.try_restore_signed_in_session.mockResolvedValue({
      status: "restored",
      profile,
      token,
    });
    auth_initialize_mocks.load_sidebar_menu_for_role.mockResolvedValue(
      sidebar_groups,
    );

    const { execute_auth_initialization } = await import("./authInitialize");

    const result = await execute_auth_initialization(
      build_auth_state() as never,
      state_setter,
    );

    expect(result.success).toBe(true);
    expect(state_setter).toHaveBeenCalledWith({
      current_token: { status: "present", token },
      current_profile: { status: "present", profile },
      available_profiles: [profile],
      sidebar_menu_items: sidebar_groups,
      is_initialized: true,
      is_demo_session: false,
    });
    expect(
      auth_initialize_mocks.sync_user_context_with_event_bus,
    ).toHaveBeenCalledWith({
      status: "present",
      profile,
    });
    expect(
      auth_initialize_mocks.sync_branding_with_profile,
    ).toHaveBeenCalledWith({
      status: "present",
      profile,
    });
  });

  it("generates and saves a token when Clerk email matches a local profile", async () => {
    const profile = build_profile({ email: "player@example.test" });
    const generated_token = { raw_token: "generated-token" };
    const state_setter = vi.fn();

    auth_initialize_mocks.set_signed_in(true);
    auth_initialize_mocks.load_available_profiles.mockResolvedValue([profile]);
    auth_initialize_mocks.get_clerk_email.mockReturnValue({
      status: "present",
      email: "PLAYER@EXAMPLE.TEST",
    });
    auth_initialize_mocks.load_saved_token.mockResolvedValue({
      status: "missing",
    });
    auth_initialize_mocks.try_restore_signed_in_session.mockResolvedValue({
      status: "not_restored",
    });
    auth_initialize_mocks.generate_token_for_profile.mockResolvedValue({
      success: true,
      data: generated_token,
    });

    const { execute_auth_initialization } = await import("./authInitialize");

    const result = await execute_auth_initialization(
      build_auth_state() as never,
      state_setter,
    );

    expect(result.success).toBe(true);
    expect(
      auth_initialize_mocks.generate_token_for_profile,
    ).toHaveBeenCalledWith(profile);
    expect(auth_initialize_mocks.save_token).toHaveBeenCalledWith(
      "generated-token",
    );
    expect(auth_initialize_mocks.save_profile_id).toHaveBeenCalledWith(
      "profile-1",
    );
    expect(state_setter).toHaveBeenCalledWith(
      expect.objectContaining({
        current_token: { status: "present", token: generated_token },
        current_profile: { status: "present", profile },
      }),
    );
  });

  it("fails when there is no local profile for the signed-in Clerk user", async () => {
    const state_setter = vi.fn();

    auth_initialize_mocks.set_signed_in(true);
    auth_initialize_mocks.load_available_profiles.mockResolvedValue([
      build_profile({ email: "someone@example.test" }),
    ]);
    auth_initialize_mocks.get_clerk_email.mockReturnValue({
      status: "present",
      email: "missing@example.test",
    });
    auth_initialize_mocks.load_saved_token.mockResolvedValue({
      status: "missing",
    });
    auth_initialize_mocks.try_restore_signed_in_session.mockResolvedValue({
      status: "not_restored",
    });

    const { execute_auth_initialization } = await import("./authInitialize");

    const result = await execute_auth_initialization(
      build_auth_state() as never,
      state_setter,
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("no local profile found");
    }
    expect(state_setter).not.toHaveBeenCalled();
  });
});
