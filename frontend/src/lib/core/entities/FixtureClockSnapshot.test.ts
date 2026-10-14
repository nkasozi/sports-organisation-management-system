import { describe, expect, it } from "vitest";

import { OptionStatus } from "../types/Option";
import {
  BREAK_CLOCK_STATUS,
  compute_break_elapsed_seconds,
  read_break_clock_state,
  read_clock_added_seconds,
  to_fixture_clock_snapshot_fields,
} from "./FixtureClockSnapshot";

const NOW = new Date("2024-06-01T10:05:00.000Z");

describe("to_fixture_clock_snapshot_fields", () => {
  it("stores the game clock, added time and the running break together", () => {
    expect(
      to_fixture_clock_snapshot_fields({
        game_clock: { status: "stopped", elapsed_seconds: 2700 },
        added_seconds: 180,
        break_clock: {
          status: BREAK_CLOCK_STATUS.ON_BREAK,
          started_at: "2024-06-01T10:00:00.000Z" as never,
        },
      }),
    ).toEqual({
      clock_status: "stopped",
      clock_elapsed_seconds: 2700,
      clock_added_seconds: 180,
      clock_break_started_at: "2024-06-01T10:00:00.000Z",
    });
  });

  it("clears the break start when the game is not on a break", () => {
    expect(
      to_fixture_clock_snapshot_fields({
        game_clock: {
          status: "running",
          elapsed_seconds: 10,
          started_at: "2024-06-01T10:00:00.000Z" as never,
        },
        added_seconds: 0,
        break_clock: { status: BREAK_CLOCK_STATUS.NOT_ON_BREAK },
      }),
    ).toMatchObject({ clock_added_seconds: 0, clock_break_started_at: "" });
  });
});

describe("reading persisted break and added time", () => {
  it("reads a running break and computes its elapsed seconds", () => {
    const break_clock = read_break_clock_state({
      clock_break_started_at: "2024-06-01T10:00:00.000Z" as never,
    });
    expect(break_clock.status).toBe(BREAK_CLOCK_STATUS.ON_BREAK);
    expect(compute_break_elapsed_seconds(break_clock, NOW)).toBe(300);
  });

  it.each([
    {},
    { clock_break_started_at: "" },
    { clock_break_started_at: "x" },
  ])("treats %j as not on a break", (fields) => {
    const break_clock = read_break_clock_state(fields as never);
    expect(break_clock).toEqual({ status: BREAK_CLOCK_STATUS.NOT_ON_BREAK });
    expect(compute_break_elapsed_seconds(break_clock, NOW)).toBe(0);
  });

  it("reads added seconds and ignores invalid values", () => {
    expect(read_clock_added_seconds({ clock_added_seconds: 120 })).toEqual({
      status: OptionStatus.SOME,
      value: 120,
    });
    expect(read_clock_added_seconds({ clock_added_seconds: -5 }).status).toBe(
      OptionStatus.NONE,
    );
    expect(read_clock_added_seconds({}).status).toBe(OptionStatus.NONE);
  });
});
