import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  create_fake_clerk,
  type FakeClerk,
  install_clerk_globals,
} from "./clerkAuthService.test_support";

type ClerkAuthServiceModule = typeof import("./clerkAuthService");

async function load_service(
  clerk: FakeClerk | false,
): Promise<ClerkAuthServiceModule> {
  vi.resetModules();
  vi.doMock("$app/environment", () => ({ browser: true }));
  vi.doMock("$env/static/public", () => ({
    PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test",
  }));
  install_clerk_globals(clerk);
  return import("./clerkAuthService");
}

function stub_network_online(online: boolean): boolean {
  vi.stubGlobal("navigator", { onLine: online });
  return true;
}

describe("clerkAuthService reachability", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.doUnmock("$app/environment");
    vi.doUnmock("$env/static/public");
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("confirms Clerk once a ready instance answers while online", async () => {
    const service = await load_service({
      ...create_fake_clerk(),
      status: "ready",
    } as FakeClerk);
    stub_network_online(true);
    await service.initialize_clerk();

    expect(service.get_clerk_reachability()).toEqual({ status: "confirmed" });
  });

  it("reports Clerk pending before it has been initialized", async () => {
    const service = await load_service(false);
    stub_network_online(true);

    expect(service.get_clerk_reachability()).toEqual({ status: "pending" });
  });

  it("reports Clerk unreachable when the browser is offline", async () => {
    const service = await load_service({
      ...create_fake_clerk(),
      status: "ready",
    } as FakeClerk);
    stub_network_online(false);
    await service.initialize_clerk();

    expect(service.get_clerk_reachability()).toEqual({
      status: "unreachable",
    });
  });
});
