import { describe, expect, it } from "vitest";

import {
  calculate_retry_delay_ms,
  create_stopped_sync_engine,
  transition_sync_engine,
} from "./syncEngineStateMachine";
import {
  run_events,
  started_online,
  syncing_machine,
} from "./syncEngineStateMachine.test_support";
import {
  SYNC_RETRY_MAX_DELAY_MS,
  SyncEngineEventType as Event,
  SyncEngineStatus as Status,
} from "./syncEngineTypes";

describe("sync engine lifecycle", () => {
  it("starts idle", () => {
    expect(started_online.state).toEqual({ status: Status.IDLE });
  });

  it("ignores work events while stopped", () => {
    const transition = transition_sync_engine(
      create_stopped_sync_engine(true),
      {
        type: Event.PUSH_REQUESTED,
        next_run_id: "run_1",
      },
    );
    expect(transition.machine.state.status).toBe(Status.STOPPED);
    expect(transition.effects).toEqual([]);
  });

  it("stops from any running state cancelling timers and failing waiters", () => {
    const transition = transition_sync_engine(syncing_machine(), {
      type: Event.STOP,
    });
    expect(transition.machine.state.status).toBe(Status.STOPPED);
    expect(transition.effects.map((effect) => effect.type)).toEqual([
      "cancel_debounce",
      "cancel_retry",
      "cancel_run",
      "settle_waiters",
    ]);
  });

  it("suspends and resumes the interrupted push without losing its configuration", () => {
    const suspended = run_events(syncing_machine(), [{ type: Event.SUSPEND }]);
    expect(suspended.state.status).toBe(Status.SUSPENDED);
    const ignored = run_events(suspended, [
      { type: Event.RUN_SUCCEEDED, run_id: "run_1", next_run_id: "run_2" },
    ]);
    expect(ignored.state.status).toBe(Status.SUSPENDED);
    expect(run_events(suspended, [{ type: Event.RESUME }]).state.status).toBe(
      Status.DEBOUNCING,
    );
  });
});

describe("sync engine runs", () => {
  it("debounces local changes into a single push run", () => {
    const debouncing = transition_sync_engine(started_online, {
      type: Event.LOCAL_CHANGE_RECORDED,
    });
    expect(debouncing.machine.state.status).toBe(Status.DEBOUNCING);
    expect(debouncing.effects).toEqual([{ type: "schedule_debounce" }]);
    const syncing = transition_sync_engine(debouncing.machine, {
      type: Event.DEBOUNCE_ELAPSED,
      next_run_id: "run_1",
    });
    expect(syncing.machine.state).toMatchObject({
      status: Status.SYNCING,
      run_id: "run_1",
      run_kind: "push",
    });
    expect(syncing.effects).toContainEqual({
      type: "begin_run",
      run_id: "run_1",
      run_kind: "push",
    });
  });

  it("queues a follow-up run for changes made during a run", () => {
    const machine = run_events(syncing_machine(), [
      { type: Event.LOCAL_CHANGE_RECORDED },
    ]);
    const transition = transition_sync_engine(machine, {
      type: Event.RUN_SUCCEEDED,
      run_id: "run_1",
      next_run_id: "run_2",
    });
    expect(transition.machine.state).toMatchObject({
      status: Status.SYNCING,
      run_id: "run_2",
    });
  });

  it("returns to idle and settles waiters after a clean run", () => {
    const transition = transition_sync_engine(syncing_machine(), {
      type: Event.RUN_SUCCEEDED,
      run_id: "run_1",
      next_run_id: "run_2",
    });
    expect(transition.machine.state.status).toBe(Status.IDLE);
    expect(transition.effects).toEqual([
      { type: "settle_waiters", succeeded: true },
    ]);
  });

  it("ignores completions from stale runs", () => {
    const transition = transition_sync_engine(syncing_machine(), {
      type: Event.RUN_FAILED,
      run_id: "run_old",
      now: 0,
    });
    expect(transition.machine.state.status).toBe(Status.SYNCING);
  });

  it("always leaves syncing after a failure and schedules a backed-off retry", () => {
    const transition = transition_sync_engine(syncing_machine(), {
      type: Event.RUN_FAILED,
      run_id: "run_1",
      now: 1_000,
    });
    expect(transition.machine.state).toEqual({
      status: Status.FAILED,
      retry_at: 1_000 + calculate_retry_delay_ms(0),
      attempt: 1,
      retry_run_kind: "push",
    });
    const retried = transition_sync_engine(transition.machine, {
      type: Event.RETRY_ELAPSED,
      next_run_id: "run_2",
    });
    expect(retried.machine.state).toMatchObject({
      status: Status.SYNCING,
      attempt: 1,
    });
  });

  it("goes back to idle when a run is skipped", () => {
    expect(
      run_events(syncing_machine(), [
        { type: Event.RUN_SKIPPED, run_id: "run_1" },
      ]).state.status,
    ).toBe(Status.IDLE);
  });

  it("caps the retry delay", () => {
    expect(calculate_retry_delay_ms(50)).toBe(SYNC_RETRY_MAX_DELAY_MS);
  });
});
