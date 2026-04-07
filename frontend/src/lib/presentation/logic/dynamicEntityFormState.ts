import type { BaseEntity } from "../../core/entities/BaseEntity";

export type DynamicEntityFormState = {
  form_data: Record<string, any>;
  validation_errors: Record<string, string>;
  foreign_key_options: Record<string, BaseEntity[]>;
  filtered_fields_loading: Record<string, boolean>;
  all_competition_teams_cache: BaseEntity[];
};

export type DynamicEntityFormUiState = {
  is_loading: boolean;
  is_save_in_progress: boolean;
  auth_profile_missing: boolean;
  auth_error_message: string;
  permission_denied: boolean;
  permission_denied_message: string;
  save_error_message: string;
};

export type DynamicEntityFormWarningState = {
  color_clash_warnings: string[];
  official_team_conflict_warnings: string[];
  gender_mismatch_warnings: string[];
  fixture_team_gender_mismatch_warnings: string[];
};
