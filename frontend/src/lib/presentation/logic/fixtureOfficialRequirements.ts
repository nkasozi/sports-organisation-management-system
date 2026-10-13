import type { Competition } from "$lib/core/entities/Competition";
import type { Fixture } from "$lib/core/entities/Fixture";
import type { Sport } from "$lib/core/entities/Sport";
import type { OfficialRequirementSource } from "$lib/core/services/officialRoleSlots";
import type { Result } from "$lib/core/types/Result";

import {
  type CompetitionSportLookupDependencies,
  find_competition_sport,
} from "./competitionSportLookup";

const FIXTURE_OFFICIALS_LOG_SCOPE =
  "[FixtureOfficials] Official requirements unavailable";
const FIXTURE_OFFICIALS_UNAVAILABLE_EVENT =
  "fixture_official_requirements_unavailable";

export interface FixtureOfficialRequirementsDependencies extends CompetitionSportLookupDependencies {
  competition_use_cases: {
    get_by_id: (competition_id: string) => Promise<Result<Competition>>;
  };
}

function select_requirements(
  competition: Competition,
  sport: Sport,
): OfficialRequirementSource[] {
  return (
    competition.rule_overrides?.official_requirements ??
    sport.official_requirements
  );
}

function log_unavailable(fixture: Fixture, error: string): boolean {
  console.warn(FIXTURE_OFFICIALS_LOG_SCOPE, {
    event: FIXTURE_OFFICIALS_UNAVAILABLE_EVENT,
    fixture_id: fixture.id,
    error,
  });
  return true;
}

export async function load_fixture_official_requirements(
  fixture: Fixture,
  dependencies: FixtureOfficialRequirementsDependencies,
): Promise<OfficialRequirementSource[]> {
  const competition_result = await dependencies.competition_use_cases.get_by_id(
    fixture.competition_id,
  );
  if (!competition_result.success) {
    log_unavailable(fixture, competition_result.error);
    return [];
  }
  const sport_result = await find_competition_sport(
    competition_result.data,
    dependencies,
  );
  if (!sport_result.success) {
    log_unavailable(fixture, sport_result.error);
    return [];
  }
  return select_requirements(competition_result.data, sport_result.data);
}
