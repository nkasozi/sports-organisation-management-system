import type { Organization } from "$lib/core/entities/Organization";
import {
  ANY_VALUE,
  build_authorization_list_filter,
  get_authorization_preselect_values,
  type UserScopeProfile,
} from "$lib/core/interfaces/ports";
import { build_error_message } from "$lib/core/services/fixtureLineupWizard";

import type {
  FixtureLineupCreateDependencies,
  FixtureLineupCreateReferenceData,
} from "./fixtureLineupCreateDataTypes";

export async function load_fixture_lineup_create_reference_data(
  current_auth_profile: UserScopeProfile | null,
  form_organization_id: string,
  dependencies: FixtureLineupCreateDependencies,
): Promise<FixtureLineupCreateReferenceData> {
  const auth_filter = build_authorization_list_filter(current_auth_profile, [
    "organization_id",
  ]);
  const preselect_values =
    get_authorization_preselect_values(current_auth_profile);
  const [
    fixtures_result,
    teams_result,
    competitions_result,
    organizations_result,
  ] = await Promise.all([
    dependencies.fixture_use_cases.list(auth_filter, {
      page_number: 1,
      page_size: 200,
    }),
    dependencies.team_use_cases.list(auth_filter, {
      page_number: 1,
      page_size: 200,
    }),
    dependencies.competition_use_cases.list(auth_filter, {
      page_number: 1,
      page_size: 200,
    }),
    dependencies.organization_use_cases.list(
      {},
      { page_number: 1, page_size: 200 },
    ),
  ]);
  const fixtures = fixtures_result.success
    ? fixtures_result.data?.items || []
    : [];
  const teams = teams_result.success ? teams_result.data?.items || [] : [];
  const all_competitions = competitions_result.success
    ? competitions_result.data?.items || []
    : [];
  const all_fetched_organizations = organizations_result.success
    ? organizations_result.data?.items || []
    : [];
  const user_organization_id = current_auth_profile?.organization_id;
  const organizations: Organization[] =
    user_organization_id === ANY_VALUE
      ? all_fetched_organizations
      : user_organization_id
        ? all_fetched_organizations.filter(
            (organization: Organization) =>
              organization.id === user_organization_id,
          )
        : [];
  const selected_organization =
    organizations.find(
      (organization: Organization) =>
        organization.id ===
        (preselect_values.organization_id || form_organization_id),
    ) || null;
  return {
    fixtures,
    teams,
    all_teams: teams,
    all_competitions,
    organizations,
    selected_organization,
    error_message:
      fixtures.length === 0
        ? build_error_message(
            "No fixtures available.",
            "A fixture is required to submit a team lineup.",
            "Create fixtures first (Fixtures tab), then come back here to submit a lineup.",
          )
        : "",
  };
}
