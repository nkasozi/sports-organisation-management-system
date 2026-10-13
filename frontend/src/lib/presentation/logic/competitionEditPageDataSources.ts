import type { Competition } from "$lib/core/entities/Competition";
import type { CompetitionFormat } from "$lib/core/entities/CompetitionFormat";
import type { CompetitionTeam } from "$lib/core/entities/CompetitionTeam";
import type { Organization } from "$lib/core/entities/Organization";
import type { Team } from "$lib/core/entities/Team";

export interface EntityListResult<EntityType> {
  success: boolean;
  data?: { items: EntityType[] };
  error?: string;
}

export interface EntityByIdResult<EntityType> {
  success: boolean;
  data?: EntityType;
  error?: string;
}

export interface CompetitionEditPageDependencies {
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

export interface CompetitionEditPageSourceResults {
  competition_result: EntityByIdResult<Competition>;
  organizations_result: EntityListResult<Organization>;
  teams_result: EntityListResult<Team>;
  competition_teams_result: EntityListResult<CompetitionTeam>;
  formats_result: EntityListResult<CompetitionFormat>;
}

const COMPETITION_EDIT_PAGINATION = { page_number: 1, page_size: 100 };

export function extract_competition_edit_list_items<EntityType>(
  list_result: EntityListResult<EntityType>,
): EntityType[] {
  return list_result.success ? list_result.data?.items || [] : [];
}

export async function fetch_competition_edit_page_sources(
  competition_id: string,
  team_filter: Record<string, string>,
  dependencies: CompetitionEditPageDependencies,
): Promise<CompetitionEditPageSourceResults> {
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
      { ...COMPETITION_EDIT_PAGINATION },
    ),
    dependencies.team_use_cases.list(team_filter, {
      ...COMPETITION_EDIT_PAGINATION,
    }),
    dependencies.competition_team_use_cases.list_teams_in_competition(
      competition_id,
      { ...COMPETITION_EDIT_PAGINATION },
    ),
    dependencies.competition_format_use_cases.list(
      {},
      { ...COMPETITION_EDIT_PAGINATION },
    ),
  ]);
  return {
    competition_result,
    organizations_result,
    teams_result,
    competition_teams_result,
    formats_result,
  };
}
