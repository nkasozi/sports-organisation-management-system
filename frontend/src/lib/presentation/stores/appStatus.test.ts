import { get } from "svelte/store";
import { beforeEach, describe, expect, it } from "vitest";

import { app_status_store, is_offline_mode, offline_reason } from "./appStatus";

describe("appStatus", () => {
  beforeEach(() => {
    app_status_store.reset();
  });

  it("tracks offline status and exposes matching derived values", () => {
    app_status_store.set_offline("network unavailable");

    expect(get(app_status_store)).toEqual({
      connection_status: "offline",
      offline_reason: "network unavailable",
    });
    expect(get(is_offline_mode)).toBe(true);
    expect(get(offline_reason)).toBe("network unavailable");
  });

  it("clears the offline reason when returning online or resetting", () => {
    app_status_store.set_offline("timed out");
    app_status_store.set_online();

    expect(get(app_status_store)).toEqual({
      connection_status: "online",
      offline_reason: "",
    });
    expect(get(is_offline_mode)).toBe(false);

    app_status_store.reset();

    expect(get(app_status_store)).toEqual({
      connection_status: "unknown",
      offline_reason: "",
    });
  });
});
