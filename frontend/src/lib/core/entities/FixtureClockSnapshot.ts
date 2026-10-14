import type { IsoDateTimeString } from "../types/DomainScalars";
import {
  create_none_option,
  create_some_option,
  type Option,
} from "../types/Option";
import {
  type FixtureClockFields,
  type FixtureClockState,
  to_fixture_clock_fields,
} from "./FixtureClock";
import type { Fixture } from "./FixtureTypes";

export const BREAK_CLOCK_STATUS = {
  NOT_ON_BREAK: "not_on_break",
  ON_BREAK: "on_break",
} as const;

export type BreakClockState =
  | { status: typeof BREAK_CLOCK_STATUS.NOT_ON_BREAK }
  | {
      status: typeof BREAK_CLOCK_STATUS.ON_BREAK;
      started_at: IsoDateTimeString;
    };

export type FixtureClockSnapshot = {
  game_clock: FixtureClockState;
  added_seconds: number;
  break_clock: BreakClockState;
};

type FixtureClockSnapshotFields = FixtureClockFields &
  Pick<Fixture, "clock_added_seconds" | "clock_break_started_at">;

const NO_BREAK_STORED_VALUE = "" as IsoDateTimeString;
const NO_ELAPSED_SECONDS = 0;
const MILLISECONDS_PER_SECOND = 1000;
const NUMBER_TYPE_NAME = "number";

function to_break_started_at(break_clock: BreakClockState): IsoDateTimeString {
  switch (break_clock.status) {
    case BREAK_CLOCK_STATUS.NOT_ON_BREAK:
      return NO_BREAK_STORED_VALUE;
    case BREAK_CLOCK_STATUS.ON_BREAK:
      return break_clock.started_at;
  }
}

export function to_fixture_clock_snapshot_fields(
  snapshot: FixtureClockSnapshot,
): FixtureClockSnapshotFields {
  return {
    ...to_fixture_clock_fields(snapshot.game_clock),
    clock_added_seconds: snapshot.added_seconds,
    clock_break_started_at: to_break_started_at(snapshot.break_clock),
  };
}

export function read_break_clock_state(
  fields: Pick<Fixture, "clock_break_started_at">,
): BreakClockState {
  const started_at = String(fields.clock_break_started_at ?? "");
  const is_valid =
    started_at.length > 0 && !Number.isNaN(new Date(started_at).getTime());
  return is_valid
    ? {
        status: BREAK_CLOCK_STATUS.ON_BREAK,
        started_at: started_at as IsoDateTimeString,
      }
    : { status: BREAK_CLOCK_STATUS.NOT_ON_BREAK };
}

export function compute_break_elapsed_seconds(
  break_clock: BreakClockState,
  now: Date,
): number {
  switch (break_clock.status) {
    case BREAK_CLOCK_STATUS.NOT_ON_BREAK:
      return NO_ELAPSED_SECONDS;
    case BREAK_CLOCK_STATUS.ON_BREAK:
      return Math.max(
        NO_ELAPSED_SECONDS,
        Math.floor(
          (now.getTime() - new Date(break_clock.started_at).getTime()) /
            MILLISECONDS_PER_SECOND,
        ),
      );
  }
}

export function read_clock_added_seconds(
  fields: Pick<Fixture, "clock_added_seconds">,
): Option<number> {
  const added_seconds = fields.clock_added_seconds;
  return typeof added_seconds === NUMBER_TYPE_NAME &&
    Number.isFinite(added_seconds) &&
    (added_seconds as number) >= NO_ELAPSED_SECONDS
    ? create_some_option(added_seconds as number)
    : create_none_option();
}
