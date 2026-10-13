export const PROFILE_LINK_USE_CASES_LOG_SCOPE = "[ProfileLinkUseCases]";

export const ProfileLinkUseCaseEvent = {
  LIST_FAILED: "profile_link_list_failed",
  LIST_BY_PROFILE_FAILED: "profile_link_list_by_profile_failed",
  GET_ID_MISSING: "profile_link_get_id_missing",
  GET_FAILED: "profile_link_get_failed",
  CREATE_VALIDATION_FAILED: "profile_link_create_validation_failed",
  CREATE_FAILED: "profile_link_create_failed",
  UPDATE_ID_MISSING: "profile_link_update_id_missing",
  UPDATE_FAILED: "profile_link_update_failed",
  DELETE_ID_MISSING: "profile_link_delete_id_missing",
  DELETE_FAILED: "profile_link_delete_failed",
} as const;

export const ProfileLinkUseCaseMessage = {
  ID_REQUIRED: "Link ID is required",
} as const;
