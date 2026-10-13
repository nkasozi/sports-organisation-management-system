import type { Fixture } from "../entities/Fixture";
import type { FixtureLineup, LineupPlayer } from "../entities/FixtureLineup";
import type { Player } from "../entities/Player";
import type { PlayerPosition } from "../entities/PlayerPosition";
import type { PlayerTeamMembership } from "../entities/PlayerTeamMembership";
import { FIXTURE_STATUS } from "../entities/StatusConstants";
import type { ScalarValueInput } from "../types/DomainScalars";
import {
  create_none_option,
  create_some_option,
  type Option,
  OptionStatus,
} from "../types/Option";
import type { Result } from "../types/Result";
import { create_success_result } from "../types/Result";
import { fail_use_case, UseCaseErrorCode } from "../types/UseCaseFailure";
import type { FixtureLineupUseCases } from "../usecases/FixtureLineupUseCases";
import type { FixtureUseCases } from "../usecases/FixtureUseCases";
import {
  FIXTURE_LINEUP_GENERATION_EVENT,
  FIXTURE_LINEUP_GENERATION_LOG_SCOPE,
  FIXTURE_LINEUP_GENERATION_MESSAGES,
} from "./FixtureLineupGenerationConstants";

const UNKNOWN_FIRST_NAME = "Unknown" as LineupPlayer["first_name"];
const UNKNOWN_LAST_NAME = "Player" as LineupPlayer["last_name"];
const EMPTY_POSITION = "" as LineupPlayer["position"];

const PREVIOUS_LINEUP_NOT_FOUND_REASON = {
  NO_COMPLETED_FIXTURE: "no_completed_fixture",
  NO_LINEUP_IN_PREVIOUS_FIXTURE: "no_lineup_in_previous_fixture",
} as const;

type LineupTeamId = ScalarValueInput<FixtureLineup["team_id"]>;

function fail_previous_lineup_lookup(
  fixture_id: string,
  team_id: LineupTeamId,
  technical_detail: string,
): Result<never, string> {
  return fail_use_case({
    code: UseCaseErrorCode.DEPENDENCY_FAILED,
    event: FIXTURE_LINEUP_GENERATION_EVENT.PREVIOUS_LINEUP_LOOKUP_FAILED,
    log_scope: FIXTURE_LINEUP_GENERATION_LOG_SCOPE,
    context: { fixture_id, team_id },
    user_message:
      FIXTURE_LINEUP_GENERATION_MESSAGES.PREVIOUS_LINEUP_LOOKUP_FAILED,
    technical_detail,
  });
}

function log_previous_lineup_not_found(
  fixture_id: string,
  team_id: LineupTeamId,
  reason: string,
): Result<Option<FixtureLineup>> {
  console.debug(FIXTURE_LINEUP_GENERATION_LOG_SCOPE, {
    event: FIXTURE_LINEUP_GENERATION_EVENT.PREVIOUS_LINEUP_NOT_FOUND,
    fixture_id,
    team_id,
    reason,
  });
  return create_success_result(create_none_option());
}

function fixture_sort_date(fixture: Fixture): string {
  return fixture.scheduled_date || fixture.created_at || "";
}

async function find_most_recent_completed_fixture(
  current_fixture: Fixture,
  team_id: LineupTeamId,
  fixture_use_cases: FixtureUseCases,
): Promise<Result<Option<Fixture>>> {
  const fixtures_result = await fixture_use_cases.list({
    competition_id: current_fixture.competition_id,
    team_id,
    status: FIXTURE_STATUS.COMPLETED,
  });
  if (!fixtures_result.success) {
    return fail_previous_lineup_lookup(
      current_fixture.id,
      team_id,
      fixtures_result.error,
    );
  }
  const [most_recent] = fixtures_result.data.items
    .filter((fixture: Fixture) => fixture.id !== current_fixture.id)
    .sort((a: Fixture, b: Fixture) =>
      fixture_sort_date(b).localeCompare(fixture_sort_date(a)),
    );
  return create_success_result(
    most_recent ? create_some_option(most_recent) : create_none_option(),
  );
}

export async function find_previous_lineup_for_team(
  current_fixture: Fixture,
  team_id: LineupTeamId,
  fixture_use_cases: FixtureUseCases,
  lineup_use_cases: FixtureLineupUseCases,
): Promise<Result<Option<FixtureLineup>>> {
  const fixture_result = await find_most_recent_completed_fixture(
    current_fixture,
    team_id,
    fixture_use_cases,
  );
  if (!fixture_result.success) return fixture_result;
  if (fixture_result.data.status === OptionStatus.NONE) {
    return log_previous_lineup_not_found(
      current_fixture.id,
      team_id,
      PREVIOUS_LINEUP_NOT_FOUND_REASON.NO_COMPLETED_FIXTURE,
    );
  }
  const lineups_result = await lineup_use_cases.list({
    fixture_id: fixture_result.data.value.id,
    team_id,
  });
  if (!lineups_result.success) {
    return fail_previous_lineup_lookup(
      current_fixture.id,
      team_id,
      lineups_result.error,
    );
  }
  const [previous_lineup] = lineups_result.data.items;
  if (!previous_lineup) {
    return log_previous_lineup_not_found(
      current_fixture.id,
      team_id,
      PREVIOUS_LINEUP_NOT_FOUND_REASON.NO_LINEUP_IN_PREVIOUS_FIXTURE,
    );
  }
  return create_success_result(create_some_option(previous_lineup));
}

export function build_lineup_players_from_memberships(
  memberships: PlayerTeamMembership[],
  players: Player[],
  position_name_by_id: Map<PlayerPosition["id"], PlayerPosition["name"]>,
): LineupPlayer[] {
  const player_by_id = new Map<Player["id"], Player>(
    players.map((player: Player) => [player.id, player]),
  );

  return memberships.map((membership) => {
    const player = player_by_id.get(membership.player_id);
    const position_name = player?.position_id
      ? (position_name_by_id.get(player.position_id) ?? EMPTY_POSITION)
      : EMPTY_POSITION;
    return {
      id: membership.player_id,
      first_name: player?.first_name ?? UNKNOWN_FIRST_NAME,
      last_name: player?.last_name ?? UNKNOWN_LAST_NAME,
      jersey_number: membership.jersey_number,
      position: position_name,
      is_captain: false,
      is_substitute: false,
    };
  });
}
