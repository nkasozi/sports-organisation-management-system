import { afterEach, describe, expect, it, vi } from "vitest";

import {
  start_realtime_sync,
  stop_realtime_sync,
} from "./realtimeSyncLifecycle";
import { sync_in_flight_work } from "./syncInFlightWork";

const pull_mock = vi.hoisted(() => ({ pull: vi.fn() }));

vi.mock("$lib/adapters/repositories/database", () => ({
  get_database: vi.fn(),
}));

vi.mock("./syncPullService", () => ({
  pull_table_changes_from_convex: pull_mock.pull,
}));

type ChangeHandler = (result: unknown) => unknown;

function start_and_capture_teams_handler(): ChangeHandler {
  const handlers = new Map<string, ChangeHandler>();
  const on_update = vi.fn(
    (_query: unknown, args: { table_name: string }, handler: ChangeHandler) => {
      handlers.set(args.table_name, handler);
      return { unsubscribe: vi.fn() };
    },
  );
  start_realtime_sync(
    { onUpdate: on_update } as never,
    { query: vi.fn(), mutation: vi.fn() },
    "sync:get_table_change_marker",
  );
  return handlers.get("teams") as ChangeHandler;
}

afterEach(() => {
  stop_realtime_sync();
  sync_in_flight_work.resume();
  pull_mock.pull.mockReset();
});

describe("realtime pulls during session teardown", () => {
  it("does not start a pull while sync work is paused for teardown", async () => {
    pull_mock.pull.mockResolvedValue({
      success: true,
      data: { records_pulled: 1 },
    });
    const handle_teams_change = start_and_capture_teams_handler();
    await sync_in_flight_work.pause_and_wait_until_idle();

    handle_teams_change({ latest_sequence: 5 });
    await sync_in_flight_work.pause_and_wait_until_idle();

    expect(pull_mock.pull).not.toHaveBeenCalled();
  });

  it("is waited for by teardown when the pull was already running", async () => {
    let finish_pull = (): boolean => false;
    pull_mock.pull.mockImplementation(
      () =>
        new Promise((resolve) => {
          finish_pull = (): boolean => {
            resolve({ success: true, data: { records_pulled: 1 } });
            return true;
          };
        }),
    );
    const handle_teams_change = start_and_capture_teams_handler();
    handle_teams_change({ latest_sequence: 5 });
    await Promise.resolve();

    const idle = sync_in_flight_work.pause_and_wait_until_idle();
    finish_pull();

    expect(await idle).toBe(1);
  });
});
