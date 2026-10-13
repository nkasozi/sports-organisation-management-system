import type { Team } from "$lib/core/entities/Team";
import { get_authorization_adapter } from "$lib/infrastructure/AuthorizationProvider";
import { PRESENCE_STATUS } from "$lib/presentation/logic/presenceStatus";

import { ensure_auth_profile } from "./authGuard";
import {
  BULK_PLAYER_ASSIGNMENT_AUTHORIZATION,
  BULK_PLAYER_ASSIGNMENT_EVENTS,
  BULK_PLAYER_ASSIGNMENT_MESSAGES,
  BULK_PLAYER_ASSIGNMENT_REDIRECT_DELAY_MS,
  BULK_PLAYER_ASSIGNMENT_ROUTES,
  BULK_PLAYER_ASSIGNMENT_SUMMARY_PLACEHOLDERS,
  BULK_PLAYER_ASSIGNMENT_TOAST_TYPE,
  type BulkPlayerAssignmentToastType,
} from "./bulkPlayerAssignmentConstants";
import {
  type BulkPlayerAssignmentPageDependencies,
  type BulkPlayerAssignmentProfileState,
  load_bulk_player_assignment_page_data,
  save_bulk_player_assignments,
} from "./bulkPlayerAssignmentPageData";
import type {
  BulkPlayerAssignmentSelectedTeamState,
  PlayerAssignment,
} from "./bulkPlayerAssignmentPageState";

type ToastType = BulkPlayerAssignmentToastType;

export type BulkPlayerAssignmentRawTokenState =
  | { status: typeof PRESENCE_STATUS.MISSING }
  | { status: typeof PRESENCE_STATUS.PRESENT; raw_token: string };

type BulkPlayerAssignmentAuthState = {
  current_profile_state: BulkPlayerAssignmentProfileState;
  current_token_state: BulkPlayerAssignmentRawTokenState;
};

export type BulkPlayerAssignmentPageControllerCommand = {
  access_denied_message: string;
  access_denied_path: string;
  dependencies: BulkPlayerAssignmentPageDependencies;
  failed_summary: string;
  get_assigned_players_on_other_teams: () => PlayerAssignment[];
  get_auth_state: () => BulkPlayerAssignmentAuthState;
  get_selected_team_state: () => BulkPlayerAssignmentSelectedTeamState;
  get_selected_team_id: () => string;
  get_unassigned_players: () => PlayerAssignment[];
  goto: (path: string) => Promise<unknown>;
  is_browser: boolean;
  set_access_denial: (path: string, message: string) => void;
  set_all_player_assignments: (value: PlayerAssignment[]) => void;
  set_error_message: (value: string) => void;
  set_gender_name_map: (value: Map<string, string>) => void;
  set_is_loading: (value: boolean) => void;
  set_is_saving: (value: boolean) => void;
  set_teams: (value: Team[]) => void;
  show_toast: (message: string, type: ToastType) => void;
  success_summary: string;
};

enum CreateAccessStatus {
  ALLOWED = "allowed",
  CHECK_FAILED = "check_failed",
  DENIED = "denied",
}

async function check_membership_create_access(
  token_state: BulkPlayerAssignmentRawTokenState,
): Promise<CreateAccessStatus> {
  if (token_state.status !== PRESENCE_STATUS.PRESENT)
    return CreateAccessStatus.ALLOWED;
  const authorization_check =
    await get_authorization_adapter().check_entity_authorized(
      token_state.raw_token,
      BULK_PLAYER_ASSIGNMENT_AUTHORIZATION.ENTITY_TYPE,
      BULK_PLAYER_ASSIGNMENT_AUTHORIZATION.ACTION,
    );
  if (!authorization_check.success) {
    console.error("[BulkPlayerAssignment] Access check failed", {
      event: BULK_PLAYER_ASSIGNMENT_EVENTS.ACCESS_CHECK_FAILED,
      error: authorization_check.error,
    });
    return CreateAccessStatus.CHECK_FAILED;
  }
  return authorization_check.data.is_authorized
    ? CreateAccessStatus.ALLOWED
    : CreateAccessStatus.DENIED;
}

