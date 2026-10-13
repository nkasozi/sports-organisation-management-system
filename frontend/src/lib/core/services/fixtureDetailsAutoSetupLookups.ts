import type { Fixture } from "../entities/Fixture";
import type { PaginatedResult, Result } from "../types/Result";
import { create_success_result } from "../types/Result";
import { fail_use_case, UseCaseErrorCode } from "../types/UseCaseFailure";
import type { FixtureDetailsSetupUseCases } from "../usecases/FixtureDetailsSetupUseCases";
import type { GameOfficialRoleUseCases } from "../usecases/GameOfficialRoleUseCases";
import type { JerseyColorUseCases } from "../usecases/JerseyColorUseCases";
import type { OfficialUseCases } from "../usecases/OfficialUseCases";
import {
  FIXTURE_DETAILS_AUTO_SETUP_EVENT,
  FIXTURE_DETAILS_AUTO_SETUP_LOG_SCOPE,
  FIXTURE_DETAILS_AUTO_SETUP_LOOKUP,
  FIXTURE_DETAILS_AUTO_SETUP_LOOKUP_FAILED_MESSAGE,
  FIXTURE_DETAILS_AUTO_SETUP_PAGE_SIZE,
} from "./FixtureDetailsAutoSetupConstants";

export interface AutoSetupDependencies {
  fixture_details_setup_use_cases: FixtureDetailsSetupUseCases;
  jersey_color_use_cases: JerseyColorUseCases;
  official_use_cases: OfficialUseCases;
  game_official_role_use_cases: GameOfficialRoleUseCases;
}

type AutoSetupLookupName =
  (typeof FIXTURE_DETAILS_AUTO_SETUP_LOOKUP)[keyof typeof FIXTURE_DETAILS_AUTO_SETUP_LOOKUP];

interface IdentifiedItem {
  id: string;
}

export type AutoSetupLookups = Record<AutoSetupLookupName, IdentifiedItem[]>;

type LookupEntry = [
  AutoSetupLookupName,
  Result<PaginatedResult<IdentifiedItem>>,
];

const TEAM_HOLDER_TYPE = "team";
const COMPETITION_OFFICIAL_HOLDER_TYPE = "competition_official";

async function fetch_lookup_entries(
  fixture: Fixture,
  dependencies: AutoSetupDependencies,
): Promise<LookupEntry[]> {
  const { jersey_color_use_cases, official_use_cases } = dependencies;
  const page = {
    page_number: 1,
    page_size: FIXTURE_DETAILS_AUTO_SETUP_PAGE_SIZE,
  };
  const results = await Promise.all([
    jersey_color_use_cases.list_jerseys_by_entity(
      TEAM_HOLDER_TYPE,
      fixture.home_team_id,
    ),
    jersey_color_use_cases.list_jerseys_by_entity(
      TEAM_HOLDER_TYPE,
      fixture.away_team_id,
    ),
    jersey_color_use_cases.list_jerseys_by_entity(
      COMPETITION_OFFICIAL_HOLDER_TYPE,
      fixture.competition_id,
    ),
    official_use_cases.list({ organization_id: fixture.organization_id }, page),
    dependencies.game_official_role_use_cases.list({}, page),
  ]);
  return [
    [FIXTURE_DETAILS_AUTO_SETUP_LOOKUP.HOME_JERSEYS, results[0]],
    [FIXTURE_DETAILS_AUTO_SETUP_LOOKUP.AWAY_JERSEYS, results[1]],
    [FIXTURE_DETAILS_AUTO_SETUP_LOOKUP.OFFICIAL_JERSEYS, results[2]],
    [FIXTURE_DETAILS_AUTO_SETUP_LOOKUP.OFFICIALS, results[3]],
    [FIXTURE_DETAILS_AUTO_SETUP_LOOKUP.OFFICIAL_ROLES, results[4]],
  ];
}

export async function load_auto_setup_lookups(
  fixture: Fixture,
  dependencies: AutoSetupDependencies,
): Promise<Result<AutoSetupLookups>> {
  const entries = await fetch_lookup_entries(fixture, dependencies);
  const lookups: Partial<AutoSetupLookups> = {};
  for (const [lookup, result] of entries) {
    if (!result.success) {
      return fail_use_case({
        code: UseCaseErrorCode.DEPENDENCY_FAILED,
        event: FIXTURE_DETAILS_AUTO_SETUP_EVENT.LOOKUP_FAILED,
        log_scope: FIXTURE_DETAILS_AUTO_SETUP_LOG_SCOPE,
        context: { fixture_id: fixture.id, lookup },
        user_message: FIXTURE_DETAILS_AUTO_SETUP_LOOKUP_FAILED_MESSAGE,
        technical_detail: result.error,
      });
    }
    lookups[lookup] = result.data.items;
  }
  return create_success_result({
    home_jerseys: lookups.home_jerseys ?? [],
    away_jerseys: lookups.away_jerseys ?? [],
    official_jerseys: lookups.official_jerseys ?? [],
    officials: lookups.officials ?? [],
    official_roles: lookups.official_roles ?? [],
  });
}
