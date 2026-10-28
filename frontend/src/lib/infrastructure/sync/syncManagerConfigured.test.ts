import { describe, expect, it } from "vitest";

import { ConvexSyncManager } from "./syncManager";

const FAKE_CLIENT = {
  query: async (): Promise<unknown> => [],
  mutation: async (): Promise<unknown> => ({}),
};

describe("ConvexSyncManager.is_configured", () => {
  it("is not configured before the app connects it to the server", () => {
    expect(new ConvexSyncManager().is_configured()).toBe(false);
  });

  it("is configured once the app hands it a server connection, even without a URL in its settings", () => {
    const manager = new ConvexSyncManager();
    manager.set_convex_client(FAKE_CLIENT as never);
    expect(manager.is_configured()).toBe(true);
  });
});
