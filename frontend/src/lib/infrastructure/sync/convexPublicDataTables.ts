import type { TableName } from "./convexSyncService";

export const PublicDataPageKind = {
  COMPETITION_RESULTS: "competition_results",
  CALENDAR: "calendar",
  MATCH_REPORT: "match_report",
} as const;

export type PublicDataPageType =
  (typeof PublicDataPageKind)[keyof typeof PublicDataPageKind];

const COMPETITION_RESULTS_TABLES: TableName[] = [
  "organizations",
  "sports",
  "competitions",
  "competition_formats",
  "competition_stages",
  "competition_teams",
  "teams",
  "fixtures",
  "fixture_lineups",
  "fixture_details_setups",
  "officials",
  "team_staff",
  "team_staff_roles",
  "game_official_roles",
];

const CALENDAR_TABLES: TableName[] = [
  "organizations",
  "sports",
  "competitions",
  "teams",
  "fixtures",
  "activities",
  "activity_categories",
];

const MATCH_REPORT_TABLES: TableName[] = [
  "organizations",
  "sports",
  "competitions",
  "competition_formats",
  "competition_stages",
  "teams",
  "fixtures",
  "fixture_lineups",
  "fixture_details_setups",
  "officials",
  "team_staff",
  "team_staff_roles",
  "game_official_roles",
  "players",
  "player_positions",
  "player_team_memberships",
];

export function get_tables_for_page(
  page_type: PublicDataPageType,
): TableName[] {
  switch (page_type) {
    case PublicDataPageKind.COMPETITION_RESULTS:
      return COMPETITION_RESULTS_TABLES;
    case PublicDataPageKind.CALENDAR:
      return CALENDAR_TABLES;
    case PublicDataPageKind.MATCH_REPORT:
      return MATCH_REPORT_TABLES;
  }
}
