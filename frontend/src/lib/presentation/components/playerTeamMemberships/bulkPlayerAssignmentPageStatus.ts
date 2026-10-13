export const BULK_PLAYER_ASSIGNMENT_PAGE_STATUS = {
  LOADING: "loading",
  FAILED: "failed",
  READY: "ready",
  SAVING: "saving",
} as const;

export type BulkPlayerAssignmentPageStatusState =
  | { status: typeof BULK_PLAYER_ASSIGNMENT_PAGE_STATUS.LOADING }
  | {
      status: typeof BULK_PLAYER_ASSIGNMENT_PAGE_STATUS.FAILED;
      message: string;
    }
  | { status: typeof BULK_PLAYER_ASSIGNMENT_PAGE_STATUS.READY }
  | { status: typeof BULK_PLAYER_ASSIGNMENT_PAGE_STATUS.SAVING };

export const BULK_PLAYER_ASSIGNMENT_INITIAL_STATE: BulkPlayerAssignmentPageStatusState =
  { status: BULK_PLAYER_ASSIGNMENT_PAGE_STATUS.LOADING };

export function apply_bulk_assignment_error_message(
  current_state: BulkPlayerAssignmentPageStatusState,
  message: string,
): BulkPlayerAssignmentPageStatusState {
  if (!message) return current_state;
  return { status: BULK_PLAYER_ASSIGNMENT_PAGE_STATUS.FAILED, message };
}

export function apply_bulk_assignment_loading_flag(
  current_state: BulkPlayerAssignmentPageStatusState,
  is_loading: boolean,
): BulkPlayerAssignmentPageStatusState {
  if (is_loading) return { status: BULK_PLAYER_ASSIGNMENT_PAGE_STATUS.LOADING };
  if (current_state.status !== BULK_PLAYER_ASSIGNMENT_PAGE_STATUS.LOADING) {
    return current_state;
  }
  return { status: BULK_PLAYER_ASSIGNMENT_PAGE_STATUS.READY };
}

export function apply_bulk_assignment_saving_flag(
  current_state: BulkPlayerAssignmentPageStatusState,
  is_saving: boolean,
): BulkPlayerAssignmentPageStatusState {
  if (is_saving) return { status: BULK_PLAYER_ASSIGNMENT_PAGE_STATUS.SAVING };
  if (current_state.status !== BULK_PLAYER_ASSIGNMENT_PAGE_STATUS.SAVING) {
    return current_state;
  }
  return { status: BULK_PLAYER_ASSIGNMENT_PAGE_STATUS.READY };
}
