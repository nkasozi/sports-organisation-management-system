import { get } from "svelte/store";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  create_fake_clerk,
  type FakeClerk,
  install_clerk_globals,
} from "./clerkAuthService.test_support";

type ClerkAuthServiceModule = typeof import("./clerkAuthService");

async function load_service(
  browser = true,
  publishable_key = "pk_test",
): Promise<ClerkAuthServiceModule> {
  vi.resetModules();
  vi.doMock("$app/environment", () => ({ browser }));
  vi.doMock("$env/static/public", () => ({
    PUBLIC_CLERK_PUBLISHABLE_KEY: publishable_key,
  }));
  return import("./clerkAuthService");
}

async function initialize_with(
  clerk: FakeClerk | false,
): Promise<{ service: ClerkAuthServiceModule; initialized: boolean }> {
  install_clerk_globals(clerk);
  const service = await load_service();
  const pending = service.initialize_clerk();
  await vi.advanceTimersByTimeAsync(20000);
  return { service, initialized: await pending };
}

describe("clerkAuthService initialize_clerk", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.doUnmock("$app/environment");
    vi.doUnmock("$env/static/public");
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("skips outside the browser", async () => {
    install_clerk_globals(create_fake_clerk());
    const service = await load_service(false);

    expect(await service.initialize_clerk()).toBe(false);
    expect(get(service.clerk_session).is_loaded).toBe(false);
  });

  it("marks clerk loaded without a session when no key is configured", async () => {
    install_clerk_globals(create_fake_clerk());
    const service = await load_service(true, "");

    expect(await service.initialize_clerk()).toBe(false);
    expect(get(service.is_clerk_loaded)).toBe(true);
    expect(get(service.is_signed_in)).toBe(false);
  });

  it("initializes from a loaded clerk with a signed in user", async () => {
    const clerk = create_fake_clerk();
    const { service, initialized } = await initialize_with(clerk);

    expect(initialized).toBe(true);
    expect(get(service.clerk_session)).toEqual({
      is_loaded: true,
      is_signed_in: true,
      user_state: {
        status: "present",
        user: {
          id: "user_1",
          email_address: "ann@example.com",
          full_name: "Ann Lee",
          first_name: "Ann",
          last_name: "Lee",
          image_url: "img.png",
        },
      },
      session_id_state: { status: "present", session_id: "sess_1" },
    });
    expect(clerk.addListener).toHaveBeenCalledTimes(1);
    expect(await service.initialize_clerk()).toBe(true);
    expect(service.get_clerk().success).toBe(true);
  });

  it("gives up when clerk never appears", async () => {
    const { service, initialized } = await initialize_with(false);

    expect(initialized).toBe(false);
    expect(get(service.is_clerk_loaded)).toBe(true);
    expect(service.get_clerk()).toEqual({
      success: false,
      error: "Clerk not initialized",
    });
  });

  it("proceeds when clerk never finishes loading or never gets a session", async () => {
    const clerk = create_fake_clerk({ loaded: false, session: false });
    const { service, initialized } = await initialize_with(clerk);

    expect(initialized).toBe(true);
    expect(get(service.clerk_session).is_signed_in).toBe(false);
    expect(get(service.clerk_session).session_id_state).toEqual({
      status: "missing",
    });
  });

  it("waits for a late session to appear", async () => {
    const clerk = create_fake_clerk({ session: false });
    install_clerk_globals(clerk);
    const service = await load_service();
    const pending = service.initialize_clerk();
    await vi.advanceTimersByTimeAsync(500);
    clerk.session = { id: "sess_late", getToken: vi.fn() };
    await vi.advanceTimersByTimeAsync(500);

    expect(await pending).toBe(true);
    expect(get(service.clerk_session).session_id_state).toEqual({
      status: "present",
      session_id: "sess_late",
    });
  });

  it("reports initialization failures", async () => {
    const clerk = { ...create_fake_clerk(), addListener: "not callable" };
    const { service, initialized } = await initialize_with(
      clerk as unknown as FakeClerk,
    );

    expect(initialized).toBe(false);
    expect(get(service.is_clerk_loaded)).toBe(true);
  });
});
