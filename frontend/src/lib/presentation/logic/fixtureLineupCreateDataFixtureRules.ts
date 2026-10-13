import type { CompetitionRuleOverrides } from "$lib/core/entities/CompetitionTypes";
import type { Sport } from "$lib/core/entities/Sport";
import type { Team } from "$lib/core/entities/Team";
import { type Option, OptionStatus } from "$lib/core/types/Option";

export interface FixtureLineupPlayerLimits {
  min_players: number;
  max_players: number;
  starters_count: number;
}

export const DEFAULT_FIXTURE_LINEUP_PLAYER_LIMITS: FixtureLineupPlayerLimits = {
  min_players: 2,
  max_players: 18,
  starters_count: 11,
};

interface FixtureLineupTeamLookupResult {
  success: boolean;
  data?: Team;
}

interface FixtureLineupExistingLineupEntry {
  team_id: string;
}

export function build_sport_player_limits(
  sport: Pick<
    Sport,
    | "min_players_per_fixture"
    | "max_players_per_fixture"
    | "max_players_on_field"
  >,
): FixtureLineupPlayerLimits {
  return {
    min_players: sport.min_players_per_fixture || 2,
    max_players: sport.max_players_per_fixture || 18,
    starters_count: sport.max_players_on_field || 11,
  };
}

export function apply_competition_player_limit_overrides(
  limits: FixtureLineupPlayerLimits,
  rule_overrides: CompetitionRuleOverrides,
): FixtureLineupPlayerLimits {
  return {
    min_players: rule_overrides.min_players_on_field ?? limits.min_players,
    max_players: rule_overrides.max_squad_size ?? limits.max_players,
    starters_count:
      rule_overrides.max_players_on_field ?? limits.starters_count,
  };
}

export function collect_fixture_teams(
  team_results: FixtureLineupTeamLookupResult[],
): Team[] {
  return team_results.flatMap((team_result: FixtureLineupTeamLookupResult) =>
    team_result.success && team_result.data ? [team_result.data] : [],
  );
}

export function build_teams_with_existing_lineups(
  existing_lineups: FixtureLineupExistingLineupEntry[],
  teams: Team[],
  fixture_team_label_by_team_id: Map<string, string>,
): Map<string, string> {
  const teams_with_existing_lineups = new Map<string, string>();
  for (const lineup of existing_lineups) {
    const matching_team = teams.find(
      (team: Team) => team.id === lineup.team_id,
    );
    teams_with_existing_lineups.set(
      lineup.team_id,
      matching_team
        ? fixture_team_label_by_team_id.get(matching_team.id) ||
            matching_team.name
        : lineup.team_id,
    );
  }
  return teams_with_existing_lineups;
}

export function resolve_auto_selected_team_id(
  preselected_team: Option<string>,
  available_teams: Team[],
): string {
  if (preselected_team.status === OptionStatus.NONE) return "";
  const preselected_team_id = preselected_team.value;
  return available_teams.some((team: Team) => team.id === preselected_team_id)
    ? preselected_team_id
    : "";
}
