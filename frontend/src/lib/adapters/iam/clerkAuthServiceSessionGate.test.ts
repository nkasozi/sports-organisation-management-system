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

describe("clerkAuthService pending sign-out gate", () => {
  beforeEach(() => {
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

  it("hides a lingering Clerk session while a sign-out is pending", async () => {
    const service = await load_initialized_service(create_fake_clerk());
    service.suppress_clerk_session_until_signed_out();

    expect(get(service.is_signed_in)).toBe(false);
    expect(get(service.clerk_session).is_loaded).toBe(true);
    expect((await service.get_session_token()).success).toBe(false);
  });

  it("keeps the session hidden when Clerk reports changes", async () => {
    const clerk = create_fake_clerk();
    const service = await load_initialized_service(clerk);
    service.suppress_clerk_session_until_signed_out();
    const listener = clerk.addListener.mock.calls[0][0] as () => void;
    listener();

    expect(get(service.is_signed_in)).toBe(false);
  });

  it("restores Clerk state once the gate is released", async () => {
    const service = await load_initialized_service(create_fake_clerk());
    service.suppress_clerk_session_until_signed_out();
    service.release_clerk_session_gate();

    expect(get(service.is_signed_in)).toBe(true);
  });
});

describe("clerkAuthService sign-out", () => {
  beforeEach(() => {
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

  it("expires the app-domain session cookie even when Clerk cannot be reached", async () => {
    const clerk = create_fake_clerk();
    clerk.signOut.mockRejectedValueOnce(new Error("offline"));
    const service = await load_initialized_service(clerk);
    const written_cookies: string[] = [];
    vi.stubGlobal("document", {
      get cookie(): string {
        return "__session=abc; __session_Xy12=def; theme=dark";
      },
      set cookie(value: string) {
        written_cookies.push(value);
      },
    });

    expect((await service.sign_out()).success).toBe(false);
    expect(
      written_cookies.some((value) => value.startsWith("__session=")),
    ).toBe(true);
    expect(
      written_cookies.some((value) => value.startsWith("__session_Xy12=")),
    ).toBe(true);
    expect(written_cookies.some((value) => value.startsWith("theme="))).toBe(
      false,
    );
  });

  it("stops waiting for Clerk sign-out after a timeout", async () => {
    vi.useFakeTimers();
    const clerk = create_fake_clerk();
    clerk.signOut.mockReturnValueOnce(new Promise(() => {}));
    const service = await load_initialized_service(clerk);
    const pending = service.sign_out();
    await vi.advanceTimersByTimeAsync(10_000);

    expect(await pending).toEqual({
      success: false,
      error: "We could not sign you out. Please try again.",
    });
  });
});
