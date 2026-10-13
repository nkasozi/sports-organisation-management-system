import type { Competition } from "$lib/core/entities/Competition";
import type { Organization } from "$lib/core/entities/Organization";

import type { CompetitionResultsProfileState } from "./competitionResultsPageContracts";
import type { CompetitionResultsSelectedBundle } from "./competitionResultsPageState";

export interface CompetitionResultsPageControllerCommand {
  apply_bundle: (bundle: CompetitionResultsSelectedBundle) => void;
  get_auth_state: () => {
    current_profile_state: CompetitionResultsProfileState;
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
}

export interface CompetitionResultsPageControllerRuntime {
  handle_organization_change: () => Promise<void>;
  initialize_page: () => Promise<void>;
  load_competition_data: () => Promise<void>;
}
