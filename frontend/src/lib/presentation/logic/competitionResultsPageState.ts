import type { Competition } from "$lib/core/entities/Competition";
import type { CompetitionStage } from "$lib/core/entities/CompetitionStage";
import type { Fixture } from "$lib/core/entities/Fixture";
import type { Organization } from "$lib/core/entities/Organization";
import { WILDCARD_SCOPE } from "$lib/core/entities/StatusConstants";
import type { Team } from "$lib/core/entities/Team";
import { check_data_permission } from "$lib/core/interfaces/ports";
import type { CompetitionFormatUseCasesPort } from "$lib/core/interfaces/ports/internal/usecases/CompetitionFormatUseCasesPort";
import type { CompetitionStageUseCasesPort } from "$lib/core/interfaces/ports/internal/usecases/CompetitionStageUseCasesPort";
import type { CompetitionTeamUseCasesPort } from "$lib/core/interfaces/ports/internal/usecases/CompetitionTeamUseCasesPort";
import type { CompetitionUseCasesPort } from "$lib/core/interfaces/ports/internal/usecases/CompetitionUseCasesPort";
import type { FixtureUseCasesPort } from "$lib/core/interfaces/ports/internal/usecases/FixtureUseCasesPort";
import type { OrganizationUseCasesPort } from "$lib/core/interfaces/ports/internal/usecases/OrganizationUseCasesPort";
import type { SportUseCasesPort } from "$lib/core/interfaces/ports/internal/usecases/SportUseCasesPort";
import type { TeamUseCasesPort } from "$lib/core/interfaces/ports/internal/usecases/TeamUseCasesPort";
import {
  load_competitions_by_organization,
  load_selected_competition_bundle,
} from "$lib/presentation/logic/competitionResultsPageData";
import { PRESENCE_STATUS } from "$lib/presentation/logic/presenceStatus";

import type {
  CompetitionResultsCompetitionFormatState,
  CompetitionResultsOrganizationState,
  CompetitionResultsProfileState,
  CompetitionResultsSelectedCompetitionState,
} from "./competitionResultsPageContracts";
import {
  COMPETITION_RESULTS_BUNDLE_LOAD_STATUS,
  type CompetitionResultsBundleLoadState,
} from "./competitionResultsPageTypes";
import {
  build_match_report_sport_rules,
  type MatchReportSportRules,
} from "./matchReportSportRules";

export interface CompetitionResultsSelectedBundle {
  selected_competition_state: CompetitionResultsSelectedCompetitionState;
  competition_format_state: CompetitionResultsCompetitionFormatState;
  competition_stages: CompetitionStage[];
  fixtures: Fixture[];
  teams: Team[];
  team_map: Map<string, Team>;
  sport_rules: MatchReportSportRules;
  load_state: CompetitionResultsBundleLoadState;
}

export interface CompetitionResultsPageStateDependencies {
  organization_use_cases: OrganizationUseCasesPort;
  sport_use_cases: SportUseCasesPort;
  competition_use_cases: CompetitionUseCasesPort;
  format_use_cases: CompetitionFormatUseCasesPort;
  competition_stage_use_cases: CompetitionStageUseCasesPort;
  competition_team_use_cases: CompetitionTeamUseCasesPort;
  team_use_cases: TeamUseCasesPort;
  fixture_use_cases: FixtureUseCasesPort;
}

export function create_empty_competition_results_bundle(): CompetitionResultsSelectedBundle {
  return {
    selected_competition_state: { status: "missing" },
    competition_format_state: { status: "missing" },
    competition_stages: [],
    fixtures: [],
    teams: [],
    team_map: new Map<string, Team>(),
    sport_rules: build_match_report_sport_rules(void 0, void 0),
    load_state: { status: COMPETITION_RESULTS_BUNDLE_LOAD_STATUS.LOADED },
  };
}

export function derive_competition_results_can_change_organizations(
  profile_state: CompetitionResultsProfileState,
  url_organization_id: string,
): boolean {
  const organization_id =
    profile_state.status === PRESENCE_STATUS.PRESENT
      ? profile_state.profile.organization_id || ""
      : "";
  if (organization_id === WILDCARD_SCOPE) return true;
  const role =
    profile_state.status === PRESENCE_STATUS.PRESENT
      ? profile_state.profile.role || "player"
      : "player";
  return (
    !check_data_permission(role, "public_level", "create") &&
    url_organization_id.length === 0
  );
}

export async function load_competition_results_bundle(
  dependencies: CompetitionResultsPageStateDependencies,
  selected_competition_id: string,
): Promise<CompetitionResultsSelectedBundle> {
  return load_selected_competition_bundle(
    dependencies,
    selected_competition_id,
  );
}

export async function load_competitions_for_results_organization(
  dependencies: CompetitionResultsPageStateDependencies,
  organization_id: string,
): Promise<{
  competitions: Competition[];
  selected_competition_id: string;
  bundle: CompetitionResultsSelectedBundle;
}> {
  const competitions = await load_competitions_by_organization(
    dependencies.competition_use_cases,
    organization_id,
  );
  if (competitions.length === 0) {
    return {
      competitions,
      selected_competition_id: "",
      bundle: create_empty_competition_results_bundle(),
    };
  }

  const selected_competition_id = competitions[0].id;
  const bundle = await load_competition_results_bundle(
    dependencies,
    selected_competition_id,
  );

  return { competitions, selected_competition_id, bundle };
}

export function find_competition_results_organization(
  organizations: Organization[],
  organization_id: string,
): CompetitionResultsOrganizationState {
  const organization = organizations.find(
    (current_organization: Organization) =>
      current_organization.id === organization_id,
  );

  if (!organization) {
    return { status: "missing" };
  }

  return { status: "present", organization };
}

export function find_competition_results_competition(
  competitions: Competition[],
  competition_id: string,
): CompetitionResultsSelectedCompetitionState {
  const competition = competitions.find(
    (current_competition: Competition) =>
      current_competition.id === competition_id,
  );

  if (!competition) {
    return { status: "missing" };
  }

  return { status: "present", competition };
}

export function select_preferred_results_organization(
  organizations: Organization[],
  saved_organization_id: string,
): CompetitionResultsOrganizationState {
  const matching_organization = find_competition_results_organization(
    organizations,
    saved_organization_id,
  );
  if (
    saved_organization_id.length > 0 &&
    matching_organization.status === PRESENCE_STATUS.PRESENT
  ) {
    return matching_organization;
  }

  if (organizations.length === 0) {
    return { status: "missing" };
  }

  return { status: "present", organization: organizations[0] };
}