async function load_and_apply_page_data(
  command: BulkPlayerAssignmentPageControllerCommand,
  profile_state: BulkPlayerAssignmentProfileState,
): Promise<void> {
  const page_data = await load_bulk_player_assignment_page_data({
    profile_state,
    dependencies: command.dependencies,
  });
  command.set_teams(page_data.teams);
  command.set_all_player_assignments(page_data.all_player_assignments);
  command.set_gender_name_map(page_data.gender_name_map);
  command.set_error_message(page_data.error_message);
  command.set_is_loading(false);
}

export async function initialize_bulk_player_assignment_page(
  command: BulkPlayerAssignmentPageControllerCommand,
): Promise<void> {
  if (!command.is_browser) return;
  const auth_result = await ensure_auth_profile();
  if (!auth_result.success) {
    command.set_error_message(auth_result.error_message);
    command.set_is_loading(false);
    return;
  }
  const auth_state = command.get_auth_state();
  const access_status = await check_membership_create_access(
    auth_state.current_token_state,
  );
  switch (access_status) {
    case CreateAccessStatus.CHECK_FAILED:
      command.set_error_message(
        BULK_PLAYER_ASSIGNMENT_MESSAGES.ACCESS_CHECK_FAILED,
      );
      command.set_is_loading(false);
      return;
    case CreateAccessStatus.DENIED:
      command.set_access_denial(
        command.access_denied_path,
        command.access_denied_message,
      );
      await command.goto(BULK_PLAYER_ASSIGNMENT_ROUTES.HOME);
      return;
    case CreateAccessStatus.ALLOWED:
      await load_and_apply_page_data(command, auth_state.current_profile_state);
      return;
  }
}

function show_successful_save_toast(
  command: BulkPlayerAssignmentPageControllerCommand,
  success_count: number,
): void {
  const selected_team_state = command.get_selected_team_state();
  command.show_toast(
    command.success_summary
      .replace(
        BULK_PLAYER_ASSIGNMENT_SUMMARY_PLACEHOLDERS.SUCCESS_COUNT,
        String(success_count),
      )
      .replace(
        BULK_PLAYER_ASSIGNMENT_SUMMARY_PLACEHOLDERS.TEAM_NAME,
        selected_team_state.status === PRESENCE_STATUS.PRESENT
          ? selected_team_state.team.name
          : "",
      ),
    BULK_PLAYER_ASSIGNMENT_TOAST_TYPE.SUCCESS,
  );
  setTimeout(
    () => void command.goto(BULK_PLAYER_ASSIGNMENT_ROUTES.MEMBERSHIPS),
    BULK_PLAYER_ASSIGNMENT_REDIRECT_DELAY_MS,
  );
}

export async function save_bulk_player_assignment_page(
  command: BulkPlayerAssignmentPageControllerCommand,
): Promise<void> {
  if (!command.get_selected_team_id()) return;
  command.set_is_saving(true);
  const save_result = await save_bulk_player_assignments({
    assigned_players_on_other_teams:
      command.get_assigned_players_on_other_teams(),
    dependencies: command.dependencies,
    selected_team_state: command.get_selected_team_state(),
    selected_team_id: command.get_selected_team_id(),
    unassigned_players: command.get_unassigned_players(),
  });
  command.set_is_saving(false);
  if (save_result.error_count === 0) {
    show_successful_save_toast(command, save_result.success_count);
    return;
  }
  command.show_toast(
    command.failed_summary
      .replace(
        BULK_PLAYER_ASSIGNMENT_SUMMARY_PLACEHOLDERS.SUCCESS_COUNT,
        String(save_result.success_count),
      )
      .replace(
        BULK_PLAYER_ASSIGNMENT_SUMMARY_PLACEHOLDERS.ERROR_COUNT,
        String(save_result.error_count),
      ),
    BULK_PLAYER_ASSIGNMENT_TOAST_TYPE.ERROR,
  );
}
