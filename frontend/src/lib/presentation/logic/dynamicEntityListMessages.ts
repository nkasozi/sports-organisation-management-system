export const DYNAMIC_ENTITY_LIST_EVENT = {
  METADATA_MISSING: "dynamic_entity_list_metadata_missing",
  USE_CASES_MISSING: "dynamic_entity_list_use_cases_missing",
  LOAD_FAILED: "dynamic_entity_list_load_failed",
  FILTER_OPTIONS_UNAVAILABLE: "dynamic_entity_list_filter_options_unavailable",
  DELETE_FAILED: "dynamic_entity_list_delete_failed",
} as const;

export const DYNAMIC_ENTITY_LIST_MESSAGE = {
  LIST_UNAVAILABLE:
    "This list isn't available right now. Please refresh and try again.",
  LOAD_FAILED: "We couldn't load these records. Please try again.",
  PROFILE_MISSING:
    "Unable to load data: No user profile is set. Please select a user profile to continue.",
  DELETE_FAILED: "We couldn't delete the selected records. Please try again.",
} as const;

export function build_dynamic_entity_list_access_denied_message(
  display_name: string,
): string {
  return `Access denied: Your role does not have permission to view ${display_name} data.`;
}
