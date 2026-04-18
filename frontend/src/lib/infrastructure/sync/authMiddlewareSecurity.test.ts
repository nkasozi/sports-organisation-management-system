import { describe, expect, it } from "vitest";

import { require_auth } from "../../../../convex/lib/auth_middleware";

function create_mock_context(
  identity: { subject: string; email?: string } | undefined,
  system_user: Record<string, unknown> | undefined = undefined,
): any {
  return {
    auth: {
      getUserIdentity: async () => identity,
    },
    db: {
      query: () => ({
        withIndex: () => ({
          first: async () => system_user,
        }),
      }),
    },
  } as any;
}

const AUTH_DENIED_MESSAGE = "Access denied";

describe("require_auth uniform failure responses (R38)", () => {
  it("returns generic access denied when identity is missing", async () => {
    const context = create_mock_context(void 0);
    const result = await require_auth(context);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe(AUTH_DENIED_MESSAGE);
    }
  });

  it("returns generic access denied when email claim is missing", async () => {
    const context = create_mock_context({ subject: "user_123" });
    const result = await require_auth(context);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe(AUTH_DENIED_MESSAGE);
    }
  });

  it("returns generic access denied when user not found in system", async () => {
    const context = create_mock_context(
      { subject: "user_123", email: "test@example.com" },
      void 0,
    );
    const result = await require_auth(context);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe(AUTH_DENIED_MESSAGE);
    }
  });

  it("returns generic access denied when user account is inactive", async () => {
    const context = create_mock_context(
      { subject: "user_123", email: "test@example.com" },
      {
        _id: "user_1",
        email: "test@example.com",
        role: "org_admin",
        status: "inactive",
      },
    );
    const result = await require_auth(context);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe(AUTH_DENIED_MESSAGE);
    }
  });

  it("returns success with user data when authentication succeeds", async () => {
    const active_user = {
      _id: "user_1",
      email: "test@example.com",
      role: "org_admin",
      status: "active",
      organization_id: "org_1",
    };
    const context = create_mock_context(
      { subject: "user_123", email: "test@example.com" },
      active_user,
    );
    const result = await require_auth(context);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("test@example.com");
    }
  });
});
