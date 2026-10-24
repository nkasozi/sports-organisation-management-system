import type { CreateCompetitionInput } from "$lib/core/entities/Competition";
import type { CompetitionFormat } from "$lib/core/entities/CompetitionFormat";
import type { Organization } from "$lib/core/entities/Organization";
import type { SelectOption } from "$lib/presentation/components/ui/SelectField.svelte";
import type { CompetitionCreateProfileState } from "$lib/presentation/logic/competitionCreatePageData";
import type {
  CompetitionCreateRawTokenState,
  CompetitionCreateSelectedSportState,
} from "$lib/presentation/logic/competitionCreatePageFlow";
import type { CompetitionCreateSelectedFormatState } from "$lib/presentation/logic/competitionCreatePageState";

export interface CompetitionCreatePageControllerCommand {
  get_competition_formats: () => CompetitionFormat[];
  get_current_auth_profile_state: () => CompetitionCreateProfileState;
  get_current_raw_token_state: () => CompetitionCreateRawTokenState;
  get_form_data: () => CreateCompetitionInput;
  get_selected_sport_state: () => CompetitionCreateSelectedSportState;
  get_selected_format_state: () => CompetitionCreateSelectedFormatState;
  get_selected_team_ids: () => Set<string>;
  get_is_team_count_valid: () => boolean;
  get_organizations: () => Organization[];
  is_browser: boolean;
  goto: (path: string) => Promise<unknown>;
  set_competition_format_options: (value: SelectOption[]) => void;
  set_competition_formats: (value: CompetitionFormat[]) => void;
  set_error_message: (value: string) => void;
  set_form_data: (value: CreateCompetitionInput) => void;
  set_is_loading_formats: (value: boolean) => void;
  set_is_loading_organizations: (value: boolean) => void;
  set_is_loading_teams: (value: boolean) => void;
  set_is_saving: (value: boolean) => void;
  set_organization_options: (value: SelectOption[]) => void;
  set_organizations: (value: Organization[]) => void;
  set_selected_format_state: (
    value: CompetitionCreateSelectedFormatState,
  ) => void;
  set_selected_sport_state: (
    value: CompetitionCreateSelectedSportState,
  ) => void;
  set_selected_team_ids: (value: Set<string>) => void;
  set_team_options: (value: SelectOption[]) => void;
  show_toast: (message: string, type: "success" | "error" | "info") => void;
}

export interface CompetitionCreatePageControllerRuntime {
  handle_auto_squad_submission_toggle: (enabled: boolean) => void;
  handle_fill_fake_data: () => Promise<void>;
  handle_format_change: (event: CustomEvent<{ value: string }>) => void;
  handle_organization_change: (
    event: CustomEvent<{ value: string }>,
  ) => Promise<void>;
  handle_submit: () => Promise<void>;
  handle_team_toggle: (team_id: string) => boolean;
  initialize: () => Promise<void>;
}
