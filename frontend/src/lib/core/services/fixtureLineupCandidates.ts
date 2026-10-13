import type { Fixture } from "../entities/Fixture";
import type {
  CreateFixtureLineupInput,
  LineupPlayer,
} from "../entities/FixtureLineup";
import type { Player } from "../entities/Player";
import type { PlayerPosition } from "../entities/PlayerPosition";
import type { PlayerTeamMembership } from "../entities/PlayerTeamMembership";
import { LINEUP_STATUS, MEMBERSHIP_STATUS } from "../entities/StatusConstants";
import type { Team } from "../entities/Team";
import type { ScalarValueInput } from "../types/DomainScalars";
import type { Result } from "../types/Result";
import { create_success_result } from "../types/Result";
import { fail_use_case, UseCaseErrorCode } from "../types/UseCaseFailure";
import type { FixtureLineupUseCases } from "../usecases/FixtureLineupUseCases";
import type { PlayerPositionUseCases } from "../usecases/PlayerPositionUseCases";
import type { PlayerTeamMembershipUseCases } from "../usecases/PlayerTeamMembershipUseCases";
import type { PlayerUseCases } from "../usecases/PlayerUseCases";
import {
  FIXTURE_LINEUP_GENERATION_EVENT,
  FIXTURE_LINEUP_GENERATION_LOG_SCOPE,
  FIXTURE_LINEUP_GENERATION_MESSAGES,
} from "./FixtureLineupGenerationConstants";
import { build_lineup_players_from_memberships } from "./fixtureLineupLookup";
import { log_service_failure } from "./serviceFailure";

export type LineupGenerationResult =
  | {
      success: true;
      lineup: CreateFixtureLineupInput;
      generation_message: string;
    }
  | { success: false; error_message: string; fix_suggestion: string };

export function create_lineup_generation_failure(
  error_message: string,
  fix_suggestion: string = "",
): LineupGenerationResult {
  return { success: false, error_message, fix_suggestion };
}

export interface LineupGenerationContext {
  fixture: Fixture;
  team_id: ScalarValueInput<Fixture["home_team_id"]>;
  team_name: ScalarValueInput<Team["name"]>;
  membership_use_cases: PlayerTeamMembershipUseCases;
  player_use_cases: PlayerUseCases;
  player_position_use_cases: PlayerPositionUseCases;
  lineup_use_cases: FixtureLineupUseCases;
}

const POSITION_PAGE = { page_number: 1, page_size: 100 };
const AUTO_GENERATED_SUBMITTER = "auto-generated";

function log_context_ids(
  context: LineupGenerationContext,
): Record<string, unknown> {
  return { fixture_id: context.fixture.id, team_id: context.team_id };
}

export async function load_active_memberships(
  context: LineupGenerationContext,
): Promise<Result<PlayerTeamMembership[]>> {
  const memberships_result = await context.membership_use_cases.list({
    team_id: context.team_id,
    status: MEMBERSHIP_STATUS.ACTIVE,
  });
  if (!memberships_result.success) {
    return fail_use_case({
      code: UseCaseErrorCode.DEPENDENCY_FAILED,
      event: FIXTURE_LINEUP_GENERATION_EVENT.MEMBERSHIPS_LOAD_FAILED,
      log_scope: FIXTURE_LINEUP_GENERATION_LOG_SCOPE,
      context: log_context_ids(context),
      user_message: FIXTURE_LINEUP_GENERATION_MESSAGES.MEMBERSHIPS_LOAD_FAILED,
      technical_detail: memberships_result.error,
    });
  }
  return create_success_result(
    memberships_result.data.items.filter(
      (m: PlayerTeamMembership) => m.status === MEMBERSHIP_STATUS.ACTIVE,
    ),
  );
}

function log_player_load_failure(
  context: LineupGenerationContext,
  player_id: string,
  error: string,
): void {
  console.warn(FIXTURE_LINEUP_GENERATION_LOG_SCOPE, {
    event: FIXTURE_LINEUP_GENERATION_EVENT.PLAYER_LOAD_FAILED,
    ...log_context_ids(context),
    player_id,
    error,
  });
}

async function load_players_for_memberships(
  context: LineupGenerationContext,
  memberships: PlayerTeamMembership[],
): Promise<Player[]> {
  const player_results: Result<Player, string>[] = await Promise.all(
    memberships.map((m: PlayerTeamMembership) =>
      context.player_use_cases.get_by_id(m.player_id),
    ),
  );
  const players: Player[] = [];
  player_results.forEach((result, index) => {
    if (result.success) {
      players.push(result.data);
      return;
    }
    log_player_load_failure(
      context,
      memberships[index].player_id,
      result.error,
    );
  });
  return players;
}

async function load_position_names(
  context: LineupGenerationContext,
): Promise<Map<PlayerPosition["id"], PlayerPosition["name"]>> {
  const positions_result = await context.player_position_use_cases.list(
    {},
    POSITION_PAGE,
  );
  if (!positions_result.success) {
    console.warn(FIXTURE_LINEUP_GENERATION_LOG_SCOPE, {
      event: FIXTURE_LINEUP_GENERATION_EVENT.POSITIONS_LOAD_FAILED,
      ...log_context_ids(context),
      error: positions_result.error,
    });
  }
  const positions = positions_result.success ? positions_result.data.items : [];
  return new Map<PlayerPosition["id"], PlayerPosition["name"]>(
    positions.map((position: PlayerPosition) => [position.id, position.name]),
  );
}

export async function load_sorted_lineup_players(
  context: LineupGenerationContext,
  memberships: PlayerTeamMembership[],
): Promise<LineupPlayer[]> {
  const players = await load_players_for_memberships(context, memberships);
  const position_name_by_id = await load_position_names(context);
  return build_lineup_players_from_memberships(
    memberships,
    players,
    position_name_by_id,
  ).sort((a, b) =>
    `${a.last_name} ${a.first_name}`
      .toLowerCase()
      .localeCompare(`${b.last_name} ${b.first_name}`.toLowerCase()),
  );
}

export function build_auto_generated_lineup(
  context: LineupGenerationContext,
  selected_players: LineupPlayer[],
  notes: string,
): CreateFixtureLineupInput {
  return {
    organization_id: context.fixture.organization_id,
    fixture_id: context.fixture.id,
    team_id: context.team_id,
    selected_players,
    status: LINEUP_STATUS.SUBMITTED,
    submitted_by: AUTO_GENERATED_SUBMITTER,
    submitted_at: new Date().toISOString(),
    notes,
  };
}

export async function save_generated_lineup(
  context: LineupGenerationContext,
  lineup: CreateFixtureLineupInput,
  generation_message: string,
): Promise<LineupGenerationResult> {
  const create_result = await context.lineup_use_cases.create(lineup);
  if (!create_result.success) {
    const error_message = log_service_failure({
      code: UseCaseErrorCode.DEPENDENCY_FAILED,
      event: FIXTURE_LINEUP_GENERATION_EVENT.SAVE_FAILED,
      log_scope: FIXTURE_LINEUP_GENERATION_LOG_SCOPE,
      context: log_context_ids(context),
      user_message:
        create_result.error || FIXTURE_LINEUP_GENERATION_MESSAGES.SAVE_FAILED,
      technical_detail: create_result.error,
    });
    return create_lineup_generation_failure(error_message);
  }
  console.info(FIXTURE_LINEUP_GENERATION_LOG_SCOPE, {
    event: FIXTURE_LINEUP_GENERATION_EVENT.CREATED,
    ...log_context_ids(context),
    player_count: lineup.selected_players.length,
  });
  return { success: true, lineup, generation_message };
}
