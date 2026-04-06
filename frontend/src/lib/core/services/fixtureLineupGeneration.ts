import type { Fixture } from "../entities/Fixture";
import type { FixtureLineupUseCases } from "../usecases/FixtureLineupUseCases";
import type { FixtureUseCases } from "../usecases/FixtureUseCases";
import type { PlayerTeamMembershipUseCases } from "../usecases/PlayerTeamMembershipUseCases";
import type { PlayerUseCases } from "../usecases/PlayerUseCases";
import type { PlayerPositionUseCases } from "../usecases/PlayerPositionUseCases";
import type { CompetitionUseCases } from "../usecases/CompetitionUseCases";
import type { OrganizationUseCases } from "../usecases/OrganizationUseCases";
import { LINEUP_STATUS, MEMBERSHIP_STATUS } from "../entities/StatusConstants";
import type { SportUseCases } from "../usecases/SportUseCases";
import type { CreateFixtureLineupInput } from "../entities/FixtureLineup";
import type { Player } from "../entities/Player";
import type { PlayerTeamMembership } from "../entities/PlayerTeamMembership";
import type { PlayerPosition } from "../entities/PlayerPosition";
import type { Result } from "../types/Result";
import { get_player_rules_from_competition } from "./fixturePlayerRules";
import {
  find_previous_lineup_for_team,
  build_lineup_players_from_memberships,
} from "./fixtureLineupLookup";

export interface LineupGenerationResult {
  success: boolean;
  lineup?: CreateFixtureLineupInput;
  error_message?: string | null;
  fix_suggestion?: string | null;
  generation_message?: string;
}

export async function auto_generate_lineups_if_possible(
  fixture: Fixture,
  team_id: string,
  team_name: string,
  membership_use_cases: PlayerTeamMembershipUseCases,
  player_use_cases: PlayerUseCases,
  player_position_use_cases: PlayerPositionUseCases,
  lineup_use_cases: FixtureLineupUseCases,
  fixture_use_cases: FixtureUseCases,
  competition_use_cases: CompetitionUseCases,
  organization_use_cases: OrganizationUseCases,
  sport_use_cases: SportUseCases,
): Promise<LineupGenerationResult> {
  console.log(
    "[fixtureStartChecks] auto_generate called for team:",
    team_id,
    "fixture:",
    fixture.id,
  );
  if (!fixture.id)
    return { success: false, error_message: "Fixture must have an ID" };

  const rules_result = await get_player_rules_from_competition(
    fixture.competition_id,
    competition_use_cases,
    organization_use_cases,
    sport_use_cases,
  );
  if (!rules_result.success)
    return { success: false, error_message: rules_result.error_message };

  const { min_players, max_players, squad_generation_strategy } = rules_result;
  console.log(
    "[fixtureStartChecks] Rules - min:",
    min_players,
    "max:",
    max_players,
    "strategy:",
    squad_generation_strategy,
  );

  if (squad_generation_strategy === "previous_match") {
    const previous_result = await try_previous_match_strategy(
      fixture,
      team_id,
      team_name,
      fixture_use_cases,
      lineup_use_cases,
    );
    if (previous_result) return previous_result;
    console.log(
      "[fixtureStartChecks] No previous lineup — falling back to first_available",
    );
  }

  return generate_first_available_lineup(
    fixture,
    team_id,
    team_name,
    min_players,
    max_players,
    membership_use_cases,
    player_use_cases,
    player_position_use_cases,
    lineup_use_cases,
  );
}

