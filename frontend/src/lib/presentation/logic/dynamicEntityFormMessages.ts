export const DYNAMIC_ENTITY_FORM_EVENT = {
  SUB_ENTITY_USE_CASES_MISSING:
    "dynamic_entity_form_sub_entity_use_cases_missing",
  SAVE_FAILED: "dynamic_entity_form_save_failed",
  SAVE_CRASHED: "dynamic_entity_form_save_crashed",
  SAVE_HANDLER_MISSING: "dynamic_entity_form_save_handler_missing",
  CREATE_NOT_SUPPORTED: "dynamic_entity_form_create_not_supported",
  UPDATE_NOT_SUPPORTED: "dynamic_entity_form_update_not_supported",
  AUTHORIZATION_CHECK_FAILED: "dynamic_entity_form_authorization_check_failed",
  FOREIGN_ENTITY_NAVIGATION_FAILED:
    "dynamic_entity_form_foreign_entity_navigation_failed",
  GENDER_CHECK_RECORDS_UNAVAILABLE:
    "dynamic_entity_form_gender_check_records_unavailable",
  TRANSFER_MEMBERSHIP_UPDATE_FAILED:
    "dynamic_entity_form_transfer_membership_update_failed",
} as const;

export const DYNAMIC_ENTITY_FORM_MESSAGE = {
  SAVE_FAILED: "We couldn't save your changes. Please try again.",
  SAVE_HANDLER_MISSING:
    "This kind of record can't be saved right now. Please contact support.",
  CREATE_NOT_SUPPORTED: "New records of this kind can't be created here.",
  UPDATE_NOT_SUPPORTED: "Records of this kind can't be edited here.",
} as const;
