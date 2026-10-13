import { describe, expect, it } from "vitest";

import { create_none_option, create_some_option } from "../types/Option";
import {
  build_fixture_clock_state,
  compute_fixture_clock_elapsed_seconds,
  FIXTURE_CLOCK_STATUS,
  read_fixture_clock_state,
  to_fixture_clock_fields,
} from "./FixtureClock";

const STARTED_AT = "2024-06-01T10:00:00.000Z";

describe("read_fixture_clock_state", () => {
  it("reads a running clock with its start time", () => {
    expect(
      read_fixture_clock_state({
        clock_status: FIXTURE_CLOCK_STATUS.RUNNING,
        clock_elapsed_seconds: 125,
        clock_started_at: STARTED_AT,
      } as never),
    ).toEqual(
      create_some_option({
        status: FIXTURE_CLOCK_STATUS.RUNNING,
        elapsed_seconds: 125,
        started_at: STARTED_AT,
      }),
    );
  });

  it("reads a stopped clock", () => {
    expect(
      read_fixture_clock_state({
        clock_status: FIXTURE_CLOCK_STATUS.STOPPED,
        clock_elapsed_seconds: 61,
      } as never),
    ).toEqual(
      create_some_option({
        status: FIXTURE_CLOCK_STATUS.STOPPED,
        elapsed_seconds: 61,
      }),
    );
  });

  it("treats fixtures saved before clock tracking as having no clock state", () => {
    expect(read_fixture_clock_state({} as never)).toEqual(create_none_option());
    expect(
      read_fixture_clock_state({
        clock_status: FIXTURE_CLOCK_STATUS.RUNNING,
        clock_elapsed_seconds: 10,
      } as never),
    ).toEqual(create_none_option());
    expect(
      read_fixture_clock_state({
        clock_status: FIXTURE_CLOCK_STATUS.STOPPED,
      } as never),
    ).toEqual(create_none_option());
  });
});

describe("compute_fixture_clock_elapsed_seconds", () => {
  it("adds the whole seconds since a running clock started", () => {
    expect(
      compute_fixture_clock_elapsed_seconds(
        {
          status: FIXTURE_CLOCK_STATUS.RUNNING,
          elapsed_seconds: 100,
          started_at: STARTED_AT,
        } as never,
        new Date("2024-06-01T10:01:05.900Z"),
      ),
    ).toBe(165);
  });

  it("never counts backwards when the device clock is behind", () => {
    expect(
      compute_fixture_clock_elapsed_seconds(
        {
          status: FIXTURE_CLOCK_STATUS.RUNNING,
          elapsed_seconds: 100,
          started_at: STARTED_AT,
        } as never,
        new Date("2024-06-01T09:59:00.000Z"),
      ),
    ).toBe(100);
  });

  it("keeps the saved seconds for a stopped clock", () => {
    expect(
      compute_fixture_clock_elapsed_seconds(
        { status: FIXTURE_CLOCK_STATUS.STOPPED, elapsed_seconds: 42 },
        new Date("2024-06-01T11:00:00.000Z"),
      ),
    ).toBe(42);
  });
});

describe("building and saving clock state", () => {
  it("builds running and stopped states from the live clock", () => {
    const now = new Date(STARTED_AT);
    expect(build_fixture_clock_state(true, 30, now)).toEqual({
      status: FIXTURE_CLOCK_STATUS.RUNNING,
      elapsed_seconds: 30,
      started_at: STARTED_AT,
    });
    expect(build_fixture_clock_state(false, 30, now)).toEqual({
      status: FIXTURE_CLOCK_STATUS.STOPPED,
      elapsed_seconds: 30,
    });
  });

  it("maps clock states to fixture fields", () => {
    expect(
      to_fixture_clock_fields({
        status: FIXTURE_CLOCK_STATUS.RUNNING,
        elapsed_seconds: 30,
        started_at: STARTED_AT,
      } as never),
    ).toEqual({
      clock_status: "running",
      clock_elapsed_seconds: 30,
      clock_started_at: STARTED_AT,
    });
    expect(
      to_fixture_clock_fields({
        status: FIXTURE_CLOCK_STATUS.STOPPED,
        elapsed_seconds: 30,
      }),
    ).toEqual({ clock_status: "stopped", clock_elapsed_seconds: 30 });
  });
});
