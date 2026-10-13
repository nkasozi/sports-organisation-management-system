import { describe, expect, it } from "vitest";

import { check_user_access } from "./authorization_access_queries";
import {
  ANONYMOUS_IDENTITY,
  authenticated_identity,
  create_fake_convex_context,
  type FakeIdentity,
  invoke_convex_handler,
} from "./lib/fake_convex_context.test_support";
import {
  ALL_FIXTURE_USERS,
  ORGANIZATION_A_ADMIN_EMAIL,
  ORGANIZATION_A_PLAYER_EMAIL,
  STRANGER_EMAIL,
} from "./lib/security_test_fixtures.test_support";

type AccessResult = { success: boolean; error?: string };

const INACTIVE_USER = {
  local_id: "user_inactive",
  email: "inactive@example.com",
  role: "player",
  organization_id: "org_a",
  status: "inactive",
  synced_at: "2024-01-01T00:00:00.000Z",
  version: 1,
};

async function check_access(
  identity: FakeIdentity,
  email: string,
): Promise<AccessResult> {
  const context = create_fake_convex_context({
    identity,
    tables: { system_users: [...ALL_FIXTURE_USERS, INACTIVE_USER] },
  });
  return invoke_convex_handler<AccessResult>(check_user_access, context, {
    email,
  });
}

describe("check_user_access", () => {
  it("grants access to an authenticated active user checking themselves", async () => {
    expect(
      await check_access(
        authenticated_identity(ORGANIZATION_A_ADMIN_EMAIL),
        ORGANIZATION_A_ADMIN_EMAIL,
      ),
    ).toEqual({ success: true, data: { email: ORGANIZATION_A_ADMIN_EMAIL } });
  });

  it("returns one uniform denial for anonymous, foreign, unknown and inactive lookups", async () => {
    const denials = [
      await check_access(ANONYMOUS_IDENTITY, ORGANIZATION_A_PLAYER_EMAIL),
      await check_access(
        authenticated_identity(STRANGER_EMAIL),
        ORGANIZATION_A_PLAYER_EMAIL,
      ),
      await check_access(
        authenticated_identity(STRANGER_EMAIL),
        STRANGER_EMAIL,
      ),
      await check_access(
        authenticated_identity(INACTIVE_USER.email),
        INACTIVE_USER.email,
      ),
    ];
    for (const denial of denials) {
      expect(denial).toEqual(denials[0]);
      expect(denial.success).toBe(false);
    }
  });
});
