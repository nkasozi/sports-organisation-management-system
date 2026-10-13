import { type Mock, vi } from "vitest";

import type { FixtureLineupCreateDependencies } from "./fixtureLineupCreateDataTypes";

type MockDependencies = {
  [Key in keyof FixtureLineupCreateDependencies]?: Partial<
    FixtureLineupCreateDependencies[Key]
  >;
};

export function create_fixture_lineup_dependencies(): {
  fixture_use_cases: { get_by_id: Mock };
  competition_use_cases: { get_by_id: Mock };
  organization_use_cases: { get_by_id: Mock };
  competition_team_use_cases: { list_teams_in_competition: Mock };
  team_use_cases: { get_by_id: Mock };
  lineup_use_cases: { list_lineups_by_fixture: Mock };
} {
  return {
    fixture_use_cases: { get_by_id: vi.fn() },
    competition_use_cases: { get_by_id: vi.fn() },
    organization_use_cases: { get_by_id: vi.fn() },
    competition_team_use_cases: { list_teams_in_competition: vi.fn() },
    team_use_cases: { get_by_id: vi.fn() },
    lineup_use_cases: { list_lineups_by_fixture: vi.fn() },
  } satisfies MockDependencies;
}
