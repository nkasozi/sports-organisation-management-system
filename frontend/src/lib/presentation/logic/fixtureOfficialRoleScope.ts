import type { Fixture } from "$lib/core/entities/Fixture";
import type { OfficialRoleSportScope } from "$lib/core/services/officialRolesForSport";
import {
  create_none_option,
  create_some_option,
  type Option,
} from "$lib/core/types/Option";
import type { Result } from "$lib/core/types/Result";

import { find_competition_sport } from "./competitionSportLookup";
import {
  type FixtureOfficialRequirementsDependencies,
  select_fixture_official_requirements,
} from "./fixtureOfficialRequirements";

interface FixtureOfficialRoleScopeDependencies extends FixtureOfficialRequirementsDependencies {
  fixture_use_cases: {
    get_by_id: (fixture_id: string) => Promise<Result<Fixture>>;
  };
}

const ROLE_SCOPE_LOG_SCOPE = "[FixtureOfficialRoles] Sport unavailable";
const ROLE_SCOPE_UNAVAILABLE_EVENT = "fixture_official_role_scope_unavailable";

function log_scope_unavailable(
  fixture_id: string,
  error: string,
): Option<OfficialRoleSportScope> {
  console.warn(ROLE_SCOPE_LOG_SCOPE, {
    event: ROLE_SCOPE_UNAVAILABLE_EVENT,
    fixture_id,
    error,
  });
  return create_none_option();
}

export async function load_fixture_official_role_scope(
  fixture_id: string,
  dependencies: FixtureOfficialRoleScopeDependencies,
): Promise<Option<OfficialRoleSportScope>> {
  if (!fixture_id) return create_none_option();
  const fixture_result =
    await dependencies.fixture_use_cases.get_by_id(fixture_id);
  if (!fixture_result.success)
    return log_scope_unavailable(fixture_id, fixture_result.error);
  const competition_result = await dependencies.competition_use_cases.get_by_id(
    fixture_result.data.competition_id,
  );
  if (!competition_result.success)
    return log_scope_unavailable(fixture_id, competition_result.error);
  const sport_result = await find_competition_sport(
    competition_result.data,
    dependencies,
  );
  if (!sport_result.success)
    return log_scope_unavailable(fixture_id, sport_result.error);
  return create_some_option({
    sport_id: sport_result.data.id,
    requirements: select_fixture_official_requirements(
      competition_result.data,
      sport_result.data,
    ),
  });
}
