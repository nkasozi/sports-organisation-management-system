import type { Competition } from "$lib/core/entities/Competition";
import type { Fixture } from "$lib/core/entities/Fixture";
import type { Team } from "$lib/core/entities/Team";

import {
  type LoadTeamPublicProfilePageDataCommand,
  TEAM_PUBLIC_PROFILE_STATUS_SCHEDULED,
  type TeamPublicProfileStatsBundle,
} from "./teamPublicProfileDataLoaderContracts";
import {
  apply_fixture_to_team_public_profile_stats,
  type CompetitionPublicProfileStats,
  create_empty_team_public_profile_stats,
  type TeamPublicProfileStats,
} from "./teamPublicProfilePageState";

const TEAM_PUBLIC_PROFILE_UPCOMING_FIXTURE_LIMIT = 5;

function create_empty_team_public_profile_stats_bundle(
  team: Team,
): TeamPublicProfileStatsBundle {
  return {
    overall_stats: create_empty_team_public_profile_stats(),
    competition_stats: [],
    teams_by_id: new Map<string, Team>([[team.id, team]]),
  };
}

function build_competition_stats_map(
  fixtures: Fixture[],
  competitions_by_id: Map<string, Competition>,
): Map<string, CompetitionPublicProfileStats> {
  const competition_stats_by_id = new Map<
    string,
    CompetitionPublicProfileStats
  >();
  for (const fixture of fixtures) {
    const competition = competitions_by_id.get(fixture.competition_id);
    if (!competition || competition_stats_by_id.has(competition.id)) continue;
    competition_stats_by_id.set(competition.id, {
      competition,
      stats: create_empty_team_public_profile_stats(),
      upcoming_fixtures: [],
    });
  }
  return competition_stats_by_id;
}

function sort_team_public_competition_stats(
  competition_stats: CompetitionPublicProfileStats[],
): CompetitionPublicProfileStats[] {
  return competition_stats
    .map((competition_stat: CompetitionPublicProfileStats) => ({
      ...competition_stat,
      upcoming_fixtures: competition_stat.upcoming_fixtures
        .slice()
        .sort(
          (first_fixture: Fixture, second_fixture: Fixture) =>
            new Date(first_fixture.scheduled_date).getTime() -
            new Date(second_fixture.scheduled_date).getTime(),
        )
        .slice(0, TEAM_PUBLIC_PROFILE_UPCOMING_FIXTURE_LIMIT),
    }))
    .sort(
      (
        first_competition_stat: CompetitionPublicProfileStats,
        second_competition_stat: CompetitionPublicProfileStats,
      ) =>
        second_competition_stat.stats.total_matches -
        first_competition_stat.stats.total_matches,
    );
}

function accumulate_team_fixture_stats(
  team_fixtures: Fixture[],
  competition_stats_by_id: Map<string, CompetitionPublicProfileStats>,
  team_id: string,
): TeamPublicProfileStats {
  let overall_stats = create_empty_team_public_profile_stats();
  for (const fixture of team_fixtures) {
    const competition_stat = competition_stats_by_id.get(
      fixture.competition_id,
    );
    if (!competition_stat) {
      continue;
    }
    if (fixture.status === TEAM_PUBLIC_PROFILE_STATUS_SCHEDULED) {
      competition_stat.upcoming_fixtures.push(fixture);
      continue;
    }
    competition_stat.stats = apply_fixture_to_team_public_profile_stats(
      competition_stat.stats,
      fixture,
      team_id,
    );
    overall_stats = apply_fixture_to_team_public_profile_stats(
      overall_stats,
      fixture,
      team_id,
    );
  }
  return overall_stats;
}

function build_entities_by_id<T extends { id: string }>(
  initial_entries: Array<[string, T]>,
  entities: T[],
): Map<string, T> {
  const entities_by_id = new Map<string, T>(initial_entries);
  for (const entity of entities) {
    entities_by_id.set(entity.id, entity);
  }
  return entities_by_id;
}

export async function build_public_team_stats_bundle(
  command: LoadTeamPublicProfilePageDataCommand,
  team: Team,
): Promise<TeamPublicProfileStatsBundle> {
  const [teams_result, fixtures_result, competitions_result] =
    await Promise.all([
      command.dependencies.team_use_cases.list(),
      command.dependencies.fixture_use_cases.list(),
      command.dependencies.competition_use_cases.list(),
    ]);
  if (!fixtures_result.success || !competitions_result.success) {
    return create_empty_team_public_profile_stats_bundle(team);
  }
  const team_fixtures = (fixtures_result.data?.items || []).filter(
    (fixture: Fixture) =>
      fixture.home_team_id === team.id || fixture.away_team_id === team.id,
  );
  const competition_stats_by_id = build_competition_stats_map(
    team_fixtures,
    build_entities_by_id<Competition>(
      [],
      competitions_result.data?.items || [],
    ),
  );
  const overall_stats = accumulate_team_fixture_stats(
    team_fixtures,
    competition_stats_by_id,
    team.id,
  );
  return {
    overall_stats,
    competition_stats: sort_team_public_competition_stats(
      Array.from(competition_stats_by_id.values()),
    ),
    teams_by_id: build_entities_by_id<Team>(
      [[team.id, team]],
      teams_result.data?.items || [],
    ),
  };
}
