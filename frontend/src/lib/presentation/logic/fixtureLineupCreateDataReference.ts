import type { Organization } from "$lib/core/entities/Organization";
import {
  ANY_VALUE,
  build_authorization_list_filter,
  get_authorization_preselect_values,
} from "$lib/core/interfaces/ports";
import { build_error_message } from "$lib/core/services/fixtureLineupWizard";
import { PRESENCE_STATUS } from "$lib/presentation/logic/presenceStatus";

import type {
  FixtureLineupCreateDependencies,
  FixtureLineupCreateReferenceData,
} from "./fixtureLineupCreateDataTypes";
import {
  type FixtureLineupCreateAuthProfileState,
  resolve_fixture_lineup_create_organization_state,
} from "./fixtureLineupCreatePageContracts";

type ListResultOf<Key extends keyof FixtureLineupCreateDependencies> =
  FixtureLineupCreateDependencies[Key] extends {
    list: (...args: never[]) => Promise<infer ListResult>;
  }
    ? ListResult
    : never;

type ReferenceListResults = [
  ListResultOf<"fixture_use_cases">,
  ListResultOf<"team_use_cases">,
  ListResultOf<"competition_use_cases">,
  ListResultOf<"organization_use_cases">,
];

const REFERENCE_LIST_PAGINATION = { page_number: 1, page_size: 200 };

function extract_items_from_list_result<T>(list_result: {
  success: boolean;
  data?: { items?: T[] };
}): T[] {
  return list_result.success ? list_result.data?.items || [] : [];
}

function filter_organizations_for_user(
  all_fetched_organizations: Organization[],
  user_organization_id: string,
): Organization[] {
  return user_organization_id === ANY_VALUE
    ? all_fetched_organizations
    : user_organization_id
      ? all_fetched_organizations.filter(
          (organization: Organization) =>
            organization.id === user_organization_id,
        )
      : [];
}

function build_no_fixtures_error_message(fixture_count: number): string {
  return fixture_count === 0
    ? build_error_message(
        "No fixtures available.",
        "A fixture is required to submit a team lineup.",
        "Create fixtures first (Fixtures tab), then come back here to submit a lineup.",
      )
    : "";
}

function build_reference_auth_filter(
  current_auth_profile_state: FixtureLineupCreateAuthProfileState,
): Record<string, string> {
  return current_auth_profile_state.status === PRESENCE_STATUS.PRESENT
    ? build_authorization_list_filter(current_auth_profile_state.profile, [
        "organization_id",
      ])
    : {};
}

async function list_reference_records(
  auth_filter: Record<string, string>,
  dependencies: FixtureLineupCreateDependencies,
): Promise<ReferenceListResults> {
  return Promise.all([
    dependencies.fixture_use_cases.list(auth_filter, {
      ...REFERENCE_LIST_PAGINATION,
    }),
    dependencies.team_use_cases.list(auth_filter, {
      ...REFERENCE_LIST_PAGINATION,
    }),
    dependencies.competition_use_cases.list(auth_filter, {
      ...REFERENCE_LIST_PAGINATION,
    }),
    dependencies.organization_use_cases.list(
      {},
      { ...REFERENCE_LIST_PAGINATION },
    ),
  ]);
}

function read_profile_organization_id(
  current_auth_profile_state: FixtureLineupCreateAuthProfileState,
): string {
  return current_auth_profile_state.status === PRESENCE_STATUS.PRESENT
    ? current_auth_profile_state.profile.organization_id
    : "";
}

export async function load_fixture_lineup_create_reference_data(
  current_auth_profile_state: FixtureLineupCreateAuthProfileState,
  form_organization_id: string,
  dependencies: FixtureLineupCreateDependencies,
): Promise<FixtureLineupCreateReferenceData> {
  const preselect_values =
    current_auth_profile_state.status === PRESENCE_STATUS.PRESENT
      ? get_authorization_preselect_values(current_auth_profile_state.profile)
      : {};
  const [
    fixtures_result,
    teams_result,
    competitions_result,
    organizations_result,
  ] = await list_reference_records(
    build_reference_auth_filter(current_auth_profile_state),
    dependencies,
  );
  const fixtures = extract_items_from_list_result(fixtures_result);
  const teams = extract_items_from_list_result(teams_result);
  const organizations = filter_organizations_for_user(
    extract_items_from_list_result(organizations_result),
    read_profile_organization_id(current_auth_profile_state),
  );
  return {
    fixtures,
    teams,
    all_teams: teams,
    all_competitions: extract_items_from_list_result(competitions_result),
    organizations,
    selected_organization_state:
      resolve_fixture_lineup_create_organization_state(
        preselect_values.organization_id || form_organization_id,
        organizations,
      ),
    error_message: build_no_fixtures_error_message(fixtures.length),
  };
}
