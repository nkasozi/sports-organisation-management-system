import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { look_up_login_profile } from "./layoutLoginProfileLookup";

const PROFILE = { email: "ann@example.com", organization_id: "org-1" };

describe("look_up_login_profile", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("returns the profile the server found", async () => {
    await expect(
      look_up_login_profile(
        async () => ({ success: true, data: PROFILE }) as never,
      ),
    ).resolves.toEqual({ status: "found", profile: PROFILE });
  });

  it("reports an unregistered account when the server answered without a profile", async () => {
    await expect(
      look_up_login_profile(async () => ({
        success: false,
        error: "Profile not found in Convex",
      })),
    ).resolves.toEqual({
      status: "not_found",
      error: "Profile not found in Convex",
    });
  });

  it("treats a failed request as a temporary outage", async () => {
    await expect(
      look_up_login_profile(async () => ({
        success: false,
        error: "Your profile could not be loaded right now. Please try again.",
      })),
    ).resolves.toMatchObject({ status: "unavailable" });
  });

  it("treats a hanging request as a temporary outage", async () => {
    vi.useFakeTimers();
    const pending = look_up_login_profile(() => new Promise(() => {}));
    await vi.advanceTimersByTimeAsync(15_000);

    await expect(pending).resolves.toMatchObject({ status: "unavailable" });
  });
});
