import type { Fixture } from "$lib/core/entities/Fixture";
import {
  build_fixture_clock_state,
  FIXTURE_CLOCK_STATUS,
  read_fixture_clock_state,
} from "$lib/core/entities/FixtureClock";
import {
  BREAK_CLOCK_STATUS,
  type BreakClockState,
  type FixtureClockSnapshot,
} from "$lib/core/entities/FixtureClockSnapshot";
import { FIXTURE_STATUS } from "$lib/core/entities/StatusConstants";
import type { FixtureUseCasesPort } from "$lib/core/interfaces/ports/internal/usecases/FixtureUseCasesPort";
import type { IsoDateTimeString } from "$lib/core/types/DomainScalars";
import { OptionStatus } from "$lib/core/types/Option";

export const CLOCK_PERSIST_OUTCOME = {
  SAVED: "saved",
  SKIPPED: "skipped",
  FAILED: "failed",
} as const;

export type ClockPersistOutcome = {
  status: (typeof CLOCK_PERSIST_OUTCOME)[keyof typeof CLOCK_PERSIST_OUTCOME];
};

export type ClockPersistCommand = {
  fixture_use_cases: Pick<FixtureUseCasesPort, "save_clock_snapshot">;
  fixture: Fixture;
  game_clock_seconds: number;
  is_clock_running: boolean;
  is_current_period_playing: boolean;
  now: Date;
  break_elapsed_seconds: number;
  extra_time_added_seconds: number;
};

const MILLISECONDS_PER_SECOND = 1000;
const CLOCK_PERSIST_LOG_SCOPE = "[LiveGameDetail] Clock state save failed";
const CLOCK_PERSIST_FAILED_EVENT = "live_game_clock_state_save_failed";

function build_break_clock(command: ClockPersistCommand): BreakClockState {
  const is_break_running =
    command.is_clock_running && !command.is_current_period_playing;
  if (!is_break_running) return { status: BREAK_CLOCK_STATUS.NOT_ON_BREAK };
  const started_at_milliseconds =
    command.now.getTime() -
    command.break_elapsed_seconds * MILLISECONDS_PER_SECOND;
  return {
    status: BREAK_CLOCK_STATUS.ON_BREAK,
    started_at: new Date(
      started_at_milliseconds,
    ).toISOString() as IsoDateTimeString,
  };
}

function build_clock_snapshot(
  command: ClockPersistCommand,
): FixtureClockSnapshot {
  return {
    game_clock: build_fixture_clock_state(
      command.is_clock_running && command.is_current_period_playing,
      command.game_clock_seconds,
      command.now,
    ),
    added_seconds: command.extra_time_added_seconds,
    break_clock: build_break_clock(command),
  };
}

export async function persist_live_game_clock_state(
  command: ClockPersistCommand,
): Promise<ClockPersistOutcome> {
  if (command.fixture.status !== FIXTURE_STATUS.IN_PROGRESS)
    return { status: CLOCK_PERSIST_OUTCOME.SKIPPED };
  const result = await command.fixture_use_cases.save_clock_snapshot(
    command.fixture.id,
    build_clock_snapshot(command),
  );
  if (result.success) return { status: CLOCK_PERSIST_OUTCOME.SAVED };
  console.error(CLOCK_PERSIST_LOG_SCOPE, {
    event: CLOCK_PERSIST_FAILED_EVENT,
    fixture_id: command.fixture.id,
    error: result.error,
  });
  return { status: CLOCK_PERSIST_OUTCOME.FAILED };
}

export function should_resume_live_game_clock_on_load(
  fixture: Fixture,
  is_current_period_playing: boolean,
): boolean {
  if (fixture.status !== FIXTURE_STATUS.IN_PROGRESS) return false;
  const clock_state = read_fixture_clock_state(fixture);
  if (clock_state.status === OptionStatus.NONE) return true;
  switch (clock_state.value.status) {
    case FIXTURE_CLOCK_STATUS.RUNNING:
      return true;
    case FIXTURE_CLOCK_STATUS.STOPPED:
      return !is_current_period_playing;
  }
}
