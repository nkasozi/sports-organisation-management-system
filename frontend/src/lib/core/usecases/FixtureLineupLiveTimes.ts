import type { FixtureLineup, LineupPlayer } from "../entities/FixtureLineup";
import type { ScalarValueInput } from "../types/DomainScalars";
import type { AsyncResult } from "../types/Result";
import { LINEUP_ACTION } from "./FixtureLineupConstants";
import { decide_live_player_times } from "./FixtureLineupStateMachine";
import {
  apply_lineup_update,
  find_lineup_with_fixture_status,
  type LineupRepositories,
  settle_decision,
} from "./FixtureLineupTransitions";

type RecordLivePlayerTimesCommand = {
  lineup_id: ScalarValueInput<FixtureLineup["id"]>;
  selected_players: LineupPlayer[];
};

export async function record_live_player_times(
  repositories: LineupRepositories,
  command: RecordLivePlayerTimesCommand,
): AsyncResult<FixtureLineup> {
  const found = await find_lineup_with_fixture_status(
    repositories,
    command.lineup_id,
  );
  if (!found.success) return found;
  const updates = settle_decision(
    decide_live_player_times(
      found.data.lineup,
      found.data.fixture_status,
      command.selected_players,
    ),
    command.lineup_id,
    LINEUP_ACTION.RECORD_LIVE_TIMES,
  );
  if (!updates.success) return updates;
  return apply_lineup_update(
    repositories.lineup_repository,
    command.lineup_id,
    found.data.lineup,
    updates.data,
  );
}
