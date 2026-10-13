import { describe, expect, it } from "vitest";

import { create_sync_in_flight_work } from "./syncInFlightWork";

function create_gate(): { promise: Promise<boolean>; open: () => boolean } {
  let open_gate = (): boolean => false;
  const promise = new Promise<boolean>((resolve) => {
    open_gate = (): boolean => {
      resolve(true);
      return true;
    };
  });
  return { promise, open: () => open_gate() };
}

describe("sync in-flight work", () => {
  it("waits for tracked work that is still running before reporting idle", async () => {
    const work = create_sync_in_flight_work();
    const gate = create_gate();
    const events: string[] = [];
    const tracked = work.run_tracked(async () => {
      await gate.promise;
      events.push("pull_finished");
      return true;
    });

    const idle = work.pause_and_wait_until_idle().then((settled_count) => {
      events.push(`idle:${settled_count}`);
      return settled_count;
    });
    gate.open();
    await Promise.all([tracked, idle]);

    expect(events).toEqual(["pull_finished", "idle:1"]);
  });

  it("skips gated work while paused and runs it again after resuming", async () => {
    const work = create_sync_in_flight_work();
    await work.pause_and_wait_until_idle();

    const while_paused = await work.run_if_accepting(
      async () => "pulled",
      () => "skipped",
    );
    work.resume();
    const after_resume = await work.run_if_accepting(
      async () => "pulled",
      () => "skipped",
    );

    expect([while_paused, after_resume]).toEqual(["skipped", "pulled"]);
  });

  it("still waits for work whose promise rejects", async () => {
    const work = create_sync_in_flight_work();
    const failing = work.run_tracked(async () =>
      Promise.reject(new Error("network")),
    );

    const settled_count = await work.pause_and_wait_until_idle();

    expect(settled_count).toBe(1);
    expect(
      await failing.then(
        () => "ok",
        () => "rejected",
      ),
    ).toBe("rejected");
  });
});
