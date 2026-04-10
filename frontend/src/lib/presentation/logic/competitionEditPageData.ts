import { get_sport_by_id } from "$lib/adapters/persistence/sportService";
import type {
  Competition,
  UpdateCompetitionInput,
} from "$lib/core/entities/Competition";
import type { CompetitionFormat } from "$lib/core/entities/CompetitionFormat";
import type { CompetitionTeam } from "$lib/core/entities/CompetitionTeam";
import type { Organization } from "$lib/core/entities/Organization";
import type { Sport } from "$lib/core/entities/Sport";
import type { Team } from "$lib/core/entities/Team";
import {
  ANY_VALUE,
  build_authorization_list_filter,
  type UserScopeProfile,
} from "$lib/core/interfaces/ports";

import { create_competition_update_form_data } from "./competitionEditPageState";

interface EntityListResult<EntityType> {
  success: boolean;
  data?: { items: EntityType[] };
  error?: string;
}

interface EntityByIdResult<EntityType> {
  success: boolean;
  data?: EntityType;
  error?: string;
}

interface CompetitionEditPageDependencies {
  competition_use_cases: {
    get_by_id: (
      competition_id: string,
    ) => Promise<EntityByIdResult<Competition>>;
  };
  organization_use_cases: {
    list: (
      filters: Record<string, string>,
      pagination: { page_number: number; page_size: number },
    ) => Promise<EntityListResult<Organization>>;
  };
  team_use_cases: {
    list: (
      filters: Record<string, string>,
      pagination: { page_number: number; page_size: number },
    ) => Promise<EntityListResult<Team>>;
  };
  competition_team_use_cases: {
    list_teams_in_competition: (
      competition_id: string,
      pagination: { page_number: number; page_size: number },
    ) => Promise<EntityListResult<CompetitionTeam>>;
  };
  competition_format_use_cases: {
    list: (
      filters: Record<string, string> | undefined,
      pagination: { page_number: number; page_size: number },
    ) => Promise<EntityListResult<CompetitionFormat>>;
  };
}

interface CompetitionEditPageLoadedData {
  competition: Competition;
  organizations: Organization[];
  competition_formats: CompetitionFormat[];
  all_teams: Team[];
  competition_team_entries: CompetitionTeam[];
  form_data: UpdateCompetitionInput;
  selected_format: CompetitionFormat | null;
  selected_sport: Sport | null;
  is_customizing_scoring: boolean;
}

export function build_competition_edit_auth_filter(
  current_profile: UserScopeProfile | null | undefined,
): Record<string, string> {
  if (!current_profile) return {};
  return build_authorization_list_filter(current_profile, ["organization_id"]);
}

function get_accessible_organizations(
  all_organizations: Organization[],
  current_profile_organization_id: string | undefined,
): Organization[] {
  if (current_profile_organization_id === ANY_VALUE) return all_organizations;
  if (!current_profile_organization_id) return [];
  return all_organizations.filter(
    (organization: Organization) =>
      organization.id === current_profile_organization_id,
  );
}

export async function load_competition_edit_sport(
  organizations: Organization[],
  organization_id: string,
): Promise<Sport | null> {
  const selected_organization = organizations.find(
    (organization: Organization) => organization.id === organization_id,
  );
  if (!selected_organization?.sport_id) return null;
  const sport_result = await get_sport_by_id(selected_organization.sport_id);
  if (!sport_result.success || !sport_result.data) return null;
  return sport_result.data;
}

export async function load_competition_edit_page_data(command: {
  competition_id: string;
  current_profile: UserScopeProfile | null | undefined;
  current_profile_organization_id: string | undefined;
  dependencies: CompetitionEditPageDependencies;
}): Promise<
  | { success: true; data: CompetitionEditPageLoadedData }
  | { success: false; error_message: string }
> {
  const {
    competition_id,
    current_profile,
    current_profile_organization_id,
    dependencies,
  } = command;
  const [
    competition_result,
    organizations_result,
    teams_result,
    competition_teams_result,
    formats_result,
  ] = await Promise.all([
    dependencies.competition_use_cases.get_by_id(competition_id),
    dependencies.organization_use_cases.list(
      {},
      { page_number: 1, page_size: 100 },
    ),
    dependencies.team_use_cases.list(
      build_competition_edit_auth_filter(current_profile),
      { page_number: 1, page_size: 100 },
    ),
    dependencies.competition_team_use_cases.list_teams_in_competition(
      competition_id,
      { page_number: 1, page_size: 100 },
    ),
    dependencies.competition_format_use_cases.list(undefined, {
      page_number: 1,
      page_size: 100,
    }),
  ]);

  if (!competition_result.success) {
    return {
      success: false,
      error_message: competition_result.error || "Failed to load competition",
    };
  }

  if (!competition_result.data) {
    return { success: false, error_message: "Competition not found" };
  }

  const competition = competition_result.data;
  const organizations = get_accessible_organizations(
    organizations_result.success ? organizations_result.data?.items || [] : [],
    current_profile_organization_id,
  );
  const competition_formats = (
    formats_result.success ? formats_result.data?.items || [] : []
  ).filter(
    (competition_format: CompetitionFormat) =>
      competition_format.status === "active",
  );

  return {
    success: true,
    data: {
      competition,
      organizations,
      competition_formats,
      all_teams: teams_result.success ? teams_result.data?.items || [] : [],
      competition_team_entries: competition_teams_result.success
        ? competition_teams_result.data?.items || []
        : [],
      form_data: create_competition_update_form_data(competition),
      selected_format:
        competition_formats.find(
          (competition_format: CompetitionFormat) =>
            competition_format.id === competition.competition_format_id,
        ) || null,
      selected_sport: await load_competition_edit_sport(
        organizations,
        competition.organization_id,
      ),
      is_customizing_scoring: !!(
        competition.rule_overrides?.points_config_override ||
        competition.rule_overrides?.tie_breakers_override
      ),
    },
  };
}
