import { beforeEach, describe, expect, it, vi } from "vitest";

import { resolve_signed_in_session } from "./authSignedInSessionResolution";
import type { UserProfile } from "./authTypes";

const resolution_mocks = vi.hoisted(() => ({
  generate_token_for_profile: vi.fn(),
  save_profile_id: vi.fn(),
  save_token: vi.fn(),
  get_clerk_email: vi.fn(),
  try_restore_signed_in_session: vi.fn(),
}));

vi.mock("./authHelpers", () => ({
  generate_token_for_profile: resolution_mocks.generate_token_for_profile,
  save_profile_id: resolution_mocks.save_profile_id,
  save_token: resolution_mocks.save_token,
}));

vi.mock("./authInitializationHelpers", () => ({
  get_clerk_email: resolution_mocks.get_clerk_email,
  try_restore_signed_in_session: resolution_mocks.try_restore_signed_in_session,
}));

const PROFILE = {
  id: "profile-1",
  display_name: "Jane Doe",
  email: "Jane@Example.test",
  role: "org_admin",
} as unknown as UserProfile;

const TOKEN = { raw_token: "a.b.c" };

describe("resolve_signed_in_session", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});
    Object.values(resolution_mocks).forEach((mock) => mock.mockReset());
    resolution_mocks.get_clerk_email.mockReturnValue({
      status: "present",
      email: "jane@example.test",
    });
  });

  it("uses the restored saved-token session when available", async () => {
    resolution_mocks.try_restore_signed_in_session.mockResolvedValue({
      status: "restored",
      profile: PROFILE,
      token: TOKEN,
    });

    const result = await resolve_signed_in_session([PROFILE], {
      status: "present",
      raw_token: "a.b.c",
    });

    expect(result).toEqual({
      success: true,
      data: { profile: PROFILE, token: TOKEN },
    });
    expect(resolution_mocks.generate_token_for_profile).not.toHaveBeenCalled();
  });

  it("generates a token for the Clerk email profile without a saved token", async () => {
    resolution_mocks.generate_token_for_profile.mockResolvedValue({
      success: true,
      data: TOKEN,
    });

    const result = await resolve_signed_in_session([PROFILE], {
      status: "missing",
    });

    expect(result).toEqual({
      success: true,
      data: { profile: PROFILE, token: TOKEN },
    });
    expect(
      resolution_mocks.try_restore_signed_in_session,
    ).not.toHaveBeenCalled();
    expect(resolution_mocks.save_token).toHaveBeenCalledWith("a.b.c");
    expect(resolution_mocks.save_profile_id).toHaveBeenCalledWith("profile-1");
  });

  it("fails when token generation fails", async () => {
    resolution_mocks.generate_token_for_profile.mockResolvedValue({
      success: false,
      error: "signing failed",
    });

    const result = await resolve_signed_in_session([PROFILE], {
      status: "missing",
    });

    expect(result).toEqual({ success: false, error: "signing failed" });
    expect(resolution_mocks.save_token).not.toHaveBeenCalled();
  });

  it("fails when the Clerk email is missing", async () => {
    resolution_mocks.get_clerk_email.mockReturnValue({ status: "missing" });

    const result = await resolve_signed_in_session([PROFILE], {
      status: "missing",
    });

    expect(result).toEqual({
      success: false,
      error:
        "no local profile found for the signed-in Clerk account — user may not be registered",
    });
  });

  it("never logs or returns the Clerk email or profile name", async () => {
    resolution_mocks.try_restore_signed_in_session.mockResolvedValue({
      status: "not_restored",
    });
    resolution_mocks.generate_token_for_profile.mockResolvedValue({
      success: true,
      data: TOKEN,
    });
    const error_spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const log_spy = vi.spyOn(console, "log").mockImplementation(() => {});

    const unmatched_result = await resolve_signed_in_session([], {
      status: "missing",
    });
    expect(
      (await resolve_signed_in_session([PROFILE], { status: "missing" }))
        .success,
    ).toBe(true);

    const logged_text = JSON.stringify([
      error_spy.mock.calls,
      log_spy.mock.calls,
      unmatched_result,
    ]);
    expect(logged_text).not.toContain("jane@example.test");
    expect(logged_text).not.toContain("Jane Doe");
  });
});
