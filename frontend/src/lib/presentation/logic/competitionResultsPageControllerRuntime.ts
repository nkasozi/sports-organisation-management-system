import type { Competition } from "$lib/core/entities/Competition";
import type { Organization } from "$lib/core/entities/Organization";
import type { UserRole, UserScopeProfile } from "$lib/core/interfaces/ports";
import { fetch_public_data_from_convex } from "$lib/infrastructure/sync/convexPublicDataService";

import { ensure_auth_profile } from "./authGuard";
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

export function create_competition_results_page_controller_runtime(command: {
  apply_bundle: (bundle: CompetitionResultsSelectedBundle) => void;
  get_auth_state: () => {
    current_profile: (UserScopeProfile & { role?: UserRole }) | null;
  };
  get_is_public: () => boolean;
  get_organizations: () => Organization[];
  get_page_url: () => URL;
  get_saved_organization_id: () => string;
  get_selected_competition_id: () => string;
  get_selected_organization_id: () => string;
  is_browser: boolean;
  set_can_change_organizations: (value: boolean) => void;
  set_competitions: (value: Competition[]) => void;
  set_error_message: (value: string) => void;
  set_fixtures_loading: (value: boolean) => void;
  set_is_using_cached_data: (value: boolean) => void;
  set_loading_state: (value: "loading" | "success" | "error") => void;
  set_organizations: (value: Organization[]) => void;
  set_selected_competition_id: (value: string) => void;
  set_selected_organization_id: (value: string) => void;
  sync_branding_for_org: (organization: Organization) => Promise<void>;
  sync_public_organization: (organization: Organization) => Promise<void>;
}): {
  handle_organization_change: () => Promise<void>;
  initialize_page: () => Promise<void>;
  load_competition_data: () => Promise<void>;
} {
  return {
    load_competition_data: async (): Promise<void> => {
      command.apply_bundle(
        await load_competition_results_bundle(
          competition_results_page_dependencies,
          command.get_selected_competition_id(),
        ),
      );
    },
    handle_organization_change: async (): Promise<void> => {
      const selected_organization_id = command.get_selected_organization_id();
      if (!selected_organization_id) return;
      const is_public = command.get_is_public();
      const url_params = extract_competition_results_url_params(
        command.get_page_url(),
      );
      if (is_public && url_params.org_id.length === 0) {
        const selected_org = find_competition_results_organization(
          command.get_organizations(),
          selected_organization_id,
        );
        if (selected_org) {
          await command.sync_public_organization(selected_org);
          await command.sync_branding_for_org(selected_org);
        }
      }
      command.set_fixtures_loading(true);
      const result = await load_competitions_for_results_organization(
        competition_results_page_dependencies,
        selected_organization_id,
      );
      command.set_competitions(result.competitions);
      command.set_selected_competition_id(result.selected_competition_id);
      command.apply_bundle(result.bundle);
      command.set_fixtures_loading(false);
    },
    initialize_page: async (): Promise<void> => {
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
          command.get_auth_state().current_profile,
          url_params.org_id,
        ),
      );
      command.set_loading_state("loading");
      try {
        const initialized_page = await initialize_competition_results_page({
          current_profile: command.get_auth_state().current_profile,
          competition_results_dependencies:
            competition_results_page_dependencies,
          url_params,
          is_public,
          saved_organization_id: command.get_saved_organization_id(),
          sync_public_organization: command.sync_public_organization,
          load_public_data: () =>
            fetch_public_data_from_convex("competition_results"),
        });
        command.set_is_using_cached_data(initialized_page.is_using_cached_data);
        command.set_organizations(initialized_page.organizations);
        command.set_selected_organization_id(
          initialized_page.selected_organization_id,
        );
        command.set_competitions(initialized_page.competitions);
        command.set_selected_competition_id(
          initialized_page.selected_competition_id,
        );
        command.apply_bundle(initialized_page.bundle);
        command.set_loading_state("success");
      } catch (error) {
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
    },
  };
}
