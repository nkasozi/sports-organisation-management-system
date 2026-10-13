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

function is_team_fixture(fixture: Fixture, team_id: string): boolean {
  return fixture.home_team_id === team_id || fixture.away_team_id === team_id;
}

function collect_fixture_reference_ids(fixtures: Fixture[]): {
  team_ids: Set<string>;
  competition_ids: Set<string>;
} {
  const team_ids = new Set<string>();
  const competition_ids = new Set<string>();
  for (const fixture of fixtures) {
    team_ids.add(fixture.home_team_id);
    team_ids.add(fixture.away_team_id);
    if (fixture.competition_id) competition_ids.add(fixture.competition_id);
  }
  return { team_ids, competition_ids };
}

async function extend_entity_map<EntityType>(
  base_map: Map<string, EntityType>,
  entity_ids: Set<string>,
  load_entity: (entity_id: string) => Promise<EntityResult<EntityType>>,
): Promise<Map<string, EntityType>> {
  const extended_map = new Map(base_map);
  for (const entity_id of entity_ids) {
    if (extended_map.has(entity_id)) continue;
    const entity_result = await load_entity(entity_id);
    if (entity_result.success && entity_result.data) {
      extended_map.set(entity_id, entity_result.data);
    }
  }
  return extended_map;
}

async function load_team_fixtures_all_competitions(
  team_id: string,
  dependencies: CompetitionResultsTeamFixturesDependencies,
): Promise<Fixture[]> {
  const all_fixtures_result = await dependencies.fixture_use_cases.list(
    {},
    { page_number: 1, page_size: 500 },
  );
  return all_fixtures_result.success
    ? (all_fixtures_result.data?.items || []).filter((fixture: Fixture) =>
        is_team_fixture(fixture, team_id),
      )
    : [];
}

function build_competition_map(
  competitions: Competition[],
): Map<string, Competition> {
  return new Map<string, Competition>(
    competitions.map((competition: Competition) => [
      competition.id,
      competition,
    ]),
  );
}

export async function load_team_fixtures_bundle(command: {
  team_id: string;
  fixtures: Fixture[];
  team_map: Map<string, Team>;
  competitions: Competition[];
  dependencies: CompetitionResultsTeamFixturesDependencies;
}): Promise<CompetitionResultsTeamFixturesBundle> {
  const { team_id, dependencies } = command;
  const team_fixtures_in_competition = command.fixtures.filter(
    (fixture: Fixture) => is_team_fixture(fixture, team_id),
  );
  const team_fixtures_all_competitions =
    await load_team_fixtures_all_competitions(team_id, dependencies);
  const reference_ids = collect_fixture_reference_ids(
    team_fixtures_all_competitions,
  );
  const extended_team_map = await extend_entity_map(
    command.team_map,
    reference_ids.team_ids,
    (entity_id: string) => dependencies.team_use_cases.get_by_id(entity_id),
  );
  const extended_competition_map = await extend_entity_map(
    build_competition_map(command.competitions),
    reference_ids.competition_ids,
    (entity_id: string) =>
      dependencies.competition_use_cases.get_by_id(entity_id),
  );

  return {
    team_fixtures_in_competition,
    team_fixtures_all_competitions,
    extended_team_map,
    extended_competition_map,
  };
}
