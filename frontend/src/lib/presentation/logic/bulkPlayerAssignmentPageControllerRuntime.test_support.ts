import { type Mock, vi } from "vitest";

type TestAssignment = {
  id: string;
  selected: boolean;
  current_team_state:
    | { status: "unassigned" }
    | { status: "assigned"; team_id: string; team_name: string };
};

function create_bulk_assignment_state(): {
  all_player_assignments: { id: string; selected: boolean }[];
  error_message: string;
  is_loading: boolean;
  is_saving: boolean;
  selected_team: { id: string; name: string };
  selected_team_id: string;
  unassigned_players: TestAssignment[];
  assigned_players_on_other_teams: TestAssignment[];
} {
  return {
    all_player_assignments: [
      { id: "assignment-1", selected: false },
      { id: "assignment-2", selected: false },
    ],
    error_message: "",
    is_loading: true,
    is_saving: false,
    selected_team: { id: "team-1", name: "Lions" },
    selected_team_id: "team-1",
    unassigned_players: [
      {
        id: "assignment-1",
        selected: false,
        current_team_state: { status: "unassigned" },
      },
    ],
    assigned_players_on_other_teams: [
      {
        id: "assignment-2",
        selected: false,
        current_team_state: {
          status: "assigned",
          team_id: "team-2",
          team_name: "Tigers",
        },
      },
    ],
  };
}

type BulkAssignmentState = ReturnType<typeof create_bulk_assignment_state>;

function create_bulk_assignment_getters(state: BulkAssignmentState): {
  get_assigned_players_on_other_teams: () => never;
  get_auth_state: () => {
    current_profile_state: { status: string };
    current_token_state: { status: string; raw_token: string };
  };
  get_selected_team_state: () => { status: string; team: never };
  get_selected_team_id: () => string;
  get_unassigned_players: () => never;
} {
  return {
    get_assigned_players_on_other_teams: () =>
      state.assigned_players_on_other_teams as never,
    get_auth_state: () => ({
      current_profile_state: { status: "missing" },
      current_token_state: {
        status: "present",
        raw_token: "token-1",
      },
    }),
    get_selected_team_state: () => ({
      status: "present",
      team: state.selected_team as never,
    }),
    get_selected_team_id: () => state.selected_team_id,
    get_unassigned_players: () => state.unassigned_players as never,
  };
}

function create_bulk_assignment_setters(state: BulkAssignmentState): {
  set_access_denial: Mock;
  set_all_player_assignments: Mock;
  set_error_message: Mock;
  set_gender_name_map: Mock;
  set_is_loading: Mock;
  set_is_saving: Mock;
  set_teams: Mock;
} {
  return {
    set_access_denial: vi.fn(),
    set_all_player_assignments: vi.fn(
      (value: typeof state.all_player_assignments) => {
        state.all_player_assignments = value;
      },
    ),
    set_error_message: vi.fn((value: string) => {
      state.error_message = value;
    }),
    set_gender_name_map: vi.fn(),
    set_is_loading: vi.fn((value: boolean) => {
      state.is_loading = value;
    }),
    set_is_saving: vi.fn((value: boolean) => {
      state.is_saving = value;
    }),
    set_teams: vi.fn(),
  };
}

type BulkAssignmentTestCommand = ReturnType<
  typeof create_bulk_assignment_getters
> &
  ReturnType<typeof create_bulk_assignment_setters> & {
    access_denied_message: string;
    access_denied_path: string;
    dependencies: never;
    failed_summary: string;
    goto: Mock;
    is_browser: boolean;
    show_toast: Mock;
    success_summary: string;
  };

export function create_bulk_assignment_command(): {
  command: BulkAssignmentTestCommand;
  state: BulkAssignmentState;
} {
  const state = create_bulk_assignment_state();

  const command = {
    access_denied_message: "Access denied",
    access_denied_path: "/bulk-player-assignment",
    dependencies: {} as never,
    failed_summary:
      "Assigned {success_count} players with {error_count} failures",
    ...create_bulk_assignment_getters(state),
    goto: vi.fn(async () => {}),
    is_browser: true,
    ...create_bulk_assignment_setters(state),
    show_toast: vi.fn(),
    success_summary: "Assigned {success_count} players to {team_name}",
  };

  return { command, state };
}
