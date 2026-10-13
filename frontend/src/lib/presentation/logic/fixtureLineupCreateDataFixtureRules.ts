import type { CompetitionRuleOverrides } from "$lib/core/entities/CompetitionTypes";
import type { Team } from "$lib/core/entities/Team";
import {
  apply_competition_fixture_player_limit_overrides,
  build_sport_fixture_player_limits,
  DEFAULT_FIXTURE_PLAYER_LIMITS,
  type FixturePlayerLimits,
  type SportPlayerLimitSource,
} from "$lib/core/services/fixturePlayerLimits";
import { type Option, OptionStatus } from "$lib/core/types/Option";

export type FixtureLineupPlayerLimits = FixturePlayerLimits;

export const DEFAULT_FIXTURE_LINEUP_PLAYER_LIMITS: FixtureLineupPlayerLimits =
  DEFAULT_FIXTURE_PLAYER_LIMITS;

interface FixtureLineupTeamLookupResult {
  success: boolean;
  data?: Team;
}

interface FixtureLineupExistingLineupEntry {
  team_id: string;
}

export function build_sport_player_limits(
  sport: SportPlayerLimitSource,
): FixtureLineupPlayerLimits {
  return build_sport_fixture_player_limits(sport);
}

export function apply_competition_player_limit_overrides(
  limits: FixtureLineupPlayerLimits,
  rule_overrides: CompetitionRuleOverrides,
): FixtureLineupPlayerLimits {
  return apply_competition_fixture_player_limit_overrides(
    limits,
    rule_overrides,
  );
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
