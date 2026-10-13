import type { UserScopeProfile } from "$lib/core/interfaces/ports";
import type { PlayerTeamMembershipUseCasesPort } from "$lib/core/interfaces/ports/internal/usecases/PlayerTeamMembershipUseCasesPort";
import {
  get_fixture_use_cases,
  get_official_associated_team_use_cases,
  get_official_use_cases,
  get_player_team_membership_use_cases,
  get_team_use_cases,
} from "$lib/infrastructure/registry/useCaseFactories";

import { get_use_cases_for_entity_type } from "../../infrastructure/registry/entityUseCasesRegistry";
import type { AuthProfileState } from "../stores/authTypes";
import type { DynamicEntityFormGenderDependencies } from "./dynamicEntityFormGenderWarnings";
import type { DynamicEntityFormConflictDependencies } from "./dynamicEntityFormOfficialConflictWarnings";
import type {
  DynamicEntityFormState,
  DynamicEntityFormUiState,
  DynamicEntityFormWarningState,
} from "./dynamicEntityFormState";
import { PRESENCE_STATUS } from "./presenceStatus";

type DynamicEntityFormAuthProfileState =
  | { status: typeof PRESENCE_STATUS.MISSING }
  | { status: typeof PRESENCE_STATUS.PRESENT; profile: UserScopeProfile };

type DynamicEntityFormExternalDependencies = {
  player_team_membership_use_cases: PlayerTeamMembershipUseCasesPort;
  conflict_dependencies: DynamicEntityFormConflictDependencies;
  gender_dependencies: DynamicEntityFormGenderDependencies;
};

export function create_initial_dynamic_entity_form_state(): DynamicEntityFormState {
  return {
    form_data: {},
    validation_errors: {},
    foreign_key_options: {},
    filtered_fields_loading: {},
    all_competition_teams_cache: [],
  };
}

export function create_initial_dynamic_entity_form_ui_state(): DynamicEntityFormUiState {
  return {
    is_loading: false,
    is_save_in_progress: false,
    auth_profile_missing: false,
    auth_error_message: "",
    permission_denied: false,
    permission_denied_message: "",
    save_error_message: "",
  };
}

export function create_initial_dynamic_entity_form_warning_state(): DynamicEntityFormWarningState {
  return {
    color_clash_warnings: [],
    official_team_conflict_warnings: [],
    gender_mismatch_warnings: [],
    fixture_team_gender_mismatch_warnings: [],
  };
}

export function build_dynamic_entity_form_auth_profile_state(
  current_profile: AuthProfileState,
): DynamicEntityFormAuthProfileState {
  return current_profile.status === PRESENCE_STATUS.PRESENT
    ? {
        status: PRESENCE_STATUS.PRESENT,
        profile: current_profile.profile as unknown as UserScopeProfile,
      }
    : { status: PRESENCE_STATUS.MISSING };
}

export function build_dynamic_entity_form_external_dependencies(): DynamicEntityFormExternalDependencies {
  const fixture_use_cases = get_fixture_use_cases();
  const team_use_cases = get_team_use_cases();
  const official_associated_team_use_cases =
    get_official_associated_team_use_cases();
  const player_use_cases_result = get_use_cases_for_entity_type("player");
  const gender_use_cases_result = get_use_cases_for_entity_type("gender");
  return {
    player_team_membership_use_cases: get_player_team_membership_use_cases(),
    conflict_dependencies: {
      fixture_use_cases,
      team_use_cases,
      official_use_cases: get_official_use_cases(),
      official_associated_team_use_cases,
    },
    gender_dependencies: {
      team_use_cases,
      player_use_cases_result,
      gender_use_cases_result,
    },
  };
}
