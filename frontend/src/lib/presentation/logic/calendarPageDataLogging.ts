export const CALENDAR_PAGE_DATA_EVENTS = {
  COMPETITION_SYNC_FAILED: "calendar_competition_sync_failed",
  FIXTURE_SYNC_FAILED: "calendar_fixture_sync_failed",
  EVENTS_LOAD_FAILED: "calendar_events_load_failed",
  DEFAULT_CATEGORIES_FAILED: "calendar_default_categories_failed",
  ORGANIZATIONS_LOAD_FAILED: "calendar_organizations_load_failed",
} as const;

export function log_calendar_step_failure(
  result: { success: true } | { success: false; error: unknown },
  event: string,
  organization_id: string,
): boolean {
  if (result.success) return false;
  console.warn("[CalendarPageData] Calendar data step failed", {
    event,
    organization_id,
    error: String(result.error),
  });
  return true;
}
