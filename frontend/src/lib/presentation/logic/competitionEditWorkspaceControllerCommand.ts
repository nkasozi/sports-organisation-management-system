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

export interface CompetitionEditWorkspaceControllerCommand {
  get_can_edit_competition: () => boolean;
  get_competition_id: () => string;
  get_competition_formats: () => CompetitionFormat[];
  get_competition_team_entries: () => CompetitionTeam[];
  get_available_teams: () => Team[];
  get_form_data: () => UpdateCompetitionInput;
  get_selected_format_state: () => CompetitionEditSelectedFormatState;
  get_teams_in_competition: () => Team[];
  goto: (path: string) => Promise<unknown>;
  get_organizations: () => Organization[];
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
}

export type CompetitionEditPointsField =
  | "points_for_win"
  | "points_for_draw"
  | "points_for_loss";

export interface CompetitionEditWorkspaceControllerRuntime {
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
}
