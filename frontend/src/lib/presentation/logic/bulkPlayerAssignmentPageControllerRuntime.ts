import {
  type BulkPlayerAssignmentPageControllerCommand,
  initialize_bulk_player_assignment_page,
  save_bulk_player_assignment_page,
} from "./bulkPlayerAssignmentPageControllerActions";
import type { PlayerAssignment } from "./bulkPlayerAssignmentPageState";
import { is_player_assignment_selectable } from "./bulkPlayerAssignmentSelectability";

const BULK_ASSIGNMENT_SELECTION_BLOCKED_MESSAGE =
  "[BulkPlayerAssignment] Player already active on a team";
const BULK_ASSIGNMENT_SELECTION_BLOCKED_EVENT =
  "bulk_player_assignment_selection_blocked";

type BulkPlayerAssignmentPageControllerRuntime = {
  deselect_all: () => void;
  handle_save: () => Promise<void>;
  initialize_page: () => Promise<void>;
  select_all_unassigned: () => void;
  toggle_player_selection: (assignment: PlayerAssignment) => void;
};

function list_all_page_assignments(
  command: BulkPlayerAssignmentPageControllerCommand,
): PlayerAssignment[] {
  return [
    ...command.get_unassigned_players(),
    ...command.get_assigned_players_on_other_teams(),
  ];
}

function with_selection(
  assignment: PlayerAssignment,
  selected: boolean,
): PlayerAssignment {
  return { ...assignment, selected };
}

export function create_bulk_player_assignment_page_controller_runtime(
  command: BulkPlayerAssignmentPageControllerCommand,
): BulkPlayerAssignmentPageControllerRuntime {
  return {
    initialize_page: (): Promise<void> =>
      initialize_bulk_player_assignment_page(command),
    toggle_player_selection: (assignment: PlayerAssignment): void => {
      if (!is_player_assignment_selectable(assignment)) {
        console.warn(BULK_ASSIGNMENT_SELECTION_BLOCKED_MESSAGE, {
          event: BULK_ASSIGNMENT_SELECTION_BLOCKED_EVENT,
          player_id: assignment.player?.id,
        });
        return;
      }
      assignment.selected = !assignment.selected;
      command.set_all_player_assignments(list_all_page_assignments(command));
    },
    select_all_unassigned: (): void =>
      command.set_all_player_assignments([
        ...command
          .get_unassigned_players()
          .map((assignment: PlayerAssignment) =>
            with_selection(assignment, true),
          ),
        ...command.get_assigned_players_on_other_teams(),
      ]),
    deselect_all: (): void =>
      command.set_all_player_assignments(
        list_all_page_assignments(command).map((assignment: PlayerAssignment) =>
          with_selection(assignment, false),
        ),
      ),
    handle_save: (): Promise<void> => save_bulk_player_assignment_page(command),
  };
}
