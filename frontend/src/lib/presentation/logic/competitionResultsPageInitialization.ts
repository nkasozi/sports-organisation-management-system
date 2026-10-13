import type { Competition } from "$lib/core/entities/Competition";
import type { Organization } from "$lib/core/entities/Organization";
import { load_competition_results_organizations } from "$lib/presentation/logic/competitionResultsPageData";
import {
  type CompetitionResultsPageStateDependencies,
  type CompetitionResultsSelectedBundle,
  create_empty_competition_results_bundle,
  find_competition_results_competition,
  find_competition_results_organization,
  load_competition_results_bundle,
  load_competitions_for_results_organization,
  select_preferred_results_organization,
} from "$lib/presentation/logic/competitionResultsPageState";
import { PRESENCE_STATUS } from "$lib/presentation/logic/presenceStatus";

import type { CompetitionResultsProfileState } from "./competitionResultsPageContracts";

interface CompetitionResultsPageInitializationResult {
  is_using_cached_data: boolean;
  organizations: Organization[];
  selected_organization_id: string;
  competitions: Competition[];
  selected_competition_id: string;
  bundle: CompetitionResultsSelectedBundle;
}

interface CompetitionResultsPageInitializationCommand {
  current_profile_state: CompetitionResultsProfileState;
  competition_results_dependencies: CompetitionResultsPageStateDependencies;
  url_params: { org_id: string; competition_id: string };
  is_public: boolean;
  saved_organization_id: string;
  sync_public_organization: (organization: Organization) => Promise<void>;
  load_public_data: () => Promise<{ success: boolean }>;
}

type CompetitionResultsPageSelection = Omit<
  CompetitionResultsPageInitializationResult,
  "is_using_cached_data" | "organizations"
>;

function create_empty_competition_results_selection(): CompetitionResultsPageSelection {
  return {
    selected_organization_id: "",
    competitions: [],
    selected_competition_id: "",
    bundle: create_empty_competition_results_bundle(),
  };
}

async function load_competition_results_selection_for_organization(
  dependencies: CompetitionResultsPageStateDependencies,
  organization_id: string,
): Promise<CompetitionResultsPageSelection> {
  const organization_result = await load_competitions_for_results_organization(
    dependencies,
    organization_id,
  );
  return {
    selected_organization_id: organization_id,
    competitions: organization_result.competitions,
    selected_competition_id: organization_result.selected_competition_id,
    bundle: organization_result.bundle,
  };
}

async function apply_url_competition_to_selection(
  dependencies: CompetitionResultsPageStateDependencies,
  selection: CompetitionResultsPageSelection,
  competition_id: string,
): Promise<CompetitionResultsPageSelection> {
  if (competition_id.length === 0) return selection;
  const matching_competition = find_competition_results_competition(
    selection.competitions,
    competition_id,
  );
  if (matching_competition.status !== PRESENCE_STATUS.PRESENT) return selection;
  return {
    ...selection,
    selected_competition_id: matching_competition.competition.id,
    bundle: await load_competition_results_bundle(
      dependencies,
      matching_competition.competition.id,
    ),
  };
}

async function select_url_competition_results_organization(
  command: CompetitionResultsPageInitializationCommand,
  organizations: Organization[],
): Promise<CompetitionResultsPageSelection> {
  if (command.url_params.org_id.length === 0 || organizations.length === 0) {
    return create_empty_competition_results_selection();
  }
  const matching_organization = find_competition_results_organization(
    organizations,
    command.url_params.org_id,
  );
  if (matching_organization.status !== PRESENCE_STATUS.PRESENT) {
    return create_empty_competition_results_selection();
  }
  await command.sync_public_organization(matching_organization.organization);
  const selection = await load_competition_results_selection_for_organization(
    command.competition_results_dependencies,
    matching_organization.organization.id,
  );
  return apply_url_competition_to_selection(
    command.competition_results_dependencies,
    selection,
    command.url_params.competition_id,
  );
}

async function select_preferred_competition_results_organization(
  command: CompetitionResultsPageInitializationCommand,
  organizations: Organization[],
  current_selection: CompetitionResultsPageSelection,
): Promise<CompetitionResultsPageSelection> {
  if (
    current_selection.selected_organization_id.length > 0 ||
    organizations.length === 0
  ) {
    return current_selection;
  }
  const preferred_organization = select_preferred_results_organization(
    organizations,
    command.saved_organization_id,
  );
  if (preferred_organization.status !== PRESENCE_STATUS.PRESENT)
    return current_selection;
  return load_competition_results_selection_for_organization(
    command.competition_results_dependencies,
    preferred_organization.organization.id,
  );
}

export async function initialize_competition_results_page(
  command: CompetitionResultsPageInitializationCommand,
): Promise<CompetitionResultsPageInitializationResult> {
  const fetch_result = await command.load_public_data();
  const organizations = await load_competition_results_organizations(
    command.current_profile_state,
    command.competition_results_dependencies.organization_use_cases,
  );
  const url_selection = await select_url_competition_results_organization(
    command,
    organizations,
  );
  const selection = await select_preferred_competition_results_organization(
    command,
    organizations,
    url_selection,
  );

  return {
    is_using_cached_data: !fetch_result.success,
    organizations,
    ...selection,
  };
}
