import { PlayerTeamMembershipUseCaseMessage } from "$lib/core/usecases/PlayerTeamMembershipUseCasesConstants";

import type { PlayerAssignment } from "./bulkPlayerAssignmentPageState";

const UNASSIGNED_TEAM_STATUS = "unassigned";

export const BULK_PLAYER_ASSIGNMENT_BLOCKED_GUIDANCE =
  PlayerTeamMembershipUseCaseMessage.ALREADY_ACTIVE_ELSEWHERE;

export function is_player_assignment_selectable(
  assignment: PlayerAssignment,
): boolean {
  return assignment.current_team_state.status === UNASSIGNED_TEAM_STATUS;
}
