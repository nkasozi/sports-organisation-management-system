import type { Competition } from "$lib/core/entities/Competition";
import type {
  PointsConfig,
  TieBreaker,
} from "$lib/core/entities/CompetitionFormat";
import { DEFAULT_POINTS_CONFIG } from "$lib/core/entities/CompetitionFormat";
import type { CompetitionTeam } from "$lib/core/entities/CompetitionTeam";
import type { Organization } from "$lib/core/entities/Organization";
import type { Team } from "$lib/core/entities/Team";
import { ANY_VALUE } from "$lib/core/interfaces/ports";

import type { CompetitionResultsProfileState } from "./competitionResultsPageContracts";
import type {
  CompetitionResultsCompetitionFormatState,
  CompetitionResultsSelectedCompetitionState,
} from "./competitionResultsPageContracts";
import type {
  CompetitionResultsCompetitionBundle,
  CompetitionResultsDependencies,
  EntityResult,
} from "./competitionResultsPageTypes";

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
  competition_format_state: CompetitionResultsCompetitionFormatState,
  selected_competition_state: CompetitionResultsSelectedCompetitionState,
): PointsConfig {
  const base_config =
    competition_format_state.status === "present"
      ? (competition_format_state.competition_format.points_config ??
        DEFAULT_POINTS_CONFIG)
      : DEFAULT_POINTS_CONFIG;
  if (selected_competition_state.status === "missing") {
    return base_config;
  }

  const points_override =
    selected_competition_state.competition.rule_overrides
      ?.points_config_override;

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
  competition_format_state: CompetitionResultsCompetitionFormatState,
  selected_competition_state: CompetitionResultsSelectedCompetitionState,
): TieBreaker[] {
  if (
    selected_competition_state.status === "present" &&
    selected_competition_state.competition.rule_overrides?.tie_breakers_override
  ) {
    return selected_competition_state.competition.rule_overrides
      .tie_breakers_override;
  }

  if (competition_format_state.status === "present") {
    return (
      competition_format_state.competition_format.tie_breakers ?? [
        "goal_difference",
        "goals_scored",
      ]
    );
  }

  return ["goal_difference", "goals_scored"];
}

function build_selected_competition_state(
  competition_result: EntityResult<Competition>,
): CompetitionResultsSelectedCompetitionState {
  if (!competition_result.success || !competition_result.data) {
    return { status: "missing" };
  }

  return {
    status: "present",
    competition: competition_result.data,
  };
}

async function load_competition_format_state(
  dependencies: CompetitionResultsDependencies,
  selected_competition_state: CompetitionResultsSelectedCompetitionState,
): Promise<CompetitionResultsCompetitionFormatState> {
  if (selected_competition_state.status === "missing") {
    return { status: "missing" };
  }

  const competition_format_id =
    selected_competition_state.competition.competition_format_id;

  if (!competition_format_id) {
    return { status: "missing" };
  }

  const competition_format_result =
    await dependencies.format_use_cases.get_by_id(competition_format_id);

  if (!competition_format_result.success || !competition_format_result.data) {
    return { status: "missing" };
  }

  return {
    status: "present",
    competition_format: competition_format_result.data,
  };
}

export async function load_competition_results_organizations(
  current_profile_state: CompetitionResultsProfileState,
  organization_use_cases: CompetitionResultsDependencies["organization_use_cases"],
): Promise<Organization[]> {
  const result = await organization_use_cases.list({});
  if (!result.success) return [];
  const all_organizations = result.data?.items || [];
  const organization_scope =
    current_profile_state.status === "present"
      ? current_profile_state.profile.organization_id
      : "";
  if (!organization_scope || organization_scope === ANY_VALUE) {
    return all_organizations;
  }
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
      selected_competition_state: { status: "missing" },
      competition_format_state: { status: "missing" },
      competition_stages: [],
      teams: [],
      team_map: new Map(),
      fixtures: [],
    };
  }
  const competition_result = await dependencies.competition_use_cases.get_by_id(
    selected_competition_id,
  );
  const selected_competition_state =
    build_selected_competition_state(competition_result);
  const competition_format_state = await load_competition_format_state(
    dependencies,
    selected_competition_state,
  );
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
    selected_competition_state,
    competition_format_state,
    competition_stages: competition_stages_result.success
      ? competition_stages_result.data?.items || []
      : [],
    teams,
    team_map: new Map(teams.map((team: Team) => [team.id, team])),
    fixtures: fixtures_result.success ? fixtures_result.data?.items || [] : [],
  };
}
