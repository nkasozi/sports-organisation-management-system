import type { Fixture } from "$lib/core/entities/Fixture";
import type { FixtureUseCasesPort } from "$lib/core/interfaces/ports/internal/usecases/FixtureUseCasesPort";

import { is_live_match_in_play } from "./liveGameMatchPhase";

export const CLOCK_CHECKPOINT_OUTCOME = {
  SAVED: "saved",
  SKIPPED: "skipped",
  FAILED: "failed",
} as const;

export type ClockCheckpointOutcome =
  | {
      status: typeof CLOCK_CHECKPOINT_OUTCOME.SAVED;
      current_minute: Fixture["current_minute"];
    }
  | { status: typeof CLOCK_CHECKPOINT_OUTCOME.SKIPPED }
  | { status: typeof CLOCK_CHECKPOINT_OUTCOME.FAILED };

type ClockCheckpointCommand = {
  fixture_use_cases: Pick<FixtureUseCasesPort, "update_period">;
  fixture: Fixture;
  game_clock_seconds: number;
};

const SECONDS_PER_MINUTE = 60;
const CLOCK_CHECKPOINT_LOG_SCOPE = "[LiveGameDetail] Clock checkpoint failed";
const CLOCK_CHECKPOINT_FAILED_EVENT = "live_game_clock_checkpoint_failed";

function should_skip_checkpoint(
  command: ClockCheckpointCommand,
  clock_minute: number,
): boolean {
  return (
    !is_live_match_in_play(command.fixture) ||
    clock_minute <= (command.fixture.current_minute || 0)
  );
}

export async function persist_live_game_clock_checkpoint(
  command: ClockCheckpointCommand,
): Promise<ClockCheckpointOutcome> {
  const clock_minute = Math.floor(
    command.game_clock_seconds / SECONDS_PER_MINUTE,
  );
  if (should_skip_checkpoint(command, clock_minute))
    return { status: CLOCK_CHECKPOINT_OUTCOME.SKIPPED };
  const result = await command.fixture_use_cases.update_period(
    command.fixture.id,
    command.fixture.current_period,
    clock_minute,
  );
  if (result.success)
    return {
      status: CLOCK_CHECKPOINT_OUTCOME.SAVED,
      current_minute: clock_minute as Fixture["current_minute"],
    };
  console.error(CLOCK_CHECKPOINT_LOG_SCOPE, {
    event: CLOCK_CHECKPOINT_FAILED_EVENT,
    fixture_id: command.fixture.id,
    error: result.error,
  });
  return { status: CLOCK_CHECKPOINT_OUTCOME.FAILED };
}
