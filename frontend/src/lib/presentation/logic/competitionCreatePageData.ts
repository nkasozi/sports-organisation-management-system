import { get_sport_by_id } from "$lib/adapters/persistence/sportService";
import type { CompetitionFormat } from "$lib/core/entities/CompetitionFormat";
import type { Organization } from "$lib/core/entities/Organization";
import type { Sport } from "$lib/core/entities/Sport";
import type { Team } from "$lib/core/entities/Team";
import type { UserScopeProfile } from "$lib/core/interfaces/ports";
import {
  create_failure_result,
  create_success_result,
  type Result,
} from "$lib/core/types/Result";
import type { SelectOption } from "$lib/presentation/components/ui/SelectField.svelte";

const COMPETITION_CREATE_PAGE_TEXT = {
  cancelled: "Cancelled",
  completed: "Completed",
  upcoming: "Upcoming",
  active: "Active",
} as const;
const ORGANIZATION_SPORT_UNAVAILABLE_ERROR =
  "Organization sport is unavailable";

type EntityListResult<EntityType> = {
  success: boolean;
  data?: { items: EntityType[] };
  error?: string;
};

type EntityResult<EntityType> = {
  success: boolean;
  data?: EntityType;
  error?: string;
};

export interface CompetitionCreatePageDependencies {
  competition_format_use_cases: {
    list: (
      filters?: Record<string, string>,
      pagination?: { page_number: number; page_size: number },
    ) => Promise<EntityListResult<CompetitionFormat>>;
  };
  organization_use_cases: {
    get_by_id: (organization_id: string) => Promise<EntityResult<Organization>>;
    list: (
      filters?: Record<string, string>,
      pagination?: { page_number: number; page_size: number },
    ) => Promise<EntityListResult<Organization>>;
  };
  team_use_cases: {
    list: (
      filters?: Record<string, string>,
      pagination?: { page_number: number; page_size: number },
    ) => Promise<EntityListResult<Team>>;
  };
}

export type CompetitionCreateProfileState =
  | { status: "missing" }
  | { status: "present"; profile: UserScopeProfile };

export const competition_create_status_options: SelectOption[] = [
  { value: "upcoming", label: COMPETITION_CREATE_PAGE_TEXT.upcoming },
  { value: "active", label: COMPETITION_CREATE_PAGE_TEXT.active },
  { value: "completed", label: COMPETITION_CREATE_PAGE_TEXT.completed },
  { value: "cancelled", label: COMPETITION_CREATE_PAGE_TEXT.cancelled },
];

export async function load_competition_create_organizations(command: {
  current_auth_profile_state: CompetitionCreateProfileState;
  dependencies: CompetitionCreatePageDependencies;
  is_organization_restricted: boolean;
}): Promise<{
  organization_options: SelectOption[];
  organizations: Organization[];
  preselected_organization_id: string;
}> {
  if (
    command.is_organization_restricted &&
    command.current_auth_profile_state.status === "present" &&
    command.current_auth_profile_state.profile.organization_id
  ) {
    const organization_result =
      await command.dependencies.organization_use_cases.get_by_id(
        command.current_auth_profile_state.profile.organization_id,
      );
    if (!organization_result.success || !organization_result.data) {
      return {
        organizations: [],
        organization_options: [],
        preselected_organization_id: "",
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

  const organizations_result =
    await command.dependencies.organization_use_cases.list(
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
    preselected_organization_id: "",
  };
}

export async function load_competition_create_formats(
  organization_id: string,
  dependencies: CompetitionCreatePageDependencies,
): Promise<{
  competition_format_options: SelectOption[];
  competition_formats: CompetitionFormat[];
}> {
  const formats_result = await dependencies.competition_format_use_cases.list(
    organization_id ? { organization_id } : {},
    {
      page_number: 1,
      page_size: 100,
    },
  );
  const competition_formats = (
    formats_result.success ? formats_result.data?.items || [] : []
  ).filter(
    (competition_format: CompetitionFormat) =>
      competition_format.status === "active",
  );
  return {
    competition_formats,
    competition_format_options: competition_formats.map(
      (competition_format: CompetitionFormat): SelectOption => ({
        value: competition_format.id,
        label: competition_format.name,
      }),
    ),
  };
}

export async function load_competition_create_sport(
  organization_id: string,
  organizations: Organization[],
): Promise<Result<Sport>> {
  const selected_organization = organizations.find(
    (organization: Organization) => organization.id === organization_id,
  );
  if (!selected_organization?.sport_id) {
    return create_failure_result(ORGANIZATION_SPORT_UNAVAILABLE_ERROR);
  }

  const sport_result = await get_sport_by_id(selected_organization.sport_id);

  if (!sport_result.success || !sport_result.data) {
    return create_failure_result(
      sport_result.error || ORGANIZATION_SPORT_UNAVAILABLE_ERROR,
    );
  }

  return create_success_result(sport_result.data);
}

export async function load_competition_create_team_options(
  organization_id: string,
  dependencies: CompetitionCreatePageDependencies,
): Promise<SelectOption[]> {
  const teams_result = await dependencies.team_use_cases.list(
    { organization_id },
    {
      page_number: 1,
      page_size: 200,
    },
  );
  return teams_result.success
    ? (teams_result.data?.items || []).map(
        (team: Team): SelectOption => ({
          value: team.id,
          label: team.name,
        }),
      )
    : [];
}
