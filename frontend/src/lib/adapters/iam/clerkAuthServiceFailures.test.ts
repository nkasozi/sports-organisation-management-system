import { get } from "svelte/store";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CLERK_MESSAGE } from "./clerkAuthConstants";
import {
  create_fake_clerk,
  type FakeClerk,
  install_clerk_globals,
} from "./clerkAuthService.test_support";

type ClerkAuthServiceModule = typeof import("./clerkAuthService");

async function load_initialized_service(
  clerk: FakeClerk,
): Promise<ClerkAuthServiceModule> {
  vi.resetModules();
  vi.doMock("$app/environment", () => ({ browser: true }));
  vi.doMock("$env/static/public", () => ({
    PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test",
  }));
  install_clerk_globals(clerk);
  const service = await import("./clerkAuthService");
  await service.initialize_clerk();
  return service;
}

describe("clerkAuthService failure handling", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => true);
    vi.spyOn(console, "error").mockImplementation(() => true);
  });

  afterEach(() => {
    vi.doUnmock("$app/environment");
    vi.doUnmock("$env/static/public");
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("does not expose a half-activated clerk after initialization throws", async () => {
    const clerk = { ...create_fake_clerk(), addListener: "not callable" };

    const service = await load_initialized_service(
      clerk as unknown as FakeClerk,
    );

    expect(service.get_clerk()).toEqual({
      success: false,
      error: CLERK_MESSAGE.NOT_INITIALIZED,
    });
    expect(get(service.is_clerk_loaded)).toBe(true);
    expect(get(service.is_signed_in)).toBe(false);
  });

  it("returns a friendly failure when clerk sign out rejects", async () => {
    const clerk = create_fake_clerk();
    clerk.signOut.mockRejectedValueOnce(new Error("network down"));
    const service = await load_initialized_service(clerk);

    expect(await service.sign_out()).toEqual({
      success: false,
      error: CLERK_MESSAGE.SIGN_OUT_FAILED,
    });
    expect(console.error).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ event: "clerk_sign_out_failed" }),
    );
  });
});
