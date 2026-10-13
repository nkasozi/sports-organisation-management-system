import { get } from "svelte/store";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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

describe("clerkAuthService sessions", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.doUnmock("$app/environment");
    vi.doUnmock("$env/static/public");
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("returns convex session tokens", async () => {
    const clerk = create_fake_clerk();
    const service = await load_initialized_service(clerk);

    expect(await service.get_session_token()).toEqual({
      success: true,
      data: "tok",
    });
    expect(clerk.session && clerk.session.getToken).toHaveBeenCalledWith({
      template: "convex",
    });
  });

  it("reports missing, empty and failing session tokens", async () => {
    const clerk = create_fake_clerk();
    const service = await load_initialized_service(clerk);
    const session = clerk.session as { getToken: ReturnType<typeof vi.fn> };
    session.getToken.mockResolvedValueOnce(null).mockRejectedValueOnce("x");

    expect(await service.get_session_token()).toEqual({
      success: false,
      error: "Clerk session token unavailable",
    });
    expect(await service.get_session_token()).toEqual({
      success: false,
      error: "Failed to get Clerk session token",
    });
    clerk.session = false;
    expect(await service.get_session_token()).toEqual({
      success: false,
      error: "No Clerk session available",
    });
  });

  it("signs out and resyncs the store from clerk", async () => {
    const clerk = create_fake_clerk();
    const service = await load_initialized_service(clerk);
    clerk.session = false;

    expect(await service.sign_out()).toEqual({ success: true, data: true });
    expect(clerk.signOut).toHaveBeenCalled();
    expect(get(service.is_signed_in)).toBe(false);
  });

  it("refuses to sign out or provide tokens before initialization", async () => {
    const service = await load_initialized_service(create_fake_clerk());
    service.destroy_clerk();

    expect(await service.sign_out()).toEqual({
      success: false,
      error: "Clerk not initialized",
    });
    expect((await service.get_session_token()).success).toBe(false);
    expect(get(service.is_clerk_loaded)).toBe(false);
  });

  it("defers listener updates while navigating", async () => {
    const clerk = create_fake_clerk();
    const service = await load_initialized_service(clerk);
    const listener = clerk.addListener.mock.calls[0][0] as () => void;
    clerk.session = false;

    service.set_navigating(true);
    listener();
    expect(get(service.is_signed_in)).toBe(true);

    service.set_navigating(false);
    expect(get(service.is_signed_in)).toBe(false);
  });
});
