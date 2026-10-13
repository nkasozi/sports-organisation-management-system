export const DYNAMIC_FORM_EVENT = {
  FILE_READ_FAILED: "dynamic_form_file_read_failed",
  FILE_STORE_FAILED: "dynamic_form_file_store_failed",
} as const;

export const DYNAMIC_FORM_MESSAGE = {
  FILE_PROCESSING_FAILED:
    "We couldn't process that file. Please try a different image.",
  FILE_VALIDATION_FAILED: "That file can't be used. Please choose another.",
} as const;

export const DYNAMIC_FORM_DATA_LOADER_EVENT = {
  USE_CASES_MISSING: "dynamic_form_data_loader_use_cases_missing",
  ENTITY_LIST_FAILED: "dynamic_form_data_loader_entity_list_failed",
  FOREIGN_KEY_OPTIONS_LOADED:
    "dynamic_form_data_loader_foreign_key_options_loaded",
} as const;