async function try_previous_match_strategy(
  fixture: Fixture,
  team_id: string,
  team_name: string,
  fixture_use_cases: FixtureUseCases,
  lineup_use_cases: FixtureLineupUseCases,
): Promise<LineupGenerationResult | null> {
  const previous_lineup_result = await find_previous_lineup_for_team(
    fixture,
    team_id,
    fixture_use_cases,
    lineup_use_cases,
  );
  if (!previous_lineup_result.success || !previous_lineup_result.lineup)
    return null;

  const previous_players = previous_lineup_result.lineup.selected_players;
  console.log(
    "[fixtureStartChecks] Found previous lineup with",
    previous_players.length,
    "players for:",
    team_name,
  );

  const lineup: CreateFixtureLineupInput = {
    organization_id: fixture.organization_id,
    fixture_id: fixture.id,
    team_id,
    selected_players: previous_players,
    status: LINEUP_STATUS.SUBMITTED,
    submitted_by: "auto-generated",
    submitted_at: new Date().toISOString(),
    notes: "Auto-generated from previous match squad",
  };

  const create_result = await lineup_use_cases.create(lineup);
  if (!create_result.success)
    return {
      success: false,
      error_message: create_result.error || "Failed to create lineup",
    };

  return {
    success: true,
    lineup,
    generation_message: `Used previous match squad for ${team_name} (${previous_players.length} players)`,
  };
}

async function generate_first_available_lineup(
  fixture: Fixture,
  team_id: string,
  team_name: string,
  min_players: number,
  max_players: number,
  membership_use_cases: PlayerTeamMembershipUseCases,
  player_use_cases: PlayerUseCases,
  player_position_use_cases: PlayerPositionUseCases,
  lineup_use_cases: FixtureLineupUseCases,
): Promise<LineupGenerationResult> {
  const memberships_result = await membership_use_cases.list({
    team_id,
    status: MEMBERSHIP_STATUS.ACTIVE,
  });
  const active_memberships = (
    memberships_result.success ? memberships_result.data.items : []
  ).filter((m: PlayerTeamMembership) => m.status === MEMBERSHIP_STATUS.ACTIVE);

  if (active_memberships.length < min_players) {
    return {
      success: false,
      error_message: `${team_name} has only ${active_memberships.length} active player(s), but minimum is ${min_players}`,
      fix_suggestion: `Go to the Player Team Memberships page and add more players to ${team_name} (need at least ${min_players - active_memberships.length} more)`,
    };
  }

  const players_to_select = Math.min(active_memberships.length, max_players);
  const player_ids = active_memberships.map(
    (m: PlayerTeamMembership) => m.player_id,
  );
  const player_results: Result<Player, string>[] = await Promise.all(
    player_ids.map((player_id: string) =>
      player_use_cases.get_by_id(player_id),
    ),
  );
  const players: Player[] = player_results
    .filter((r): r is { success: true; data: Player } => r.success)
    .map((r) => r.data);

  const positions_result = await player_position_use_cases.list(undefined, {
    page_number: 1,
    page_size: 100,
  });
  const positions = positions_result.success ? positions_result.data.items : [];
  const position_name_by_id = new Map<string, string>(
    positions.map((p: PlayerPosition) => [p.id, p.name]),
  );

  const all_lineup_players = build_lineup_players_from_memberships(
    active_memberships,
    players,
    position_name_by_id,
  );
  all_lineup_players.sort((a, b) =>
    `${a.last_name} ${a.first_name}`
      .toLowerCase()
      .localeCompare(`${b.last_name} ${b.first_name}`.toLowerCase()),
  );
  const selected_players = all_lineup_players.slice(0, players_to_select);

  const lineup: CreateFixtureLineupInput = {
    organization_id: fixture.organization_id,
    fixture_id: fixture.id,
    team_id,
    selected_players,
    status: LINEUP_STATUS.SUBMITTED,
    submitted_by: "auto-generated",
    submitted_at: new Date().toISOString(),
    notes: "Auto-generated lineup (first available players)",
  };

  const create_result = await lineup_use_cases.create(lineup);
  if (!create_result.success)
    return {
      success: false,
      error_message: create_result.error || "Failed to create lineup",
    };

  console.log(
    "[fixtureStartChecks] Lineup created for:",
    team_name,
    "using first_available",
  );
  return {
    success: true,
    lineup,
    generation_message: `Selected first ${selected_players.length} available players for ${team_name}`,
  };
}
