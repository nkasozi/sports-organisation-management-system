import { describe, expect, it, vi } from "vitest";

import {
  AuthCheckerAccessStatus,
  verify_signed_in_user_access,
} from "./authCheckerAccess";

const available_token = async (): Promise<{
  success: true;
  data: string;
}> => ({
  success: true as const,
  data: "session-token",
});

describe("verify_signed_in_user_access", () => {
  it("grants access when the authenticated profile query succeeds", async () => {
    const query_current_user_profile = vi.fn(async () => ({
      success: true,
      data: { email: "admin@example.com" },
    }));

    const outcome = await verify_signed_in_user_access({
      get_session_token: available_token,
      query_current_user_profile,
    });

    expect(outcome).toEqual({ status: AuthCheckerAccessStatus.GRANTED });
    expect(query_current_user_profile).toHaveBeenCalledWith("session-token");
  });

  it("denies access with the server's generic error when the profile is refused", async () => {
    const outcome = await verify_signed_in_user_access({
      get_session_token: available_token,
      query_current_user_profile: async () => ({
        success: false,
        error: "Access denied",
      }),
    });
    expect(outcome).toEqual({
      status: AuthCheckerAccessStatus.DENIED,
      message: "Access denied",
    });
  });

  it("denies malformed responses", async () => {
    const outcome = await verify_signed_in_user_access({
      get_session_token: available_token,
      query_current_user_profile: async () => "unexpected",
    });
    expect(outcome.status).toBe(AuthCheckerAccessStatus.DENIED);
  });

  it("reports a failed check when the query throws", async () => {
    const outcome = await verify_signed_in_user_access({
      get_session_token: available_token,
      query_current_user_profile: () =>
        Promise.reject(new Error("network down")),
    });
    expect(outcome).toEqual({
      status: AuthCheckerAccessStatus.CHECK_FAILED,
      error: "network down",
    });
  });

  it("reports a failed check instead of querying anonymously when the session token is unavailable", async () => {
    const query_current_user_profile = vi.fn(async () => ({ success: true }));

    const outcome = await verify_signed_in_user_access({
      get_session_token: async () => ({
        success: false as const,
        error: "Failed to get Clerk session token",
      }),
      query_current_user_profile,
    });

    expect(outcome).toEqual({
      status: AuthCheckerAccessStatus.CHECK_FAILED,
      error: "Failed to get Clerk session token",
    });
    expect(query_current_user_profile).not.toHaveBeenCalled();
  });
});
