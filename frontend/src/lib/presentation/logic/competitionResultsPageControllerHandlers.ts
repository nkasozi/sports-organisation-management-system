import { PRESENCE_STATUS } from "$lib/presentation/logic/presenceStatus";

import { ensure_auth_profile } from "./authGuard";
import type { CompetitionResultsPageControllerCommand } from "./competitionResultsPageControllerCommand";
import { competition_results_page_dependencies } from "./competitionResultsPageControllerDependencies";
import { extract_competition_results_url_params } from "./competitionResultsPageData";
import { initialize_competition_results_page } from "./competitionResultsPageInitialization";
import {
  type CompetitionResultsSelectedBundle,
  create_empty_competition_results_bundle,
  derive_competition_results_can_change_organizations,
  find_competition_results_organization,
  load_competition_results_bundle,
  load_competitions_for_results_organization,
} from "./competitionResultsPageState";
import { COMPETITION_RESULTS_BUNDLE_LOAD_STATUS } from "./competitionResultsPageTypes";
import {
  load_competition_results_public_data,
  refresh_competition_results_public_data,
} from "./competitionResultsPublicData";

const LOADING_STATE_ERROR = "error";

type CompetitionResultsUrlParams = ReturnType<
  typeof extract_competition_results_url_params
>;

type CompetitionResultsInitializedPage = Awaited<
  ReturnType<typeof initialize_competition_results_page>
>;

export function apply_competition_results_bundle_with_load_state(
  command: CompetitionResultsPageControllerCommand,
  bundle: CompetitionResultsSelectedBundle,
): boolean {
  command.apply_bundle(bundle);
  switch (bundle.load_state.status) {
    case COMPETITION_RESULTS_BUNDLE_LOAD_STATUS.LOADED:
      return true;
    case COMPETITION_RESULTS_BUNDLE_LOAD_STATUS.FAILED:
      command.set_error_message(bundle.load_state.error_message);
      command.set_loading_state(LOADING_STATE_ERROR);
      return false;
  }
}

export async function load_competition_results_controller_data(
  command: CompetitionResultsPageControllerCommand,
): Promise<void> {
  apply_competition_results_bundle_with_load_state(
    command,
    await load_competition_results_bundle(
      competition_results_page_dependencies,
      command.get_selected_competition_id(),
    ),
  );
}

async function sync_selected_public_organization(
  command: CompetitionResultsPageControllerCommand,
  selected_organization_id: string,
): Promise<void> {
  const selected_org = find_competition_results_organization(
    command.get_organizations(),
    selected_organization_id,
  );
  if (selected_org.status !== PRESENCE_STATUS.PRESENT) return;
  await command.sync_public_organization(selected_org.organization);
  await command.sync_branding_for_org(selected_org.organization);
}

export async function handle_competition_results_organization_change(
  command: CompetitionResultsPageControllerCommand,
): Promise<void> {
  const selected_organization_id = command.get_selected_organization_id();
  if (!selected_organization_id) return;
  const is_public = command.get_is_public();
  const url_params = extract_competition_results_url_params(
    command.get_page_url(),
  );
  if (is_public && url_params.org_id.length === 0) {
    await sync_selected_public_organization(command, selected_organization_id);
  }
  command.set_fixtures_loading(true);
  await refresh_competition_results_public_data(
    command,
    selected_organization_id,
  );
  const result = await load_competitions_for_results_organization(
    competition_results_page_dependencies,
    selected_organization_id,
  );
  command.set_competitions(result.competitions);
  command.set_selected_competition_id(result.selected_competition_id);
  command.set_fixtures_loading(false);
  apply_competition_results_bundle_with_load_state(command, result.bundle);
}

function apply_initialized_competition_results_page(
  command: CompetitionResultsPageControllerCommand,
  initialized_page: CompetitionResultsInitializedPage,
): void {
  command.set_is_using_cached_data(initialized_page.is_using_cached_data);
  command.set_organizations(initialized_page.organizations);
  command.set_selected_organization_id(
    initialized_page.selected_organization_id,
  );
  command.set_competitions(initialized_page.competitions);
  command.set_selected_competition_id(initialized_page.selected_competition_id);
  command.set_loading_state("success");
  apply_competition_results_bundle_with_load_state(
    command,
    initialized_page.bundle,
  );
}

function apply_competition_results_initialization_failure(
  command: CompetitionResultsPageControllerCommand,
  url_params: CompetitionResultsUrlParams,
  error: unknown,
): void {
  console.error("[CompetitionResultsPage] Failed to initialize page", {
    event: "competition_results_page_initialize_failed",
    organization_id: url_params.org_id || "unknown",
    competition_id: url_params.competition_id || "unknown",
    error: String(error),
  });
  command.set_error_message(
    error instanceof Error ? error.message : "Failed to load data",
  );
  command.set_loading_state("error");
  command.apply_bundle(create_empty_competition_results_bundle());
}

async function load_initialized_competition_results_page(
  command: CompetitionResultsPageControllerCommand,
  url_params: CompetitionResultsUrlParams,
  is_public: boolean,
): Promise<void> {
  try {
    const initialized_page = await initialize_competition_results_page({
      current_profile_state: command.get_auth_state().current_profile_state,
      competition_results_dependencies: competition_results_page_dependencies,
      url_params,
      is_public,
      saved_organization_id: command.get_saved_organization_id(),
      sync_public_organization: command.sync_public_organization,
      load_public_data: () =>
        load_competition_results_public_data(
          url_params.org_id || command.get_saved_organization_id(),
        ),
    });
    apply_initialized_competition_results_page(command, initialized_page);
  } catch (error) {
    apply_competition_results_initialization_failure(
      command,
      url_params,
      error,
    );
  }
}

export async function initialize_competition_results_controller_page(
  command: CompetitionResultsPageControllerCommand,
): Promise<void> {
  if (!command.is_browser) return;
  const url_params = extract_competition_results_url_params(
    command.get_page_url(),
  );
  const auth_result = await ensure_auth_profile();
  const is_public = command.get_is_public();
  if (!auth_result.success && !is_public) {
    command.set_error_message(auth_result.error_message);
    command.set_loading_state("error");
    return;
  }
  command.set_can_change_organizations(
    derive_competition_results_can_change_organizations(
      command.get_auth_state().current_profile_state,
      url_params.org_id,
    ),
  );
  command.set_loading_state("loading");
  await load_initialized_competition_results_page(
    command,
    url_params,
    is_public,
  );
}
