import type { Competition } from "$lib/core/entities/Competition";
import type { Fixture } from "$lib/core/entities/Fixture";
import type { ProfileLink } from "$lib/core/entities/ProfileLink";
import type { Team } from "$lib/core/entities/Team";
import type { TeamProfile } from "$lib/core/entities/TeamProfile";
import {
  type AsyncResult,
  create_failure_result,
  create_success_result,
} from "$lib/core/types/Result";

import {
  type LoadTeamPublicProfilePageDataCommand,
  TEAM_PUBLIC_PROFILE_LOAD_ERROR_KIND,
  TEAM_PUBLIC_PROFILE_MESSAGE,
  TEAM_PUBLIC_PROFILE_STATUS_SCHEDULED,
  TEAM_PUBLIC_PROFILE_VISIBILITY_PRIVATE,
  type TeamPublicProfileLoadError,
  type TeamPublicProfileStatsBundle,
} from "./teamPublicProfileDataLoaderContracts";
import {
  apply_fixture_to_team_public_profile_stats,
  type CompetitionPublicProfileStats,
  create_empty_team_public_profile_stats,
} from "./teamPublicProfilePageState";

function create_team_public_profile_load_error(
  kind: TeamPublicProfileLoadError["kind"],
  message: string,
): TeamPublicProfileLoadError {
  return { kind, message };
}
function create_empty_team_public_profile_stats_bundle(
  team: Team,
): TeamPublicProfileStatsBundle {
  return {
    overall_stats: create_empty_team_public_profile_stats(),
    competition_stats: [],
    teams_by_id: new Map<string, Team>([[team.id, team]]),
  };
}

export async function load_public_team_profile(
  command: LoadTeamPublicProfilePageDataCommand,
): AsyncResult<TeamProfile, TeamPublicProfileLoadError> {
  const profile_result =
    await command.dependencies.profile_use_cases.get_by_slug(command.slug);
  if (!profile_result.success || !profile_result.data) {
    return create_failure_result(
      create_team_public_profile_load_error(
        TEAM_PUBLIC_PROFILE_LOAD_ERROR_KIND.not_found,
        TEAM_PUBLIC_PROFILE_MESSAGE.not_found,
      ),
    );
  }
  if (
    profile_result.data.visibility === TEAM_PUBLIC_PROFILE_VISIBILITY_PRIVATE
  ) {
    return create_failure_result(
      create_team_public_profile_load_error(
        TEAM_PUBLIC_PROFILE_LOAD_ERROR_KIND.restricted,
        TEAM_PUBLIC_PROFILE_MESSAGE.restricted,
      ),
    );
  }
  return create_success_result(profile_result.data);
}

export async function load_public_team(
  command: LoadTeamPublicProfilePageDataCommand,
  profile: TeamProfile,
): AsyncResult<Team, TeamPublicProfileLoadError> {
  const team_result = await command.dependencies.team_use_cases.get_by_id(
    profile.team_id,
  );
  if (!team_result.success || !team_result.data) {
    return create_failure_result(
      create_team_public_profile_load_error(
        TEAM_PUBLIC_PROFILE_LOAD_ERROR_KIND.unavailable,
        TEAM_PUBLIC_PROFILE_MESSAGE.unavailable,
      ),
    );
  }
  return create_success_result(team_result.data);
}

export async function load_public_team_profile_links(
  command: LoadTeamPublicProfilePageDataCommand,
  profile: TeamProfile,
): Promise<ProfileLink[]> {
  const profile_links_result =
    await command.dependencies.profile_link_use_cases.list_by_profile(
      profile.id,
    );
  if (!profile_links_result.success || !profile_links_result.data?.items) {
    return [];
  }
  return profile_links_result.data.items;
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
        .slice(0, 5),
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
  const teams_by_id = new Map<string, Team>([[team.id, team]]);
  for (const listed_team of teams_result.data?.items || []) {
    teams_by_id.set(listed_team.id, listed_team);
  }
  const competitions_by_id = new Map<string, Competition>();
  for (const competition of competitions_result.data?.items || []) {
    competitions_by_id.set(competition.id, competition);
  }
  const team_fixtures = (fixtures_result.data?.items || []).filter(
    (fixture: Fixture) =>
      fixture.home_team_id === team.id || fixture.away_team_id === team.id,
  );
  const competition_stats_by_id = build_competition_stats_map(
    team_fixtures,
    competitions_by_id,
  );
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
      team.id,
    );
    overall_stats = apply_fixture_to_team_public_profile_stats(
      overall_stats,
      fixture,
      team.id,
    );
  }
  return {
    overall_stats,
    competition_stats: sort_team_public_competition_stats(
      Array.from(competition_stats_by_id.values()),
    ),
    teams_by_id,
  };
}
