import { describe, expect, it } from "vitest";

import {
  create_stopped_sync_engine,
  transition_sync_engine,
} from "./syncEngineStateMachine";
import {
  run_events,
  started_online,
  syncing_machine,
} from "./syncEngineStateMachine.test_support";
import {
  SyncEngineEventType as Event,
  SyncEngineStatus as Status,
  SyncRetryReason,
} from "./syncEngineTypes";

describe("sync engine waiting states", () => {
  it("waits for the server backfill and retries with a full sync", () => {
    const transition = transition_sync_engine(syncing_machine(), {
      type: Event.RUN_DEFERRED,
      run_id: "run_1",
      reason: SyncRetryReason.SERVER_BACKFILL,
      retry_at: 31_000,
    });
    expect(transition.machine.state).toEqual({
      status: Status.WAITING_TO_RETRY,
      reason: SyncRetryReason.SERVER_BACKFILL,
      retry_at: 31_000,
      retry_run_kind: "full",
    });
    expect(transition.effects).toContainEqual({
      type: "schedule_retry",
      retry_at: 31_000,
    });
    const retried = transition_sync_engine(transition.machine, {
      type: Event.RETRY_ELAPSED,
      next_run_id: "run_2",
    });
    expect(retried.machine.state).toMatchObject({
      status: Status.SYNCING,
      run_kind: "full",
      attempt: 0,
    });
  });

  it("defers instead of backing off when another sync is already running", () => {
    const machine = run_events(syncing_machine(), [
      {
        type: Event.RUN_DEFERRED,
        run_id: "run_1",
        reason: SyncRetryReason.ANOTHER_SYNC_RUNNING,
        retry_at: 5_000,
      },
    ]);
    expect(machine.state).toEqual({
      status: Status.WAITING_TO_RETRY,
      reason: SyncRetryReason.ANOTHER_SYNC_RUNNING,
      retry_at: 5_000,
      retry_run_kind: "push",
    });
  });

  it("cancels the in-flight run when stopped or suspended", () => {
    for (const event_type of [Event.STOP, Event.SUSPEND] as const) {
      const transition = transition_sync_engine(syncing_machine(), {
        type: event_type,
      });
      expect(transition.effects).toContainEqual({ type: "cancel_run" });
    }
  });

  it("remembers local changes made while suspended and pushes them on resume", () => {
    const suspended = run_events(started_online, [
      { type: Event.SUSPEND },
      { type: Event.LOCAL_CHANGE_RECORDED },
    ]);
    expect(suspended.state).toEqual({
      status: Status.SUSPENDED,
      queued_follow_up: "push",
    });
    const resumed = transition_sync_engine(suspended, { type: Event.RESUME });
    expect(resumed.machine.state.status).toBe(Status.DEBOUNCING);
    expect(resumed.effects).toEqual([{ type: "schedule_debounce" }]);
  });

  it("remembers local changes made while stopped and pushes them on start", () => {
    const stopped = run_events(create_stopped_sync_engine(true), [
      { type: Event.LOCAL_CHANGE_RECORDED },
    ]);
    const started = transition_sync_engine(stopped, {
      type: Event.START,
      is_online: true,
    });
    expect(started.machine.state.status).toBe(Status.DEBOUNCING);
  });

  it("starts idle when nothing was queued while halted", () => {
    const resumed = run_events(started_online, [
      { type: Event.SUSPEND },
      { type: Event.RESUME },
    ]);
    expect(resumed.state.status).toBe(Status.IDLE);
  });
});
