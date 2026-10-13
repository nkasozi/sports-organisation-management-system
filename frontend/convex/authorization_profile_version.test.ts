import { describe, expect, it } from "vitest";

import { get_current_user_profile } from "./authorization_access_queries";
import {
  authenticated_identity,
  create_fake_convex_context,
  invoke_convex_handler,
} from "./lib/fake_convex_context.test_support";
import {
  ALL_FIXTURE_USERS,
  ORGANIZATION_A_ADMIN_EMAIL,
} from "./lib/security_test_fixtures.test_support";

describe("get_current_user_profile", () => {
  it("includes the system user record's server version", async () => {
    const context = create_fake_convex_context({
      identity: authenticated_identity(ORGANIZATION_A_ADMIN_EMAIL),
      tables: {
        system_users: ALL_FIXTURE_USERS.map((user) => ({
          ...user,
          version: 4,
        })),
      },
    });
    const result = await invoke_convex_handler<{
      success: boolean;
      data: Record<string, unknown>;
    }>(get_current_user_profile, context, {});
    expect(result).toMatchObject({
      success: true,
      data: { email: ORGANIZATION_A_ADMIN_EMAIL, version: 4 },
    });
  });
});
