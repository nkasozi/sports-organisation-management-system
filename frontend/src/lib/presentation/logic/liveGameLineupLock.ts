import type { FixtureLineup } from "$lib/core/entities/FixtureLineup";
import { LINEUP_STATUS } from "$lib/core/entities/StatusConstants";
import type { FixtureLineupUseCasesPort } from "$lib/core/interfaces/ports/internal/usecases/FixtureLineupUseCasesPort";

type LineupLockUseCases = Pick<
  FixtureLineupUseCasesPort,
  "get_lineups_for_fixture" | "lock_lineup"
>;

type LineupLockSummary = { locked_count: number; failed_count: number };

const LINEUP_LOCK_LOG_SCOPE = "[LiveGameDetail] Lineup lock";
const LINEUP_LOCK_EVENT = {
  LOOKUP_FAILED: "live_game_lineup_lock_lookup_failed",
  LOCK_FAILED: "live_game_lineup_lock_failed",
} as const;
const FAILED_LOOKUP_SUMMARY: LineupLockSummary = {
  locked_count: 0,
  failed_count: 1,
};

async function lock_single_lineup(
  lineup: FixtureLineup,
  use_cases: LineupLockUseCases,
): Promise<boolean> {
  const result = await use_cases.lock_lineup(lineup.id);
  if (result.success) return true;
  console.warn(LINEUP_LOCK_LOG_SCOPE, {
    event: LINEUP_LOCK_EVENT.LOCK_FAILED,
    lineup_id: lineup.id,
    fixture_id: lineup.fixture_id,
    error: result.error,
  });
  return false;
}

export async function lock_fixture_lineups_after_start(
  fixture_id: FixtureLineup["fixture_id"],
  use_cases: LineupLockUseCases,
): Promise<LineupLockSummary> {
  const lineups_result = await use_cases.get_lineups_for_fixture(fixture_id);
  if (!lineups_result.success) {
    console.warn(LINEUP_LOCK_LOG_SCOPE, {
      event: LINEUP_LOCK_EVENT.LOOKUP_FAILED,
      fixture_id,
      error: lineups_result.error,
    });
    return FAILED_LOOKUP_SUMMARY;
  }
  const unlocked = lineups_result.data.filter(
    (lineup) => lineup.status !== LINEUP_STATUS.LOCKED,
  );
  const outcomes = await Promise.all(
    unlocked.map((lineup) => lock_single_lineup(lineup, use_cases)),
  );
  const locked_count = outcomes.filter(Boolean).length;
  return { locked_count, failed_count: outcomes.length - locked_count };
}
