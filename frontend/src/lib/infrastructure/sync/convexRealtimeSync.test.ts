import { afterEach, describe, expect, it, vi } from "vitest";

import {
  type ConvexRealtimeSync,
  create_convex_realtime_sync,
  DEFAULT_CHANGE_MARKER_QUERY,
  type RealtimeSyncDependencies,
} from "./convexRealtimeSync";

type ChangeHandler = (result: unknown) => unknown;

interface RealtimeHarness {
  sync: ConvexRealtimeSync;
  on_update: ReturnType<typeof vi.fn>;
  unsubscribe: ReturnType<typeof vi.fn>;
  pull_table: RealtimeSyncDependencies["pull_table"];
  on_table_pulled: ReturnType<typeof vi.fn>;
  emit: (table_name: string, latest_sequence: number) => Promise<void>;
}

function create_harness(
  pull_table: RealtimeSyncDependencies["pull_table"] = vi
    .fn()
    .mockResolvedValue({ success: true, records_pulled: 1 }),
): RealtimeHarness {
  const handlers = new Map<string, ChangeHandler>();
  const unsubscribe = vi.fn();
  const on_update = vi.fn(
    (
      _query: unknown,
      args: Record<string, unknown>,
      handler: ChangeHandler,
    ) => {
      handlers.set(String(args.table_name), handler);
      return { unsubscribe };
    },
  );
  const on_table_pulled = vi.fn(() => true);
  const sync = create_convex_realtime_sync({
    subscribable_client: { onUpdate: on_update },
    pull_table,
    table_names: ["teams", "players"],
    query_reference: DEFAULT_CHANGE_MARKER_QUERY,
    on_table_pulled,
  });
  const emit = async (
    table_name: string,
    latest_sequence: number,
  ): Promise<void> => {
    handlers.get(table_name)?.({ table_name, latest_sequence });
    await new Promise((resolve) => setTimeout(resolve, 0));
  };
  return { sync, on_update, unsubscribe, pull_table, on_table_pulled, emit };
}

describe("ConvexRealtimeSync", () => {
  let active_sync: ConvexRealtimeSync;

  afterEach(() => {
    active_sync?.stop();
  });

  it("subscribes to the change marker of every table", () => {
    const harness = create_harness();
    active_sync = harness.sync;
    expect(harness.sync.start()).toBe(true);
    expect(harness.sync.start()).toBe(false);
    expect(harness.on_update).toHaveBeenCalledTimes(2);
    expect(harness.on_update).toHaveBeenCalledWith(
      DEFAULT_CHANGE_MARKER_QUERY,
      { table_name: "teams" },
      expect.any(Function),
    );
  });

  it("pulls on the first callback so changes made before subscribing are not skipped", async () => {
    const harness = create_harness();
    active_sync = harness.sync;
    harness.sync.start();
    await harness.emit("teams", 12);
    expect(harness.pull_table).toHaveBeenCalledWith("teams");
    expect(harness.on_table_pulled).toHaveBeenCalledWith("teams");
  });

  it("does not pull again when the marker has not moved past what was pulled", async () => {
    const harness = create_harness();
    active_sync = harness.sync;
    harness.sync.start();
    await harness.emit("teams", 12);
    await harness.emit("teams", 12);
    expect(harness.pull_table).toHaveBeenCalledTimes(1);
  });

  it("ignores empty tables", async () => {
    const harness = create_harness();
    active_sync = harness.sync;
    harness.sync.start();
    await harness.emit("teams", 0);
    expect(harness.pull_table).not.toHaveBeenCalled();
  });

  it("coalesces markers that arrive while a pull is running", async () => {
    let release_first_pull: (value: unknown) => void = () => true;
    const pull_table = vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            release_first_pull = () =>
              resolve({ success: true, records_pulled: 1 });
          }),
      )
      .mockResolvedValue({ success: true, records_pulled: 1 });
    const harness = create_harness(pull_table);
    active_sync = harness.sync;
    harness.sync.start();
    await harness.emit("teams", 1);
    await harness.emit("teams", 2);
    await harness.emit("teams", 3);
    release_first_pull(true);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(pull_table).toHaveBeenCalledTimes(2);
    expect(harness.sync.get_table_status("teams")).toMatchObject({
      status: "found",
      table_status: { remote_latest_sequence: 3, pulled_through_sequence: 3 },
    });
  });

  it("retries on the next marker after a failed pull", async () => {
    const pull_table = vi
      .fn()
      .mockResolvedValueOnce({ success: false, records_pulled: 0 })
      .mockResolvedValue({ success: true, records_pulled: 1 });
    const harness = create_harness(pull_table);
    active_sync = harness.sync;
    harness.sync.start();
    await harness.emit("teams", 4);
    await harness.emit("teams", 4);
    expect(pull_table).toHaveBeenCalledTimes(2);
    expect(harness.on_table_pulled).toHaveBeenCalledTimes(1);
  });

  it("keeps operating when a pull throws", async () => {
    const pull_table = vi.fn().mockRejectedValue(new Error("network down"));
    const harness = create_harness(pull_table);
    active_sync = harness.sync;
    harness.sync.start();
    await harness.emit("teams", 4);
    expect(harness.sync.is_running()).toBe(true);
  });

  it("unsubscribes and forgets state on stop", () => {
    const harness = create_harness();
    harness.sync.start();
    expect(harness.sync.stop()).toBe(true);
    expect(harness.sync.stop()).toBe(false);
    expect(harness.unsubscribe).toHaveBeenCalledTimes(2);
    expect(harness.sync.get_table_status("teams")).toEqual({
      status: "missing",
    });
  });

  it("reports watched tables and the latest seen sequences", async () => {
    const harness = create_harness();
    active_sync = harness.sync;
    harness.sync.start();
    await harness.emit("players", 5);
    expect(harness.sync.get_watched_tables()).toEqual(["teams", "players"]);
    expect(harness.sync.get_all_table_statuses()).toEqual({
      teams: "0",
      players: "5",
    });
  });
});
