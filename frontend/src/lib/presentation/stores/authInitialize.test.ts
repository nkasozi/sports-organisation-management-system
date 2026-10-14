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

  it("returns immediately when auth is already initialized", async () => {
    const { execute_auth_initialization } = await import("./authInitialize");

    const result = await execute_auth_initialization(
      build_auth_state({ is_initialized: true }) as never,
      vi.fn(),
    );

    expect(result.success).toBe(true);
    expect(auth_initialize_mocks.wait_for_clerk).not.toHaveBeenCalled();
  });

  it("restores an anonymous session when a saved token can be reused", async () => {
    const restored_state = build_auth_state({
      current_token: {
        status: "present",
        token: { raw_token: "saved-token" },
      },
      available_profiles: [build_profile()],
      is_initialized: true,
      is_demo_session: true,
    });
    const state_setter = vi.fn();

    auth_initialize_mocks.load_available_profiles.mockResolvedValue([
      build_profile(),
    ]);
    auth_initialize_mocks.load_saved_token.mockResolvedValue({
      status: "present",
      raw_token: "saved-token",
    });
    auth_initialize_mocks.try_restore_anonymous_session.mockResolvedValue({
      status: "restored",
      auth_state: restored_state,
    });

    const { execute_auth_initialization } = await import("./authInitialize");

    const result = await execute_auth_initialization(
      build_auth_state() as never,
      state_setter,
    );

    expect(result.success).toBe(true);
    expect(state_setter).toHaveBeenCalledWith(restored_state);
    expect(
      auth_initialize_mocks.create_default_anonymous_state,
    ).not.toHaveBeenCalled();
  });

  it("creates a default anonymous state when no anonymous restore is available", async () => {
    const anonymous_state = build_auth_state({
      available_profiles: [build_profile()],
      is_initialized: true,
      is_demo_session: true,
    });
    const state_setter = vi.fn();

    auth_initialize_mocks.load_available_profiles.mockResolvedValue([
      build_profile(),
    ]);
    auth_initialize_mocks.load_saved_token.mockResolvedValue({
      status: "present",
      raw_token: "saved-token",
    });
    auth_initialize_mocks.try_restore_anonymous_session.mockResolvedValue({
      status: "not_restored",
    });
    auth_initialize_mocks.create_default_anonymous_state.mockResolvedValue(
      anonymous_state,
    );

    const { execute_auth_initialization } = await import("./authInitialize");

    const result = await execute_auth_initialization(
      build_auth_state() as never,
      state_setter,
    );

    expect(result.success).toBe(true);
    expect(state_setter).toHaveBeenCalledWith(anonymous_state);
  });
});
