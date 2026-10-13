import { FIXTURE_CLOCK_STATUS } from "$convex/shared_fixture_clock";

import type { IsoDateTimeString } from "../types/DomainScalars";
import {
  create_none_option,
  create_some_option,
  type Option,
} from "../types/Option";
import type { Fixture } from "./FixtureTypes";

export { FIXTURE_CLOCK_STATUS };

export type FixtureClockState =
  | { status: typeof FIXTURE_CLOCK_STATUS.STOPPED; elapsed_seconds: number }
  | {
      status: typeof FIXTURE_CLOCK_STATUS.RUNNING;
      elapsed_seconds: number;
      started_at: IsoDateTimeString;
    };

export type FixtureClockFields = Pick<
  Fixture,
  "clock_status" | "clock_elapsed_seconds" | "clock_started_at"
>;

const MILLISECONDS_PER_SECOND = 1000;
const NUMBER_TYPE_NAME = "number";
const STRING_TYPE_NAME = "string";

function is_valid_elapsed_seconds(value: unknown): value is number {
  return (
    typeof value === NUMBER_TYPE_NAME &&
    Number.isFinite(value) &&
    (value as number) >= 0
  );
}

function is_valid_start_time(value: unknown): value is IsoDateTimeString {
  return (
    typeof value === STRING_TYPE_NAME &&
    !Number.isNaN(new Date(value as string).getTime())
  );
}

function read_running_clock(
  fields: FixtureClockFields,
  elapsed_seconds: number,
): Option<FixtureClockState> {
  if (!is_valid_start_time(fields.clock_started_at))
    return create_none_option();
  return create_some_option({
    status: FIXTURE_CLOCK_STATUS.RUNNING,
    elapsed_seconds,
    started_at: fields.clock_started_at,
  });
}

export function read_fixture_clock_state(
  fields: FixtureClockFields,
): Option<FixtureClockState> {
  const elapsed_seconds = fields.clock_elapsed_seconds;
  const clock_status = fields.clock_status;
  if (!is_valid_elapsed_seconds(elapsed_seconds) || !clock_status)
    return create_none_option();
  switch (clock_status) {
    case FIXTURE_CLOCK_STATUS.STOPPED:
      return create_some_option({
        status: FIXTURE_CLOCK_STATUS.STOPPED,
        elapsed_seconds,
      });
    case FIXTURE_CLOCK_STATUS.RUNNING:
      return read_running_clock(fields, elapsed_seconds);
  }
}

export function compute_fixture_clock_elapsed_seconds(
  state: FixtureClockState,
  now: Date,
): number {
  switch (state.status) {
    case FIXTURE_CLOCK_STATUS.STOPPED:
      return state.elapsed_seconds;
    case FIXTURE_CLOCK_STATUS.RUNNING: {
      const running_milliseconds =
        now.getTime() - new Date(state.started_at).getTime();
      return (
        state.elapsed_seconds +
        Math.max(0, Math.floor(running_milliseconds / MILLISECONDS_PER_SECOND))
      );
    }
  }
}

export function build_fixture_clock_state(
  is_running: boolean,
  elapsed_seconds: number,
  now: Date,
): FixtureClockState {
  return is_running
    ? {
        status: FIXTURE_CLOCK_STATUS.RUNNING,
        elapsed_seconds,
        started_at: now.toISOString() as IsoDateTimeString,
      }
    : { status: FIXTURE_CLOCK_STATUS.STOPPED, elapsed_seconds };
}

export function to_fixture_clock_fields(
  state: FixtureClockState,
): FixtureClockFields {
  switch (state.status) {
    case FIXTURE_CLOCK_STATUS.STOPPED:
      return {
        clock_status: state.status,
        clock_elapsed_seconds: state.elapsed_seconds,
      };
    case FIXTURE_CLOCK_STATUS.RUNNING:
      return {
        clock_status: state.status,
        clock_elapsed_seconds: state.elapsed_seconds,
        clock_started_at: state.started_at,
      };
  }
}
