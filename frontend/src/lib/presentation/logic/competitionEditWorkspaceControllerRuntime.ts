import type { UpdateCompetitionInput } from "$lib/core/entities/Competition";
import type {
  CompetitionFormat,
  TieBreaker,
} from "$lib/core/entities/CompetitionFormat";
import type { CompetitionTeam } from "$lib/core/entities/CompetitionTeam";
import type { Organization } from "$lib/core/entities/Organization";
import type { Team } from "$lib/core/entities/Team";
import type {
  CompetitionEditSelectedFormatState,
  CompetitionEditSelectedSportState,
} from "$lib/presentation/logic/competitionEditPageContracts";
import { load_competition_edit_sport } from "$lib/presentation/logic/competitionEditPageData";
import {
  reset_competition_scoring_overrides,
  toggle_competition_tie_breaker,
  update_competition_points_override,
} from "$lib/presentation/logic/competitionEditPageState";
import {
  add_team_to_competition_workspace,
  remove_team_from_competition_workspace,
  submit_competition_edit_workspace,
} from "$lib/presentation/logic/competitionEditWorkspaceActions";
import { competition_edit_workspace_dependencies } from "$lib/presentation/logic/competitionEditWorkspaceControllerDependencies";

export function create_competition_edit_workspace_controller_runtime(command: {
  can_edit_competition: boolean;
  competition_id: string;
  competition_formats: CompetitionFormat[];
  competition_team_entries: CompetitionTeam[];
  get_available_teams: () => Team[];
  get_form_data: () => UpdateCompetitionInput;
  get_selected_format_state: () => CompetitionEditSelectedFormatState;
  get_teams_in_competition: () => Team[];
  goto: (path: string) => Promise<unknown>;
  organizations: Organization[];
  set_available_teams: (value: Team[]) => void;
  set_competition_team_entries: (value: CompetitionTeam[]) => void;
  set_form_data: (value: UpdateCompetitionInput) => void;
  set_is_customizing_scoring: (value: boolean) => void;
  set_is_saving: (value: boolean) => void;
  set_selected_format_state: (
    value: CompetitionEditSelectedFormatState,
  ) => void;
  set_selected_sport_state: (value: CompetitionEditSelectedSportState) => void;
  set_teams_in_competition: (value: Team[]) => void;
  show_toast: (message: string, type: "success" | "error" | "info") => void;
}): {
  handle_add_team_to_competition: (team: Team) => Promise<void>;
  handle_format_change: (event: CustomEvent<{ value: string }>) => void;
  handle_organization_change: (
    event: CustomEvent<{ value: string }>,
  ) => Promise<void>;
  handle_remove_team_from_competition: (team: Team) => Promise<void>;
  handle_reset_scoring: () => void;
  handle_submit: () => Promise<void>;
  handle_toggle_auto_squad_submission: (enabled: boolean) => void;
  handle_toggle_tie_breaker: (
    tie_breaker: TieBreaker,
    enabled: boolean,
  ) => void;
  handle_update_points: (
    field: "points_for_win" | "points_for_draw" | "points_for_loss",
    raw_value: string,
  ) => void;
} {
  return {
    handle_add_team_to_competition: async (team: Team): Promise<void> => {
      if (!command.can_edit_competition) {
        return;
      }
      const result = await add_team_to_competition_workspace({
        competition_id: command.competition_id,
        team,
        collections: {
          available_teams: command.get_available_teams(),
          competition_team_entries: command.competition_team_entries,
          teams_in_competition: command.get_teams_in_competition(),
        },
        competition_team_use_cases:
          competition_edit_workspace_dependencies.competition_team_use_cases,
      });
      if (!result.success) {
        command.show_toast(`Failed to add team: ${result.error}`, "error");
        return;
      }
      command.set_competition_team_entries(
        result.data.competition_team_entries,
      );
      command.set_teams_in_competition(result.data.teams_in_competition);
      command.set_available_teams(result.data.available_teams);
      command.show_toast(`${team.name} added to competition`, "success");
    },
    handle_format_change: (event: CustomEvent<{ value: string }>): void => {
      command.set_form_data({
        ...command.get_form_data(),
        competition_format_id: event.detail.value,
      });
      const selected_format = command.competition_formats.find(
        (competition_format: CompetitionFormat) =>
          competition_format.id === event.detail.value,
      );

      command.set_selected_format_state(
        selected_format
          ? { status: "present", competition_format: selected_format }
          : { status: "missing" },
      );
    },
    handle_organization_change: async (
      event: CustomEvent<{ value: string }>,
    ): Promise<void> => {
      command.set_form_data({
        ...command.get_form_data(),
        organization_id: event.detail.value,
        rule_overrides: {},
      });
      const selected_sport_result = await load_competition_edit_sport(
        command.organizations,
        event.detail.value,
      );

      command.set_selected_sport_state(
        selected_sport_result.success
          ? { status: "present", sport: selected_sport_result.data }
          : { status: "missing" },
      );
    },
    handle_remove_team_from_competition: async (team: Team): Promise<void> => {
      if (!command.can_edit_competition) {
        return;
      }
      const result = await remove_team_from_competition_workspace({
        competition_id: command.competition_id,
        team,
        collections: {
          available_teams: command.get_available_teams(),
          competition_team_entries: command.competition_team_entries,
          teams_in_competition: command.get_teams_in_competition(),
        },
        competition_team_use_cases:
          competition_edit_workspace_dependencies.competition_team_use_cases,
      });
      if (!result.success) {
        command.show_toast(`Failed to remove team: ${result.error}`, "error");
        return;
      }
      command.set_competition_team_entries(
        result.data.competition_team_entries,
      );
      command.set_teams_in_competition(result.data.teams_in_competition);
      command.set_available_teams(result.data.available_teams);
      command.show_toast(`${team.name} removed from competition`, "success");
    },
    handle_reset_scoring: (): void => {
      command.set_form_data(
        reset_competition_scoring_overrides(command.get_form_data()),
      );
      command.set_is_customizing_scoring(false);
    },
    handle_submit: async (): Promise<void> => {
      if (!command.can_edit_competition) {
        return;
      }
      command.set_is_saving(true);
      const result = await submit_competition_edit_workspace({
        competition_id: command.competition_id,
        form_data: command.get_form_data(),
        competition_use_cases:
          competition_edit_workspace_dependencies.competition_use_cases,
      });
      command.set_is_saving(false);
      if (!result.success) {
        command.show_toast(result.error, "error");
        return;
      }
      command.show_toast("Competition updated successfully!", "success");
      setTimeout(() => {
        void command.goto("/competitions");
      }, 1500);
    },
    handle_toggle_auto_squad_submission: (enabled: boolean): void => {
      command.set_form_data({
        ...command.get_form_data(),
        allow_auto_squad_submission: enabled,
        lineup_submission_deadline_hours: enabled
          ? command.get_form_data().lineup_submission_deadline_hours
          : 0,
      });
    },
    handle_toggle_tie_breaker: (
      tie_breaker: TieBreaker,
      enabled: boolean,
    ): void => {
      const selected_format_state = command.get_selected_format_state();
      const format_default_tie_breakers = (
        selected_format_state.status === "present"
          ? selected_format_state.competition_format.tie_breakers
          : ["goal_difference", "goals_scored"]
      ) as TieBreaker[];
      command.set_form_data(
        toggle_competition_tie_breaker(
          command.get_form_data(),
          tie_breaker,
          enabled,
          format_default_tie_breakers,
        ),
      );
    },
    handle_update_points: (
      field: "points_for_win" | "points_for_draw" | "points_for_loss",
      raw_value: string,
    ): void => {
      command.set_form_data(
        update_competition_points_override(
          command.get_form_data(),
          field,
          raw_value,
        ),
      );
    },
  };
}
