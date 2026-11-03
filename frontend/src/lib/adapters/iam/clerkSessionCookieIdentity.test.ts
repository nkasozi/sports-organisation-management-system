import { describe, expect, it } from "vitest";

import { create_none_option, create_some_option } from "$lib/core/types/Option";
import { base64_url_encode } from "$lib/infrastructure/utils/JwtTokenUtils";

import { read_clerk_session_cookie_identity } from "./clerkSessionCookieIdentity";

function build_session_token(claims: Record<string, unknown>): string {
  return [
    base64_url_encode(JSON.stringify({ alg: "RS256" })),
    base64_url_encode(JSON.stringify(claims)),
    "signature",
  ].join(".");
}

const session_token = build_session_token({
  sub: "user_123",
  sid: "sess_456",
});

describe("read_clerk_session_cookie_identity", () => {
  it("reads the user and session ids from the __session cookie", () => {
    expect(
      read_clerk_session_cookie_identity(
        `theme=dark; __session=${session_token}; other=1`,
      ),
    ).toEqual(
      create_some_option({ user_id: "user_123", session_id: "sess_456" }),
    );
  });

  it("reads a suffixed __session cookie", () => {
    expect(
      read_clerk_session_cookie_identity(`__session_Ab12Cd=${session_token}`),
    ).toEqual(
      create_some_option({ user_id: "user_123", session_id: "sess_456" }),
    );
  });

  it("returns nothing when there is no session cookie", () => {
    expect(read_clerk_session_cookie_identity("theme=dark")).toEqual(
      create_none_option(),
    );
  });

  it("returns nothing for a malformed token or one missing ids", () => {
    expect(read_clerk_session_cookie_identity("__session=not-a-token")).toEqual(
      create_none_option(),
    );
    expect(
      read_clerk_session_cookie_identity(
        `__session=${build_session_token({ sub: "user_123" })}`,
      ),
    ).toEqual(create_none_option());
  });
});
