import type { Fixture } from "$lib/core/entities/Fixture";
import type { Player } from "$lib/core/entities/Player";
import { get_player_full_name } from "$lib/core/entities/Player";
import type { PlayerTeamMembership } from "$lib/core/entities/PlayerTeamMembership";
import type { Team } from "$lib/core/entities/Team";

import {
  type LoadPlayerPublicProfilePageDataCommand,
  PLAYER_PUBLIC_PROFILE_STATUS_COMPLETED,
  type PlayerPublicProfileStatsBundle,
} from "./playerPublicProfileDataLoaderContracts";
import {
  calculate_player_public_profile_event_stats,
  create_empty_player_public_profile_stats,
  merge_player_public_profile_stats,
  type PlayerPublicProfileStats,
  type PlayerPublicTeamStats,
} from "./playerPublicProfilePageState";

function create_empty_player_public_profile_stats_bundle(): PlayerPublicProfileStatsBundle {
  return {
    overall_stats: create_empty_player_public_profile_stats(),
    team_stats: [],
  };
}

function build_player_public_team_stats(
  membership: PlayerTeamMembership,
  teams_by_id: Map<string, Team>,
  fixtures: Fixture[],
  player_full_name: string,
): PlayerPublicTeamStats[] {
  const team = teams_by_id.get(membership.team_id);
  if (!team) {
    return [];
  }
  const relevant_fixtures = fixtures.filter(
    (fixture: Fixture) =>
      fixture.status === PLAYER_PUBLIC_PROFILE_STATUS_COMPLETED &&
      (fixture.home_team_id === team.id || fixture.away_team_id === team.id),
  );
  const team_stats = relevant_fixtures.reduce<PlayerPublicProfileStats>(
    (current_stats: PlayerPublicProfileStats, fixture: Fixture) =>
      merge_player_public_profile_stats(
        current_stats,
        calculate_player_public_profile_event_stats(
          fixture.game_events || [],
          player_full_name,
        ),
      ),
    create_empty_player_public_profile_stats(),
  );
  team_stats.total_matches = relevant_fixtures.length;
  return [{ membership, team, stats: team_stats }];
}

function build_player_public_overall_stats(
  team_stats: PlayerPublicTeamStats[],
): PlayerPublicProfileStats {
  return team_stats.reduce(
    (
      current_stats: PlayerPublicProfileStats,
      current_team_stat: PlayerPublicTeamStats,
    ) =>
      merge_player_public_profile_stats(current_stats, current_team_stat.stats),
    create_empty_player_public_profile_stats(),
  );
}

function build_teams_by_id(teams: Team[]): Map<string, Team> {
  const teams_by_id = new Map<string, Team>();
  for (const team of teams) {
    teams_by_id.set(team.id, team);
  }
  return teams_by_id;
}

export async function build_public_player_stats_bundle(
  command: LoadPlayerPublicProfilePageDataCommand,
  player: Player,
): Promise<PlayerPublicProfileStatsBundle> {
  const [memberships_result, teams_result, fixtures_result] = await Promise.all(
    [
      command.dependencies.membership_use_cases.list(),
      command.dependencies.team_use_cases.list(),
      command.dependencies.fixture_use_cases.list(),
    ],
  );
  if (!memberships_result.success || !fixtures_result.success) {
    return create_empty_player_public_profile_stats_bundle();
  }
  const teams_by_id = build_teams_by_id(teams_result.data?.items || []);
  const player_full_name = get_player_full_name(player);
  const player_fixtures = fixtures_result.data?.items || [];
  const team_stats = (memberships_result.data?.items || [])
    .filter(
      (membership: PlayerTeamMembership) => membership.player_id === player.id,
    )
    .flatMap((membership: PlayerTeamMembership) =>
      build_player_public_team_stats(
        membership,
        teams_by_id,
        player_fixtures,
        player_full_name,
      ),
    );
  return {
    overall_stats: build_player_public_overall_stats(team_stats),
    team_stats,
  };
}
