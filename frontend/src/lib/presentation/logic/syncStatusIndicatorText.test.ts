import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { LastSyncTimeState } from "$lib/presentation/stores/syncStoreTypes";

import { format_sync_status_text } from "./syncStatusIndicatorText";

const recorded_last_sync_time: LastSyncTimeState = {
  status: "recorded",
  value: "2026-04-18T12:00:00.000Z",
};

describe("syncStatusIndicatorText", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-18T12:00:20.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("formats the last sync label from the current timer tick", () => {
    expect(
      format_sync_status_text({
        sync_in_progress: false,
        last_sync: recorded_last_sync_time,
        current_percentage: 0,
        relative_time_tick: 0,
      }),
    ).toBe("20s ago");

    vi.setSystemTime(new Date("2026-04-18T12:01:20.000Z"));

    expect(
      format_sync_status_text({
        sync_in_progress: false,
        last_sync: recorded_last_sync_time,
        current_percentage: 0,
        relative_time_tick: 1,
      }),
    ).toBe("1m ago");
  });

  it("returns the sync percentage while a sync is active", () => {
    expect(
      format_sync_status_text({
        sync_in_progress: true,
        last_sync: recorded_last_sync_time,
        current_percentage: 42,
        relative_time_tick: 0,
      }),
    ).toBe("42%");
  });
});
