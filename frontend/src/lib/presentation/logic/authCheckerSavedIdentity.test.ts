import { describe, expect, it, vi } from "vitest";

import { create_none_option, create_some_option } from "$lib/core/types/Option";

import { has_saved_identity_for_session } from "./authCheckerSavedIdentity";

const saved_identity = create_some_option({
  clerk_user_id: "user_123",
  email: "player@example.com",
});
const cookie_identity = create_some_option({
  user_id: "user_123",
  session_id: "sess_456",
});

function build_dependencies(
  overrides: Partial<Parameters<typeof has_saved_identity_for_session>[0]> = {},
): Parameters<typeof has_saved_identity_for_session>[0] {
  return {
    clerk_session_id: create_some_option("sess_456"),
    read_cookie_identity: () => cookie_identity,
    load_verified_identity: vi.fn(async () => saved_identity),
    ...overrides,
  };
}

describe("has_saved_identity_for_session", () => {
  it("trusts the saved identity when it matches the current session's user", async () => {
    expect(await has_saved_identity_for_session(build_dependencies())).toBe(
      true,
    );
  });

  it("refuses when the saved identity belongs to a different user", async () => {
    expect(
      await has_saved_identity_for_session(
        build_dependencies({
          load_verified_identity: async () =>
            create_some_option({
              clerk_user_id: "user_other",
              email: "other@example.com",
            }),
        }),
      ),
    ).toBe(false);
  });

  it("refuses when the cookie is from a different session", async () => {
    expect(
      await has_saved_identity_for_session(
        build_dependencies({
          clerk_session_id: create_some_option("sess_new"),
        }),
      ),
    ).toBe(false);
  });

  it("refuses when there is no session id, cookie or saved identity", async () => {
    expect(
      await has_saved_identity_for_session(
        build_dependencies({ clerk_session_id: create_none_option() }),
      ),
    ).toBe(false);
    expect(
      await has_saved_identity_for_session(
        build_dependencies({
          read_cookie_identity: () => create_none_option(),
        }),
      ),
    ).toBe(false);
    expect(
      await has_saved_identity_for_session(
        build_dependencies({
          load_verified_identity: async () => create_none_option(),
        }),
      ),
    ).toBe(false);
  });

  it("refuses when the saved identity cannot be read", async () => {
    expect(
      await has_saved_identity_for_session(
        build_dependencies({
          load_verified_identity: () =>
            Promise.reject(new Error("storage offline")),
        }),
      ),
    ).toBe(false);
  });
});
