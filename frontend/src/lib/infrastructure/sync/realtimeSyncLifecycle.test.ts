import { afterEach, describe, expect, it, vi } from "vitest";

import {
  get_realtime_sync_adapter,
  start_realtime_sync,
  stop_realtime_sync,
} from "./realtimeSyncLifecycle";

vi.mock("$lib/adapters/repositories/database", () => ({
  get_database: vi.fn(),
}));

function start_watching(): ReturnType<typeof vi.fn> {
  const on_update = vi.fn(() => ({ unsubscribe: vi.fn() }));
  start_realtime_sync(
    { onUpdate: on_update },
    { query: vi.fn(), mutation: vi.fn() },
    "sync:get_table_change_marker",
  );
  return on_update;
}

afterEach(() => {
  stop_realtime_sync();
});

describe("realtime sync adapter pause and resume", () => {
  it("can resume watching after the adapter paused it", () => {
    const on_update = start_watching();
    const adapter = get_realtime_sync_adapter();
    const subscriptions_after_start = on_update.mock.calls.length;

    expect(adapter.stop().success).toBe(true);
    expect(adapter.is_running()).toBe(false);
    expect(adapter.start().success).toBe(true);

    expect(adapter.is_running()).toBe(true);
    expect(on_update.mock.calls.length).toBe(subscriptions_after_start * 2);
  });

  it("cannot resume after a full teardown", () => {
    start_watching();
    stop_realtime_sync();

    expect(get_realtime_sync_adapter().start().success).toBe(false);
  });
});
