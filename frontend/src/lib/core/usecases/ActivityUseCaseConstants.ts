export const ACTIVITY_LOG_SCOPE = "[ActivityUseCases]";

export const ACTIVITY_CATEGORY_LOG_SCOPE = "[ActivityCategoryUseCases]";

export const ACTIVITY_SYNC_LOG_SCOPE = "[ActivitySync]";

export const CALENDAR_EVENT_PAGE_SIZE = 1000;

export const FIXTURE_SYNC_PAGE_SIZE = 1000;

export const ACTIVITY_EVENT = {
  ID_MISSING: "activity_id_missing",
  ORGANIZATION_ID_MISSING: "activity_organization_id_missing",
  VALIDATION_FAILED: "activity_validation_failed",
  LOOKUP_FAILED: "activity_lookup_failed",
  LIST_FAILED: "activity_list_failed",
  CREATE_FAILED: "activity_create_failed",
  UPDATE_FAILED: "activity_update_failed",
  DELETE_FAILED: "activity_delete_failed",
  EDIT_BLOCKED: "activity_edit_blocked",
  DELETE_BLOCKED: "activity_delete_blocked",
  CALENDAR_ACTIVITIES_FAILED: "activity_calendar_activities_failed",
  CALENDAR_CATEGORIES_UNAVAILABLE: "activity_calendar_categories_unavailable",
} as const;

export const ACTIVITY_MESSAGE = {
  ID_REQUIRED: "Activity ID is required",
  ORGANIZATION_ID_REQUIRED: "Organization ID is required",
  EDIT_BLOCKED:
    "Cannot edit activities auto-generated from competitions or fixtures",
  DELETE_BLOCKED:
    "Cannot delete activities auto-generated from competitions or fixtures",
} as const;

export const ACTIVITY_CATEGORY_EVENT = {
  ID_MISSING: "activity_category_id_missing",
  ORGANIZATION_ID_MISSING: "activity_category_organization_id_missing",
  VALIDATION_FAILED: "activity_category_validation_failed",
  LOOKUP_FAILED: "activity_category_lookup_failed",
  LIST_FAILED: "activity_category_list_failed",
  CREATE_FAILED: "activity_category_create_failed",
  UPDATE_FAILED: "activity_category_update_failed",
  DELETE_FAILED: "activity_category_delete_failed",
  SYSTEM_DELETE_BLOCKED: "activity_category_system_delete_blocked",
  DEFAULT_CREATE_FAILED: "activity_category_default_create_failed",
} as const;

export const ACTIVITY_CATEGORY_MESSAGE = {
  ID_REQUIRED: "Category ID is required",
  ORGANIZATION_ID_REQUIRED: "Organization ID is required",
  SYSTEM_DELETE_BLOCKED: "Cannot delete system-generated categories",
} as const;

export const ACTIVITY_SYNC_EVENT = {
  COMPETITION_CATEGORY_MISSING: "competition_category_missing",
  FIXTURE_CATEGORY_MISSING: "fixture_category_missing",
  COMPETITIONS_FETCH_FAILED: "competition_fetch_failed",
  FIXTURES_FETCH_FAILED: "fixture_fetch_failed",
  FIXTURES_LOADED: "fixtures_loaded",
  FIXTURE_SYNC_STARTED: "fixture_sync_started",
  SOURCE_LOOKUP_FAILED: "activity_sync_source_lookup_failed",
  UPSERT_FAILED: "activity_sync_upsert_failed",
  TEAM_NAME_UNAVAILABLE: "activity_sync_team_name_unavailable",
} as const;

export const ACTIVITY_SYNC_MESSAGE = {
  COMPETITION_CATEGORY_MISSING:
    "Competition category not found. Please ensure default categories are created.",
  FIXTURE_CATEGORY_MISSING:
    "Fixture category not found. Please ensure default categories are created.",
} as const;

export function build_category_type_missing_detail(
  category_type: string,
  organization_id: string,
): string {
  return `No ${category_type} category found for organization: ${organization_id}`;
}
