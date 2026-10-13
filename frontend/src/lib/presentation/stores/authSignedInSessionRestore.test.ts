import { beforeEach, describe, expect, it, vi } from "vitest";

import { try_restore_signed_in_session } from "./authSignedInSessionRestore";
import type { UserProfile } from "./authTypes";

const restore_mocks = vi.hoisted(() => ({
  clear_auth_storage: vi.fn(),
  verify_saved_token: vi.fn(),
  build_restored_auth_token: vi.fn(),
}));

vi.mock("./authHelpers", () => ({
  clear_auth_storage: restore_mocks.clear_auth_storage,
}));

vi.mock("./authSavedTokenVerification", () => ({
  verify_saved_token: restore_mocks.verify_saved_token,
  build_restored_auth_token: restore_mocks.build_restored_auth_token,
}));

const TOKEN_OWNER = {
  id: "profile-1",
  display_name: "Jane Doe",
  email: "jane@example.test",
} as unknown as UserProfile;

describe("try_restore_signed_in_session logging", () => {
  beforeEach(() => {
    Object.values(restore_mocks).forEach((mock) => mock.mockReset());
    restore_mocks.verify_saved_token.mockResolvedValue({
      status: "verified",
      payload: { user_id: "profile-1" },
    });
    restore_mocks.build_restored_auth_token.mockReturnValue({
      raw_token: "a.b.c",
    });
  });

  it("logs a structured owner mismatch without either email address", async () => {
    const warn_spy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const restored = await try_restore_signed_in_session(
      [TOKEN_OWNER],
      "a.b.c",
      {
        status: "present",
        email: "someone.else@example.test",
      },
    );

    expect(restored).toEqual({ status: "not_restored" });
    expect(warn_spy).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ event: "auth_saved_token_owner_mismatch" }),
    );
    const logged_text = JSON.stringify(warn_spy.mock.calls);
    expect(logged_text).not.toContain("jane@example.test");
    expect(logged_text).not.toContain("someone.else@example.test");
  });

  it("logs a restored session with the profile id instead of the display name", async () => {
    const log_spy = vi.spyOn(console, "log").mockImplementation(() => {});

    const restored = await try_restore_signed_in_session(
      [TOKEN_OWNER],
      "a.b.c",
      {
        status: "present",
        email: "jane@example.test",
      },
    );

    expect(restored.status).toBe("restored");
    expect(log_spy).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        event: "auth_signed_in_session_restored",
        profile_id: "profile-1",
      }),
    );
    expect(JSON.stringify(log_spy.mock.calls)).not.toContain("Jane Doe");
  });
});
