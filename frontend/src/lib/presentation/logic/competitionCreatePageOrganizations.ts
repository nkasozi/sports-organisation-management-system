import type { Organization } from "$lib/core/entities/Organization";
import type { SelectOption } from "$lib/presentation/components/ui/SelectField.svelte";
import { PRESENCE_STATUS } from "$lib/presentation/logic/presenceStatus";

import type {
  CompetitionCreatePageDependencies,
  CompetitionCreateProfileState,
} from "./competitionCreatePageData";

interface CompetitionCreateOrganizationsResult {
  organization_options: SelectOption[];
  organizations: Organization[];
  preselected_organization_id: string;
}

const EMPTY_ORGANIZATION_ID = "";

function get_restricted_organization_id(command: {
  current_auth_profile_state: CompetitionCreateProfileState;
  is_organization_restricted: boolean;
}): string {
  if (!command.is_organization_restricted) {
    return EMPTY_ORGANIZATION_ID;
  }
  if (command.current_auth_profile_state.status !== PRESENCE_STATUS.PRESENT) {
    return EMPTY_ORGANIZATION_ID;
  }
  return (
    command.current_auth_profile_state.profile.organization_id ||
    EMPTY_ORGANIZATION_ID
  );
}

async function load_restricted_competition_create_organization(
  organization_id: string,
  dependencies: CompetitionCreatePageDependencies,
): Promise<CompetitionCreateOrganizationsResult> {
  const organization_result =
    await dependencies.organization_use_cases.get_by_id(organization_id);
  if (!organization_result.success || !organization_result.data) {
    return {
      organizations: [],
      organization_options: [],
      preselected_organization_id: EMPTY_ORGANIZATION_ID,
    };
  }
  return {
    organizations: [organization_result.data],
    organization_options: [
      {
        value: organization_result.data.id,
        label: organization_result.data.name,
      },
    ],
    preselected_organization_id: organization_result.data.id,
  };
}

async function load_all_competition_create_organizations(
  dependencies: CompetitionCreatePageDependencies,
): Promise<CompetitionCreateOrganizationsResult> {
  const organizations_result = await dependencies.organization_use_cases.list(
    {},
    {
      page_number: 1,
      page_size: 100,
    },
  );
  const organizations = organizations_result.success
    ? organizations_result.data?.items || []
    : [];
  return {
    organizations,
    organization_options: organizations.map(
      (organization: Organization): SelectOption => ({
        value: organization.id,
        label: organization.name,
      }),
    ),
    preselected_organization_id: EMPTY_ORGANIZATION_ID,
  };
}

export async function load_competition_create_organizations(command: {
  current_auth_profile_state: CompetitionCreateProfileState;
  dependencies: CompetitionCreatePageDependencies;
  is_organization_restricted: boolean;
}): Promise<CompetitionCreateOrganizationsResult> {
  const restricted_organization_id = get_restricted_organization_id(command);
  return restricted_organization_id
    ? load_restricted_competition_create_organization(
        restricted_organization_id,
        command.dependencies,
      )
    : load_all_competition_create_organizations(command.dependencies);
}
