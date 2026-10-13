import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  type OfflineVerifiedSessionDependencies,
  restore_offline_verified_session,
} from "./authOfflineVerifiedSessionRestore";
import type { UserProfile } from "./authTypes";

const ORG_ADMIN_PROFILE = {
  id: "profile-1",
  display_name: "Jane Doe",
  email: "jane@example.test",
  role: "org_admin",
  organization_id: "organization-1",
  organization_name: "City Hawks",
  team_id: "team-1",
} as unknown as UserProfile;
const PUBLIC_VIEWER_PROFILE = {
  ...ORG_ADMIN_PROFILE,
  id: "public-viewer",
  role: "public_viewer",
} as unknown as UserProfile;
const AVAILABLE_PROFILES = [PUBLIC_VIEWER_PROFILE, ORG_ADMIN_PROFILE];
const FRESH_TOKEN = {
  payload: { user_id: "profile-1" },
  signature: "signature",
  raw_token: "header.payload.signature",
};

function create_dependencies(
  overrides: Partial<OfflineVerifiedSessionDependencies> = {},
): OfflineVerifiedSessionDependencies {
  return {
    verify_saved_token: vi.fn(async () => ({ status: "invalid" as const })),
    load_saved_profile_id: vi.fn(async () => ({ status: "missing" as const })),
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

  it("restores the last verified user from their saved token", async () => {
    const dependencies = create_dependencies({
      verify_saved_token: vi.fn(async () => ({
        status: "verified" as const,
        payload: { user_id: "profile-1" } as never,
      })),
    });

    const result = await restore_offline_verified_session(dependencies, {
      available_profiles: AVAILABLE_PROFILES,
      saved_token_state: { status: "present", raw_token: "a.b.c" },
    });

    expect(result.success && result.data.profile).toEqual(ORG_ADMIN_PROFILE);
    expect(result.success && result.data.token.raw_token).toBe("a.b.c");
    expect(dependencies.generate_token_for_profile).not.toHaveBeenCalled();
  });

  it("issues a fresh local token from the saved profile when the old one expired offline", async () => {
    const dependencies = create_dependencies({
      load_saved_profile_id: vi.fn(async () => ({
        status: "present" as const,
        profile_id: "profile-1" as never,
      })),
    });

    const result = await restore_offline_verified_session(dependencies, {
      available_profiles: AVAILABLE_PROFILES,
      saved_token_state: { status: "present", raw_token: "expired" },
    });

    expect(result.success && result.data.profile).toEqual(ORG_ADMIN_PROFILE);
    expect(dependencies.save_token).toHaveBeenCalledWith(FRESH_TOKEN.raw_token);
  });

  it("never restores the public viewer as the verified user", async () => {
    const dependencies = create_dependencies({
      verify_saved_token: vi.fn(async () => ({
        status: "verified" as const,
        payload: { user_id: "public-viewer" } as never,
      })),
    });

    const result = await restore_offline_verified_session(dependencies, {
      available_profiles: AVAILABLE_PROFILES,
      saved_token_state: { status: "present", raw_token: "a.b.c" },
    });

    expect(result.success).toBe(false);
  });

  it("fails and logs when no local profile matches", async () => {
    const dependencies = create_dependencies();

    const result = await restore_offline_verified_session(dependencies, {
      available_profiles: AVAILABLE_PROFILES,
      saved_token_state: { status: "missing" },
    });

    expect(result.success).toBe(false);
    expect(console.warn).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        event: "auth_offline_verified_session_unavailable",
      }),
    );
  });

  it("fails when a fresh local token cannot be issued", async () => {
    const dependencies = create_dependencies({
      load_saved_profile_id: vi.fn(async () => ({
        status: "present" as const,
        profile_id: "profile-1" as never,
      })),
      generate_token_for_profile: vi.fn(async () => ({
        success: false as const,
        error: "no secret",
      })),
    });

    const result = await restore_offline_verified_session(dependencies, {
      available_profiles: AVAILABLE_PROFILES,
      saved_token_state: { status: "missing" },
    });

    expect(result.success).toBe(false);
    expect(dependencies.save_token).not.toHaveBeenCalled();
  });
});
