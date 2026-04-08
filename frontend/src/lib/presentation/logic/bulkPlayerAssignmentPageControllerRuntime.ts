import type { Team } from "$lib/core/entities/Team";
import type { UserScopeProfile } from "$lib/core/interfaces/ports";
import { get_authorization_adapter } from "$lib/infrastructure/AuthorizationProvider";

import { ensure_auth_profile } from "./authGuard";
import {
  type BulkPlayerAssignmentPageDependencies,
  load_bulk_player_assignment_page_data,
  save_bulk_player_assignments,
} from "./bulkPlayerAssignmentPageData";
import type { PlayerAssignment } from "./bulkPlayerAssignmentPageState";

type ToastType = "success" | "error" | "info";

export function create_bulk_player_assignment_page_controller_runtime(command: {
  access_denied_message: string;
  access_denied_path: string;
  dependencies: BulkPlayerAssignmentPageDependencies;
  failed_summary: string;
  get_assigned_players_on_other_teams: () => PlayerAssignment[];
  get_auth_state: () => {
    current_profile: UserScopeProfile | null;
    current_token?: { raw_token: string } | null;
  };
  get_selected_team: () => Team | null;
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
}): {
  deselect_all: () => void;
  handle_save: () => Promise<void>;
  initialize_page: () => Promise<void>;
  select_all_unassigned: () => void;
  toggle_player_selection: (assignment: PlayerAssignment) => void;
} {
  return {
    initialize_page: async (): Promise<void> => {
      if (!command.is_browser) return;
      const auth_result = await ensure_auth_profile();
      if (!auth_result.success) {
        command.set_error_message(auth_result.error_message);
        command.set_is_loading(false);
        return;
      }
      const auth_state = command.get_auth_state();
      if (auth_state.current_token) {
        const authorization_check =
          await get_authorization_adapter().check_entity_authorized(
            auth_state.current_token.raw_token,
            "playerteammembership",
            "create",
          );
        if (!authorization_check.success) {
          command.set_is_loading(false);
          return;
        }
        if (!authorization_check.data.is_authorized) {
          command.set_access_denial(
            command.access_denied_path,
            command.access_denied_message,
          );
          await command.goto("/");
          return;
        }
      }
      const page_data = await load_bulk_player_assignment_page_data({
        current_profile: auth_state.current_profile,
        dependencies: command.dependencies,
      });
      command.set_teams(page_data.teams);
      command.set_all_player_assignments(page_data.all_player_assignments);
      command.set_gender_name_map(page_data.gender_name_map);
      command.set_error_message(page_data.error_message);
      command.set_is_loading(false);
    },
    toggle_player_selection: (assignment: PlayerAssignment): void => {
      assignment.selected = !assignment.selected;
      command.set_all_player_assignments([
        ...command.get_unassigned_players(),
        ...command.get_assigned_players_on_other_teams(),
      ]);
    },
    select_all_unassigned: (): void => {
      const next_assignments = [
        ...command
          .get_unassigned_players()
          .map((assignment: PlayerAssignment) => ({
            ...assignment,
            selected: true,
          })),
        ...command.get_assigned_players_on_other_teams(),
      ];
      command.set_all_player_assignments(next_assignments);
    },
    deselect_all: (): void => {
      const next_assignments = [
        ...command.get_unassigned_players(),
        ...command.get_assigned_players_on_other_teams(),
      ].map((assignment: PlayerAssignment) => ({
        ...assignment,
        selected: false,
      }));
      command.set_all_player_assignments(next_assignments);
    },
    handle_save: async (): Promise<void> => {
      if (!command.get_selected_team_id()) return;
      command.set_is_saving(true);
      const save_result = await save_bulk_player_assignments({
        assigned_players_on_other_teams:
          command.get_assigned_players_on_other_teams(),
        dependencies: command.dependencies,
        selected_team: command.get_selected_team(),
        selected_team_id: command.get_selected_team_id(),
        unassigned_players: command.get_unassigned_players(),
      });
      command.set_is_saving(false);
      if (save_result.error_count === 0) {
        command.show_toast(
          command.success_summary
            .replace("{success_count}", String(save_result.success_count))
            .replace("{team_name}", command.get_selected_team()?.name || ""),
          "success",
        );
        setTimeout(() => void command.goto("/player-team-memberships"), 1500);
        return;
      }
      command.show_toast(
        command.failed_summary
          .replace("{success_count}", String(save_result.success_count))
          .replace("{error_count}", String(save_result.error_count)),
        "error",
      );
    },
  };
}
