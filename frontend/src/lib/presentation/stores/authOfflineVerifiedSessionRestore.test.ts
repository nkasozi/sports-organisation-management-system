import { beforeEach, describe, expect, it, vi } from "vitest";

import { create_none_option, create_some_option } from "$lib/core/types/Option";

import {
  type OfflineVerifiedSessionDependencies,
  type OfflineVerifiedSessionRequest,
  restore_offline_verified_session,
} from "./authOfflineVerifiedSessionRestore";
import type { UserProfile } from "./authTypes";

const ORG_ADMIN_PROFILE = {
  id: "profile-1",
  display_name: "Jane Doe",
  email: "Jane@Example.test",
  role: "org_admin",
  organization_id: "organization-1",
  organization_name: "City Hawks",
  team_id: "team-1",
} as unknown as UserProfile;
const OTHER_REAL_PROFILE = {
  ...ORG_ADMIN_PROFILE,
  id: "profile-2",
  email: "other@example.test",
  role: "super_admin",
} as unknown as UserProfile;
const PUBLIC_VIEWER_PROFILE = {
  ...ORG_ADMIN_PROFILE,
  id: "public-viewer",
  role: "public_viewer",
} as unknown as UserProfile;
const AVAILABLE_PROFILES = [
  PUBLIC_VIEWER_PROFILE,
  ORG_ADMIN_PROFILE,
  OTHER_REAL_PROFILE,
];
const FRESH_TOKEN = {
  payload: { user_id: "profile-1" },
  signature: "signature",
  raw_token: "header.payload.signature",
};
const VERIFIED_IDENTITY = {
  clerk_user_id: "clerk-user-1",
  email: "jane@example.test",
};
const VERIFIED_SYNC = {
  status: "verified_user" as const,
  session_id: "session-1",
  user_id: "clerk-user-1",
};

function build_request(
  overrides: Partial<OfflineVerifiedSessionRequest> = {},
): OfflineVerifiedSessionRequest {
  return {
    available_profiles: AVAILABLE_PROFILES,
    saved_token_state: { status: "missing" },
    verified_sync: VERIFIED_SYNC,
    ...overrides,
  };
}

function create_dependencies(
  overrides: Partial<OfflineVerifiedSessionDependencies> = {},
): OfflineVerifiedSessionDependencies {
  return {
    verify_saved_token: vi.fn(async () => ({ status: "invalid" as const })),
    load_verified_identity: vi.fn(async () =>
      create_some_option(VERIFIED_IDENTITY),
    ),
    generate_token_for_profile: vi.fn(async () => ({
      success: true as const,
      data: FRESH_TOKEN as never,
    })),
    save_token: vi.fn(async () => {}),
    ...overrides,
  };
}

describe("restore_offline_verified_session", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  it("keeps a still-valid saved token for the verified user", async () => {
    const dependencies = create_dependencies({
      verify_saved_token: vi.fn(async () => ({
        status: "verified" as const,
        payload: { user_id: "profile-1" } as never,
      })),
    });

    const result = await restore_offline_verified_session(
      dependencies,
      build_request({
        saved_token_state: { status: "present", raw_token: "a.b.c" },
      }),
    );

    expect(result.success && result.data.profile).toEqual(ORG_ADMIN_PROFILE);
    expect(result.success && result.data.token.raw_token).toBe("a.b.c");
    expect(dependencies.generate_token_for_profile).not.toHaveBeenCalled();
  });

  it("re-derives the verified profile from local users after a relaunch", async () => {
    const dependencies = create_dependencies();

    const result = await restore_offline_verified_session(
      dependencies,
      build_request({
        saved_token_state: { status: "present", raw_token: "expired" },
      }),
    );

    expect(result.success && result.data.profile).toEqual(ORG_ADMIN_PROFILE);
    expect(dependencies.save_token).toHaveBeenCalledWith(FRESH_TOKEN.raw_token);
  });

  it("never switches to another real profile even with a valid token for it", async () => {
    const dependencies = create_dependencies({
      verify_saved_token: vi.fn(async () => ({
        status: "verified" as const,
        payload: { user_id: "profile-2" } as never,
      })),
    });

    const result = await restore_offline_verified_session(
      dependencies,
      build_request({
        saved_token_state: { status: "present", raw_token: "a.b.c" },
      }),
    );

    expect(result.success && result.data.profile).toEqual(ORG_ADMIN_PROFILE);
    expect(dependencies.generate_token_for_profile).toHaveBeenCalledWith(
      ORG_ADMIN_PROFILE,
    );
  });

  it("refuses when the remembered identity belongs to another account", async () => {
    const dependencies = create_dependencies();

    const result = await restore_offline_verified_session(
      dependencies,
      build_request({
        verified_sync: { ...VERIFIED_SYNC, user_id: "clerk-user-9" },
      }),
    );

    expect(result.success).toBe(false);
    expect(dependencies.generate_token_for_profile).not.toHaveBeenCalled();
  });

  it("refuses when this device never recorded who verified it", async () => {
    const dependencies = create_dependencies({
      load_verified_identity: vi.fn(async () =>
        create_none_option<{ clerk_user_id: string; email: string }>(),
      ),
    });

    const result = await restore_offline_verified_session(
      dependencies,
      build_request(),
    );

    expect(result.success).toBe(false);
    expect(console.warn).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        event: "auth_offline_verified_session_unavailable",
      }),
    );
  });
});
