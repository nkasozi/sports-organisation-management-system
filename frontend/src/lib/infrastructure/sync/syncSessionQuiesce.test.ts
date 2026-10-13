import { afterEach, describe, expect, it, vi } from "vitest";

import { sync_in_flight_work } from "./syncInFlightWork";
import { ConvexSyncManager } from "./syncManager";
import {
  start_background_sync_and_resume,
  stop_background_sync_and_wait_for_idle,
} from "./syncSessionQuiesce";
import type { ConvexClient, SyncResult } from "./syncTypes";

const mocks = vi.hoisted(() => ({
  stop_background_sync: vi.fn(() => true),
  start_background_sync: vi.fn(() => true),
  sync_all_tables: vi.fn(),
}));

vi.mock("./backgroundSyncService", () => ({
  stop_background_sync: mocks.stop_background_sync,
  start_background_sync: mocks.start_background_sync,
}));

vi.mock("./syncOrchestrator", () => ({
  sync_all_tables: mocks.sync_all_tables,
}));

afterEach(() => {
  sync_in_flight_work.resume();
  vi.clearAllMocks();
});

const COMPLETED_RUN = { success: true } as SyncResult;

describe("stop_background_sync_and_wait_for_idle", () => {
  it("resolves only after an in-flight sync run has finished", async () => {
    const events: string[] = [];
    let finish_run = (): boolean => false;
    mocks.sync_all_tables.mockImplementation(
      () =>
        new Promise<SyncResult>((resolve) => {
          finish_run = (): boolean => {
            events.push("run_finished");
            resolve(COMPLETED_RUN);
            return true;
          };
        }),
    );
    const manager = new ConvexSyncManager({
      convex_url: "https://example.test",
    });
    manager.set_convex_client({
      query: vi.fn(),
      mutation: vi.fn(),
    } as ConvexClient);
    const run = manager.sync_now();
    await Promise.resolve();

    const stopped = stop_background_sync_and_wait_for_idle().then((count) => {
      events.push("idle");
      return count;
    });
    await new Promise((resolve) => setTimeout(resolve, 0));
    finish_run();
    await Promise.all([run, stopped]);

    expect(mocks.stop_background_sync).toHaveBeenCalledOnce();
    expect(events).toEqual(["run_finished", "idle"]);
  });

  it("resumes realtime work when background sync starts again", async () => {
    await stop_background_sync_and_wait_for_idle();

    start_background_sync_and_resume();
    const outcome = await sync_in_flight_work.run_if_accepting(
      async () => "ran",
      () => "paused",
    );

    expect(mocks.start_background_sync).toHaveBeenCalledOnce();
    expect(outcome).toBe("ran");
  });
});
