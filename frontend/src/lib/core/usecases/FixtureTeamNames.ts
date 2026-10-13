import type { Fixture } from "../entities/Fixture";
import type { Team } from "../entities/Team";
import type { TeamRepository } from "../interfaces/ports";
import { FIXTURE_EVENT, FIXTURE_LOG_SCOPE } from "./FixtureUseCaseConstants";

export type FixtureEnricher = (fixtures: Fixture[]) => Promise<Fixture[]>;

function apply_team_names(fixtures: Fixture[], teams: Team[]): Fixture[] {
  const teams_by_id = new Map<string, Team>(
    teams.map((team) => [team.id, team]),
  );
  return fixtures.map(
    (fixture) =>
      ({
        ...fixture,
        home_team_name:
          teams_by_id.get(fixture.home_team_id)?.name || fixture.home_team_id,
        away_team_name:
          teams_by_id.get(fixture.away_team_id)?.name || fixture.away_team_id,
      }) as Fixture,
  );
}

async function enrich_with_team_names(
  team_repository: TeamRepository,
  fixtures: Fixture[],
): Promise<Fixture[]> {
  if (fixtures.length === 0) return fixtures;
  const teams_result = await team_repository.find_all();
  if (teams_result.success)
    return apply_team_names(fixtures, teams_result.data.items);
  console.warn(FIXTURE_LOG_SCOPE, {
    event: FIXTURE_EVENT.TEAM_NAMES_UNAVAILABLE,
    fixture_count: fixtures.length,
    technical_detail: teams_result.error,
  });
  return fixtures;
}

export function create_fixture_enricher(
  team_repository?: TeamRepository,
): FixtureEnricher {
  if (!team_repository) return async (fixtures) => fixtures;
  return (fixtures) => enrich_with_team_names(team_repository, fixtures);
}
