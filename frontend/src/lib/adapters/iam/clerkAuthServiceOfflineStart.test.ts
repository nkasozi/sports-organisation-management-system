import { get } from "svelte/store";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  create_fake_clerk,
  type FakeClerk,
} from "./clerkAuthService.test_support";

type ClerkAuthServiceModule = typeof import("./clerkAuthService");

interface StubbedWindow {
  Clerk?: FakeClerk;
}

async function load_service(
  stubbed_window: StubbedWindow,
  online: boolean,
): Promise<ClerkAuthServiceModule> {
  vi.resetModules();
  vi.doMock("$app/environment", () => ({ browser: true }));
  vi.doMock("$env/static/public", () => ({
    PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test",
  }));
  vi.stubGlobal("window", stubbed_window);
  vi.stubGlobal("navigator", { onLine: online });
  vi.stubGlobal("requestAnimationFrame", () => 1);
  return import("./clerkAuthService");
}

describe("clerkAuthService offline cold start", () => {
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

  it("gives up immediately when the browser is offline", async () => {
    const service = await load_service({}, false);

    expect(await service.initialize_clerk()).toBe(false);
    expect(get(service.is_clerk_loaded)).toBe(true);
    expect(get(service.is_signed_in)).toBe(false);
    expect(service.get_clerk_reachability()).toEqual({
      status: "unreachable",
    });
  });

  it("publishes the unavailable state without waiting for an animation frame", async () => {
    const service = await load_service({}, false);
    await service.initialize_clerk();

    expect(get(service.clerk_session).is_loaded).toBe(true);
  });

  it("shares one in-flight initialization between callers", async () => {
    const stubbed_window: StubbedWindow = {};
    const service = await load_service(stubbed_window, true);
    const first = service.initialize_clerk();
    const second = service.initialize_clerk();
    stubbed_window.Clerk = create_fake_clerk();
    await vi.advanceTimersByTimeAsync(200);

    expect(await first).toBe(true);
    expect(await second).toBe(true);
    expect(stubbed_window.Clerk.addListener).toHaveBeenCalledTimes(1);
  });

  it("remembers a failed initialization instead of waiting again", async () => {
    const service = await load_service({}, true);
    const first = service.initialize_clerk();
    await vi.advanceTimersByTimeAsync(10_000);
    expect(await first).toBe(false);

    const started_at = Date.now();
    expect(await service.initialize_clerk()).toBe(false);
    expect(Date.now() - started_at).toBe(0);
  });

  it("retries after reconnecting and signs the user back in", async () => {
    const stubbed_window: StubbedWindow = {};
    const service = await load_service(stubbed_window, false);
    await service.initialize_clerk();
    vi.stubGlobal("navigator", { onLine: true });
    stubbed_window.Clerk = create_fake_clerk();
    const retry = service.retry_clerk_initialization();
    await vi.advanceTimersByTimeAsync(200);

    expect(await retry).toBe(true);
    expect(get(service.is_signed_in)).toBe(true);
  });

  it("asks the Clerk provider to reload its script when retrying without Clerk", async () => {
    const stubbed_window: StubbedWindow = {};
    const service = await load_service(stubbed_window, false);
    await service.initialize_clerk();
    const generation_before = get(service.clerk_provider_generation);
    vi.stubGlobal("navigator", { onLine: true });
    const retry = service.retry_clerk_initialization();
    stubbed_window.Clerk = create_fake_clerk();
    await vi.advanceTimersByTimeAsync(200);

    expect(await retry).toBe(true);
    expect(get(service.clerk_provider_generation)).toBe(generation_before + 1);
  });

  it("does not retry while still offline", async () => {
    const service = await load_service({}, false);
    await service.initialize_clerk();

    expect(await service.retry_clerk_initialization()).toBe(false);
  });
});
