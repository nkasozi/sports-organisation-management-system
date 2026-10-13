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

describe("authInitialize while Clerk is unreachable offline", () => {
  const OFFLINE_VERIFIED_SESSION = {
    status: "offline_verified",
    verified_sync: { status: "verified_user", session_id: "s", user_id: "u" },
  };
  beforeEach(() => {
    vi.resetModules();
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    reset_auth_initialize_mocks(auth_initialize_mocks);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("keeps the verified user working offline with their own role when Clerk is unreachable", async () => {
    const verified_profile = build_profile({ id: "real-org-admin" });
    auth_initialize_mocks.resolve_current_device_session.mockResolvedValue(
      OFFLINE_VERIFIED_SESSION,
    );
    auth_initialize_mocks.load_available_profiles.mockResolvedValue([
      build_profile({ id: "public-viewer" }),
      verified_profile,
      build_profile({ id: "another-real-user" }),
    ]);
    auth_initialize_mocks.restore_offline_verified_session.mockResolvedValue({
      success: true,
      data: { profile: verified_profile, token: { raw_token: "a.b.c" } },
    });
    const state_setter = vi.fn();
    const { execute_auth_initialization } = await import("./authInitialize");

    const result = await execute_auth_initialization(
      build_auth_state() as never,
      state_setter,
    );

    expect(result.success).toBe(true);
    expect(state_setter).toHaveBeenCalledWith(
      expect.objectContaining({
        current_profile: { status: "present", profile: verified_profile },
        available_profiles: [verified_profile],
        is_initialized: true,
        is_demo_session: false,
      }),
    );
    expect(auth_initialize_mocks.clear_auth_storage).not.toHaveBeenCalled();
    expect(
      auth_initialize_mocks.try_restore_anonymous_session,
    ).not.toHaveBeenCalled();
    expect(
      auth_initialize_mocks.load_sidebar_menu_for_role,
    ).toHaveBeenCalledWith("org_admin");
  });

  it("falls back to the public viewer without deleting saved credentials when no offline profile exists", async () => {
    const public_viewer_only_profiles = [
      build_profile({ id: "public-viewer" }),
    ];
    const locked_state = build_auth_state({ is_initialized: true });
    auth_initialize_mocks.resolve_current_device_session.mockResolvedValue(
      OFFLINE_VERIFIED_SESSION,
    );
    auth_initialize_mocks.restore_offline_verified_session.mockResolvedValue({
      success: false,
      error: "missing",
    });
    auth_initialize_mocks.build_profiles_with_public_viewer.mockReturnValue(
      public_viewer_only_profiles,
    );
    auth_initialize_mocks.create_default_anonymous_state.mockResolvedValue(
      locked_state,
    );
    const state_setter = vi.fn();
    const { execute_auth_initialization } = await import("./authInitialize");

    const result = await execute_auth_initialization(
      build_auth_state() as never,
      state_setter,
    );

    expect(result.success).toBe(true);
    expect(state_setter).toHaveBeenCalledWith(locked_state);
    expect(auth_initialize_mocks.clear_auth_storage).not.toHaveBeenCalled();
    expect(
      auth_initialize_mocks.build_profiles_with_public_viewer,
    ).toHaveBeenCalledWith([]);
  });
});
