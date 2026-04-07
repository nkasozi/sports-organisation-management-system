import type { Competition } from "$lib/core/entities/Competition";
import type {
  CompetitionFormat,
  PointsConfig,
  TieBreaker,
} from "$lib/core/entities/CompetitionFormat";
import { DEFAULT_POINTS_CONFIG } from "$lib/core/entities/CompetitionFormat";
import type { CompetitionStage } from "$lib/core/entities/CompetitionStage";
import type { CompetitionTeam } from "$lib/core/entities/CompetitionTeam";
import type { Fixture } from "$lib/core/entities/Fixture";
import type { Organization } from "$lib/core/entities/Organization";
import type { Team } from "$lib/core/entities/Team";
import {
  build_authorization_list_filter,
  get_scope_value,
  type UserScopeProfile,
} from "$lib/core/interfaces/ports";

interface EntityListResult<EntityType> {
  success: boolean;
  data?: { items: EntityType[] };
  error?: string;
}

interface EntityResult<EntityType> {
  success: boolean;
  data?: EntityType;
  error?: string;
}

export interface CompetitionResultsDependencies {
  organization_use_cases: {
    list: (
      filters?: Record<string, string>,
    ) => Promise<EntityListResult<Organization>>;
  };
  competition_use_cases: {
    list: (
      filters: Record<string, string>,
      pagination: { page_number: number; page_size: number },
    ) => Promise<EntityListResult<Competition>>;
    get_by_id: (competition_id: string) => Promise<EntityResult<Competition>>;
  };
  format_use_cases: {
    get_by_id: (
      competition_format_id: string,
    ) => Promise<EntityResult<CompetitionFormat>>;
  };
  competition_stage_use_cases: {
    list_stages_by_competition: (
      competition_id: string,
      pagination: { page_number: number; page_size: number },
    ) => Promise<EntityListResult<CompetitionStage>>;
  };
  competition_team_use_cases: {
    list_teams_in_competition: (
      competition_id: string,
      pagination: { page_number: number; page_size: number },
    ) => Promise<EntityListResult<CompetitionTeam>>;
  };
  team_use_cases: {
    get_by_id: (team_id: string) => Promise<EntityResult<Team>>;
  };
  fixture_use_cases: {
    list_fixtures_by_competition: (
      competition_id: string,
    ) => Promise<EntityListResult<Fixture>>;
  };
}

export interface CompetitionResultsCompetitionBundle {
  selected_competition: Competition | null;
  competition_format: CompetitionFormat | null;
  competition_stages: CompetitionStage[];
  teams: Team[];
  team_map: Map<string, Team>;
  fixtures: Fixture[];
}

export function extract_competition_results_url_params(url: URL): {
  org_id: string;
  competition_id: string;
} {
  return {
    org_id: url.searchParams.get("org") ?? "",
    competition_id: url.searchParams.get("competition") ?? "",
  };
}

export function build_shareable_competition_results_url(
  base_url: string,
  organization_id: string,
  competition_id: string,
): string {
  const params = new URLSearchParams();
  params.set("org", organization_id);
  params.set("competition", competition_id);
  return `${base_url}/competition-results?${params.toString()}`;
}

export function derive_effective_points_config(
  competition_format: CompetitionFormat | null,
  competition: Competition | null,
): PointsConfig {
  const base_config =
    competition_format?.points_config ?? DEFAULT_POINTS_CONFIG;
  const points_override = competition?.rule_overrides?.points_config_override;
  if (!points_override) return base_config;
  return {
    points_for_win:
      points_override.points_for_win ?? base_config.points_for_win,
    points_for_draw:
      points_override.points_for_draw ?? base_config.points_for_draw,
    points_for_loss:
      points_override.points_for_loss ?? base_config.points_for_loss,
  };
}

export function derive_effective_tie_breakers(
  competition_format: CompetitionFormat | null,
  competition: Competition | null,
): TieBreaker[] {
  return (
    competition?.rule_overrides?.tie_breakers_override ??
    competition_format?.tie_breakers ?? ["goal_difference", "goals_scored"]
  );
}

export function build_competition_results_auth_filter(
  current_profile: UserScopeProfile | null | undefined,
): Record<string, string> {
  if (!current_profile) return {};
  return build_authorization_list_filter(current_profile, [
    "organization_id",
    "id",
  ]);
}

export async function load_competition_results_organizations(
  current_profile: UserScopeProfile | null | undefined,
  organization_use_cases: CompetitionResultsDependencies["organization_use_cases"],
): Promise<Organization[]> {
  const result = await organization_use_cases.list({});
  if (!result.success) return [];
  const all_organizations = result.data?.items || [];
  const organization_scope = get_scope_value(
    current_profile ?? null,
    "organization_id",
  );
  if (!organization_scope) return all_organizations;
  return all_organizations.filter(
    (organization: Organization) => organization.id === organization_scope,
  );
}

export async function load_competitions_by_organization(
  competition_use_cases: CompetitionResultsDependencies["competition_use_cases"],
  organization_id: string,
): Promise<Competition[]> {
  const result = await competition_use_cases.list(
    { organization_id },
    { page_number: 1, page_size: 100 },
  );
  return result.success ? result.data?.items || [] : [];
}

export async function load_selected_competition_bundle(
  dependencies: CompetitionResultsDependencies,
  selected_competition_id: string,
): Promise<CompetitionResultsCompetitionBundle> {
  if (!selected_competition_id) {
    return {
      selected_competition: null,
      competition_format: null,
      competition_stages: [],
      teams: [],
      team_map: new Map(),
      fixtures: [],
    };
  }

  const competition_result = await dependencies.competition_use_cases.get_by_id(
    selected_competition_id,
  );
  const selected_competition = competition_result.success
    ? (competition_result.data ?? null)
    : null;
  const competition_format = selected_competition?.competition_format_id
    ? ((
        await dependencies.format_use_cases.get_by_id(
          selected_competition.competition_format_id,
        )
      ).data ?? null)
    : null;
  const competition_stages_result =
    await dependencies.competition_stage_use_cases.list_stages_by_competition(
      selected_competition_id,
      { page_number: 1, page_size: 100 },
    );
  const competition_teams_result =
    await dependencies.competition_team_use_cases.list_teams_in_competition(
      selected_competition_id,
      { page_number: 1, page_size: 100 },
    );
  const team_results = await Promise.all(
    (competition_teams_result.success
      ? competition_teams_result.data?.items || []
      : []
    ).map((competition_team: CompetitionTeam) =>
      dependencies.team_use_cases.get_by_id(competition_team.team_id),
    ),
  );
  const teams = team_results.flatMap((team_result: EntityResult<Team>) =>
    team_result.success && team_result.data ? [team_result.data] : [],
  );
  const fixtures_result =
    await dependencies.fixture_use_cases.list_fixtures_by_competition(
      selected_competition_id,
    );

  return {
    selected_competition,
    competition_format,
    competition_stages: competition_stages_result.success
      ? competition_stages_result.data?.items || []
      : [],
    teams,
    team_map: new Map(teams.map((team: Team) => [team.id, team])),
    fixtures: fixtures_result.success ? fixtures_result.data?.items || [] : [],
  };
}
