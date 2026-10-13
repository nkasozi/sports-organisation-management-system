import { describe, expect, it } from "vitest";

import { transition_sync_engine } from "./syncEngineStateMachine";
import {
  run_events,
  started_online,
  syncing_machine,
} from "./syncEngineStateMachine.test_support";
import {
  SyncEngineEventType as Event,
  SyncEngineStatus as Status,
} from "./syncEngineTypes";

describe("sync engine connectivity", () => {
  it("waits offline and runs a full sync when the network returns", () => {
    const offline = run_events(started_online, [
      { type: Event.WENT_OFFLINE },
      { type: Event.LOCAL_CHANGE_RECORDED },
    ]);
    expect(offline.state.status).toBe(Status.OFFLINE_WAITING);
    const online = transition_sync_engine(offline, {
      type: Event.WENT_ONLINE,
      next_run_id: "run_9",
    });
    expect(online.machine.state).toMatchObject({
      status: Status.SYNCING,
      run_kind: "full",
    });
  });

  it("moves a failed run to offline waiting when it failed offline", () => {
    const machine = run_events(syncing_machine(), [
      { type: Event.WENT_OFFLINE },
      { type: Event.RUN_FAILED, run_id: "run_1", now: 0 },
    ]);
    expect(machine.state.status).toBe(Status.OFFLINE_WAITING);
  });

  it("drops a pending retry when going offline", () => {
    const machine = run_events(syncing_machine(), [
      { type: Event.RUN_FAILED, run_id: "run_1", now: 0 },
      { type: Event.WENT_OFFLINE },
    ]);
    expect(machine.state.status).toBe(Status.OFFLINE_WAITING);
  });
});
