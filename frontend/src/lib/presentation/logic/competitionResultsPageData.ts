import type { Competition } from "$lib/core/entities/Competition";
import type {
  PointsConfig,
  TieBreaker,
} from "$lib/core/entities/CompetitionFormat";
import { DEFAULT_POINTS_CONFIG } from "$lib/core/entities/CompetitionFormat";
import type { Organization } from "$lib/core/entities/Organization";
import { ANY_VALUE } from "$lib/core/interfaces/ports";
import { PRESENCE_STATUS } from "$lib/presentation/logic/presenceStatus";

import type { CompetitionResultsProfileState } from "./competitionResultsPageContracts";
import type {
  CompetitionResultsCompetitionFormatState,
  CompetitionResultsSelectedCompetitionState,
} from "./competitionResultsPageContracts";
import type { CompetitionResultsDependencies } from "./competitionResultsPageTypes";

export { load_selected_competition_bundle } from "./competitionResultsCompetitionBundle";

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
    competition_format_state.status === PRESENCE_STATUS.PRESENT
      ? (competition_format_state.competition_format.points_config ??
        DEFAULT_POINTS_CONFIG)
      : DEFAULT_POINTS_CONFIG;
  if (selected_competition_state.status === PRESENCE_STATUS.MISSING) {
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
    selected_competition_state.status === PRESENCE_STATUS.PRESENT &&
    selected_competition_state.competition.rule_overrides?.tie_breakers_override
  ) {
    return selected_competition_state.competition.rule_overrides
      .tie_breakers_override;
  }

  if (competition_format_state.status === PRESENCE_STATUS.PRESENT) {
    return (
      competition_format_state.competition_format.tie_breakers ?? [
        "goal_difference",
        "goals_scored",
      ]
    );
  }

  return ["goal_difference", "goals_scored"];
}

export async function load_competition_results_organizations(
  current_profile_state: CompetitionResultsProfileState,
  organization_use_cases: CompetitionResultsDependencies["organization_use_cases"],
): Promise<Organization[]> {
  const result = await organization_use_cases.list({});
  if (!result.success) return [];
  const all_organizations = result.data?.items || [];
  const organization_scope =
    current_profile_state.status === PRESENCE_STATUS.PRESENT
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
