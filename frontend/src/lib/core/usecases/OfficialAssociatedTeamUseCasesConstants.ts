export const OFFICIAL_ASSOCIATED_TEAM_USE_CASES_LOG_SCOPE =
  "[OfficialAssociatedTeamUseCases]";

export const OfficialAssociatedTeamUseCaseEvent = {
  CREATE_VALIDATION_FAILED: "official_associated_team_create_validation_failed",
  CREATE_FAILED: "official_associated_team_create_failed",
  UPDATE_TARGET_NOT_FOUND: "official_associated_team_update_target_not_found",
  UPDATE_VALIDATION_FAILED: "official_associated_team_update_validation_failed",
  UPDATE_FAILED: "official_associated_team_update_failed",
  DELETE_FAILED: "official_associated_team_delete_failed",
  GET_FAILED: "official_associated_team_get_failed",
  LIST_FAILED: "official_associated_team_list_failed",
  LIST_BY_OFFICIAL_FAILED: "official_associated_team_list_by_official_failed",
  LIST_BY_TEAM_FAILED: "official_associated_team_list_by_team_failed",
} as const;

export const OfficialAssociatedTeamUseCaseMessage = {
  NOT_FOUND: "Official associated team not found",
} as const;

export const OFFICIAL_ASSOCIATED_TEAM_DEFAULT_QUERY_OPTIONS = {
  page_number: 1,
  page_size: 100,
} as const;
