import type { Fixture } from "$lib/core/entities/Fixture";
import {
  compute_fixture_clock_elapsed_seconds,
  type FixtureClockFields,
  read_fixture_clock_state,
} from "$lib/core/entities/FixtureClock";
import {
  compute_break_elapsed_seconds,
  read_break_clock_state,
  read_clock_added_seconds,
} from "$lib/core/entities/FixtureClockSnapshot";
import type { SportGamePeriod } from "$lib/core/entities/Sport";
import { FIXTURE_STATUS } from "$lib/core/entities/StatusConstants";
import { OptionStatus } from "$lib/core/types/Option";

import { get_period_start_seconds } from "./liveGameDetailPeriodState";

const SECONDS_PER_MINUTE = 60;

type LiveGameClockRestoreSource = {
  fixture: Pick<Fixture, "status" | "current_period" | "current_minute"> &
    FixtureClockFields;
  playing_periods: SportGamePeriod[];
  now: Date;
};

function restore_from_minute_checkpoint(
  source: LiveGameClockRestoreSource,
): number {
  const persisted_seconds =
    (source.fixture.current_minute || 0) * SECONDS_PER_MINUTE;
  const is_playing_period = source.playing_periods.some(
    (period) => period.id === source.fixture.current_period,
  );
  if (!is_playing_period) return persisted_seconds;
  return Math.max(
    persisted_seconds,
    get_period_start_seconds(
      source.fixture.current_period,
      source.playing_periods,
    ),
  );
}

export function restore_live_game_clock_seconds(
  source: LiveGameClockRestoreSource,
): number {
  if (source.fixture.status !== FIXTURE_STATUS.IN_PROGRESS) return 0;
  const clock_state = read_fixture_clock_state(source.fixture);
  switch (clock_state.status) {
    case OptionStatus.SOME:
      return compute_fixture_clock_elapsed_seconds(
        clock_state.value,
        source.now,
      );
    case OptionStatus.NONE:
      return restore_from_minute_checkpoint(source);
  }
}

type LiveGameClockExtras = {
  extra_time_added_seconds: number;
  break_elapsed_seconds: number;
};

const NO_CLOCK_EXTRAS: LiveGameClockExtras = {
  extra_time_added_seconds: 0,
  break_elapsed_seconds: 0,
};

export function restore_live_game_clock_extras(source: {
  fixture: Pick<
    Fixture,
    "status" | "clock_added_seconds" | "clock_break_started_at"
  >;
  now: Date;
}): LiveGameClockExtras {
  if (source.fixture.status !== FIXTURE_STATUS.IN_PROGRESS)
    return NO_CLOCK_EXTRAS;
  const added_seconds = read_clock_added_seconds(source.fixture);
  return {
    extra_time_added_seconds:
      added_seconds.status === OptionStatus.SOME ? added_seconds.value : 0,
    break_elapsed_seconds: compute_break_elapsed_seconds(
      read_break_clock_state(source.fixture),
      source.now,
    ),
  };
}
