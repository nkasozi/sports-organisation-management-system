import { beforeEach, describe, expect, it, vi } from "vitest";

import { create_some_option } from "$lib/core/types/Option";

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

describe("restore_offline_verified_session refusals", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  it("never restores the public viewer as the verified user", async () => {
    const dependencies = create_dependencies({
      load_verified_identity: vi.fn(async () =>
        create_some_option({ clerk_user_id: "clerk-user-1", email: "" }),
      ),
    });

    const result = await restore_offline_verified_session(
      dependencies,
      build_request({
        available_profiles: [{ ...PUBLIC_VIEWER_PROFILE, email: "" }],
      }),
    );

    expect(result.success).toBe(false);
  });

  it("fails when a fresh local token cannot be issued", async () => {
    const dependencies = create_dependencies({
      generate_token_for_profile: vi.fn(async () => ({
        success: false as const,
        error: "no secret",
      })),
    });

    const result = await restore_offline_verified_session(
      dependencies,
      build_request(),
    );

    expect(result.success).toBe(false);
    expect(dependencies.save_token).not.toHaveBeenCalled();
  });
});
