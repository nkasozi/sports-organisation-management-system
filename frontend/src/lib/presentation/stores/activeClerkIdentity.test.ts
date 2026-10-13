import { describe, expect, it } from "vitest";

import { build_active_clerk_identity_state } from "./activeClerkIdentity";

const signed_in_user = {
  id: "user-1",
  email_address: "",
  full_name: "",
  first_name: "",
  last_name: "",
};

describe("build_active_clerk_identity_state", () => {
  it("is signed out when there is no session", () => {
    expect(
      build_active_clerk_identity_state({
        is_loaded: true,
        is_signed_in: false,
        user_state: { status: "missing" },
        session_id_state: { status: "missing" },
      }),
    ).toEqual({ status: "signed_out" });
  });

  it("exposes the stable user id alongside the session id", () => {
    expect(
      build_active_clerk_identity_state({
        is_loaded: true,
        is_signed_in: true,
        user_state: { status: "present", user: signed_in_user },
        session_id_state: { status: "present", session_id: "session-1" },
      }),
    ).toEqual({
      status: "signed_in",
      session_id: "session-1",
      user_id: "user-1",
    });
  });

  it("marks the user as unresolved when the session has no loaded user", () => {
    expect(
      build_active_clerk_identity_state({
        is_loaded: true,
        is_signed_in: true,
        user_state: { status: "missing" },
        session_id_state: { status: "present", session_id: "session-1" },
      }),
    ).toEqual({ status: "signed_in_user_unresolved", session_id: "session-1" });
  });

  it("treats an empty user id as unresolved", () => {
    expect(
      build_active_clerk_identity_state({
        is_loaded: true,
        is_signed_in: true,
        user_state: { status: "present", user: { ...signed_in_user, id: "" } },
        session_id_state: { status: "present", session_id: "session-1" },
      }),
    ).toEqual({ status: "signed_in_user_unresolved", session_id: "session-1" });
  });
});
