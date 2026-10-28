import { type Mock, vi } from "vitest";

import type {
  CompetitionEditSelectedFormatState,
  CompetitionEditSelectedSportState,
} from "./competitionEditPageContracts";

function create_competition_edit_state(): {
  available_teams: { id: string; name: string }[];
  form_data: {
    competition_format_id: string;
    organization_id: string;
    allow_auto_squad_submission: boolean;
    lineup_submission_deadline_hours: number;
    max_event_edits_per_game: number;
  };
  selected_format_state: CompetitionEditSelectedFormatState;
  teams_in_competition: { id: string; name: string }[];
  competition_team_entries: { id: string; team_id: string }[];
} {
  return {
    available_teams: [{ id: "team-2", name: "Falcons" }],
    form_data: {
      competition_format_id: "format-1",
      organization_id: "organization-1",
      allow_auto_squad_submission: true,
      lineup_submission_deadline_hours: 24,
      max_event_edits_per_game: 3,
    },
    selected_format_state: {
      status: "present",
      competition_format: {
        id: "format-1",
        tie_breakers: ["goal_difference", "goals_scored"],
      },
    } as CompetitionEditSelectedFormatState,
    teams_in_competition: [{ id: "team-1", name: "Lions" }],
    competition_team_entries: [{ id: "entry-1", team_id: "team-1" }],
  };
}

type CompetitionEditTestState = ReturnType<
  typeof create_competition_edit_state
>;

function create_competition_edit_setters(state: CompetitionEditTestState): {
  set_available_teams: Mock;
  set_competition_team_entries: Mock;
  set_form_data: Mock;
  set_is_customizing_scoring: Mock;
  set_is_saving: Mock;
  set_selected_format_state: Mock;
  set_selected_sport_state: Mock;
  set_teams_in_competition: Mock;
} {
  return {
    set_available_teams: vi.fn((value: unknown[]) => {
      state.available_teams = value as never;
    }),
    set_competition_team_entries: vi.fn((value: unknown[]) => {
      state.competition_team_entries = value as never;
    }),
    set_form_data: vi.fn((value: unknown) => {
      state.form_data = value as never;
    }),
    set_is_customizing_scoring: vi.fn(),
    set_is_saving: vi.fn(),
    set_selected_format_state: vi.fn(
      (value: CompetitionEditSelectedFormatState) => {
        state.selected_format_state = value;
      },
    ),
    set_selected_sport_state: vi.fn(
      (_value: CompetitionEditSelectedSportState) => {},
    ),
    set_teams_in_competition: vi.fn((value: unknown[]) => {
      state.teams_in_competition = value as never;
    }),
  };
}

type CompetitionEditTestCommand = ReturnType<
  typeof create_competition_edit_setters
> & {
  get_can_edit_competition: () => boolean;
  get_competition_formats: () => never;
  get_competition_id: () => string;
  get_competition_team_entries: () => never;
  get_available_teams: () => never;
  get_form_data: () => never;
  get_selected_format_state: () => CompetitionEditSelectedFormatState;
  get_teams_in_competition: () => never;
  goto: Mock;
  get_organizations: () => never;
  show_toast: Mock;
};

export function create_competition_edit_command(): {
  command: CompetitionEditTestCommand;
  state: CompetitionEditTestState;
} {
  const state = create_competition_edit_state();

  const command = {
    get_can_edit_competition: () => true,
    get_competition_formats: () =>
      [
        { id: "format-1", tie_breakers: ["goal_difference", "goals_scored"] },
        { id: "format-2", tie_breakers: ["head_to_head"] },
      ] as never,
    get_competition_id: () => "competition-1",
    get_competition_team_entries: () => state.competition_team_entries as never,
    get_available_teams: () => state.available_teams as never,
    get_form_data: () => state.form_data as never,
    get_selected_format_state: () => state.selected_format_state,
    get_teams_in_competition: () => state.teams_in_competition as never,
    goto: vi.fn(async () => {}),
    get_organizations: () =>
      [{ id: "organization-1", sport_id: "sport-1" }] as never,
    ...create_competition_edit_setters(state),
    show_toast: vi.fn(),
  };

  return { command, state };
}
