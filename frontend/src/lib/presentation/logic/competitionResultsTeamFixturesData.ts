import type { Competition } from "$lib/core/entities/Competition";
import type { Fixture } from "$lib/core/entities/Fixture";
import type { Team } from "$lib/core/entities/Team";

interface EntityListResult<EntityType> {
  success: boolean;
  data?: { items: EntityType[] };
}

interface EntityResult<EntityType> {
  success: boolean;
  data?: EntityType;
}

interface CompetitionResultsTeamFixturesDependencies {
  fixture_use_cases: {
    list: (
      filters: Record<string, string>,
      pagination: { page_number: number; page_size: number },
    ) => Promise<EntityListResult<Fixture>>;
  };
  team_use_cases: {
    get_by_id: (team_id: string) => Promise<EntityResult<Team>>;
  };
  competition_use_cases: {
    get_by_id: (competition_id: string) => Promise<EntityResult<Competition>>;
  };
}

interface CompetitionResultsTeamFixturesBundle {
  team_fixtures_in_competition: Fixture[];
  team_fixtures_all_competitions: Fixture[];
  extended_team_map: Map<string, Team>;
  extended_competition_map: Map<string, Competition>;
}

export function sort_team_fixtures(fixtures: Fixture[]): Fixture[] {
  return [...fixtures].sort(
    (left: Fixture, right: Fixture) =>
      new Date(left.scheduled_date).getTime() -
      new Date(right.scheduled_date).getTime(),
  );
}

export async function load_team_fixtures_bundle(command: {
  team_id: string;
  fixtures: Fixture[];
  team_map: Map<string, Team>;
  competitions: Competition[];
  dependencies: CompetitionResultsTeamFixturesDependencies;
}): Promise<CompetitionResultsTeamFixturesBundle> {
  const { team_id, fixtures, team_map, competitions, dependencies } = command;
  const team_fixtures_in_competition = fixtures.filter(
    (fixture: Fixture) =>
      fixture.home_team_id === team_id || fixture.away_team_id === team_id,
  );
  const all_fixtures_result = await dependencies.fixture_use_cases.list(
    {},
    { page_number: 1, page_size: 500 },
  );
  const team_fixtures_all_competitions = all_fixtures_result.success
    ? (all_fixtures_result.data?.items || []).filter(
        (fixture: Fixture) =>
          fixture.home_team_id === team_id || fixture.away_team_id === team_id,
      )
    : [];
  const all_team_ids = new Set<string>();
  const all_competition_ids = new Set<string>();

  for (const fixture of team_fixtures_all_competitions) {
    all_team_ids.add(fixture.home_team_id);
    all_team_ids.add(fixture.away_team_id);
    if (fixture.competition_id) all_competition_ids.add(fixture.competition_id);
  }

  const extended_team_map = new Map(team_map);
  for (const current_team_id of all_team_ids) {
    if (extended_team_map.has(current_team_id)) continue;
    const team_result =
      await dependencies.team_use_cases.get_by_id(current_team_id);
    if (team_result.success && team_result.data) {
      extended_team_map.set(current_team_id, team_result.data);
    }
  }

  const extended_competition_map = new Map<string, Competition>(
    competitions.map((competition: Competition) => [
      competition.id,
      competition,
    ]),
  );
  for (const competition_id of all_competition_ids) {
    if (extended_competition_map.has(competition_id)) continue;
    const competition_result =
      await dependencies.competition_use_cases.get_by_id(competition_id);
    if (competition_result.success && competition_result.data) {
      extended_competition_map.set(competition_id, competition_result.data);
    }
  }

  return {
    team_fixtures_in_competition,
    team_fixtures_all_competitions,
    extended_team_map,
    extended_competition_map,
  };
}
