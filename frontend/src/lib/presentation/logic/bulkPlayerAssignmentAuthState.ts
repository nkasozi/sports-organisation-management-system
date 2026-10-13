import type { UserScopeProfile } from "$lib/core/interfaces/ports";
import { PRESENCE_STATUS } from "$lib/presentation/logic/presenceStatus";

import type { AuthState } from "../stores/authTypes";
import type { BulkPlayerAssignmentRawTokenState } from "./bulkPlayerAssignmentPageControllerActions";
import type { BulkPlayerAssignmentProfileState } from "./bulkPlayerAssignmentPageData";

type BulkPlayerAssignmentAuthSnapshot = {
  current_profile_state: BulkPlayerAssignmentProfileState;
  current_token_state: BulkPlayerAssignmentRawTokenState;
};

function build_bulk_player_assignment_profile_state(
  current_profile: AuthState["current_profile"],
): BulkPlayerAssignmentProfileState {
  if (current_profile.status !== PRESENCE_STATUS.PRESENT)
    return { status: "missing" };
  return {
    status: "present",
    profile: current_profile.profile as unknown as UserScopeProfile,
  };
}

function build_bulk_player_assignment_raw_token_state(
  current_token: AuthState["current_token"],
): BulkPlayerAssignmentRawTokenState {
  if (current_token.status !== PRESENCE_STATUS.PRESENT)
    return { status: "missing" };
  return { status: "present", raw_token: current_token.token.raw_token };
}

export function build_bulk_player_assignment_auth_snapshot(
  auth_state: Pick<AuthState, "current_profile" | "current_token">,
): BulkPlayerAssignmentAuthSnapshot {
  return {
    current_profile_state: build_bulk_player_assignment_profile_state(
      auth_state.current_profile,
    ),
    current_token_state: build_bulk_player_assignment_raw_token_state(
      auth_state.current_token,
    ),
  };
}
