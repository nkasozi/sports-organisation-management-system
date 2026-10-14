import { describe, expect, it } from "vitest";

import { require_auth } from "./auth_middleware";
import {
  authenticated_identity,
  create_fake_convex_context,
  unverified_identity,
} from "./fake_convex_context.test_support";
import {
  ALL_FIXTURE_USERS,
  ORGANIZATION_A_ADMIN_EMAIL,
} from "./security_test_fixtures.test_support";

type AuthContext = Parameters<typeof require_auth>[0];

function create_context(
  identity: ReturnType<typeof authenticated_identity>,
): AuthContext {
  return create_fake_convex_context({
    identity,
    tables: { system_users: ALL_FIXTURE_USERS },
  }) as unknown as AuthContext;
}

describe("require_auth email verification", () => {
  it("accepts an identity whose email claim is verified", async () => {
    const result = await require_auth(
      create_context(authenticated_identity(ORGANIZATION_A_ADMIN_EMAIL)),
    );
    expect(result.success).toBe(true);
  });

  it("rejects an identity whose email claim is not verified", async () => {
    const result = await require_auth(
      create_context(unverified_identity(ORGANIZATION_A_ADMIN_EMAIL)),
    );
    expect(result.success).toBe(false);
  });

  it("matches the system user when the email claim differs only by case and spacing", async () => {
    const result = await require_auth(
      create_context(
        authenticated_identity(` ${ORGANIZATION_A_ADMIN_EMAIL.toUpperCase()} `),
      ),
    );
    expect(result.success).toBe(true);
  });
});
