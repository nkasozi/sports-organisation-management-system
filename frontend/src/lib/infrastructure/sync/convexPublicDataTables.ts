import { is_global_table } from "$convex/lib/sync_table_catalog";
import { type Option, OptionStatus } from "$lib/core/types/Option";

import type { TableName } from "./convexSyncService";

const ORGANIZATIONS_TABLE_NAME = "organizations";

export const PublicDataPageKind = {
  COMPETITION_RESULTS: "competition_results",
  CALENDAR: "calendar",
  MATCH_REPORT: "match_report",
  LIVE_GAMES: "live_games",
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

const LIVE_GAMES_TABLES: TableName[] = [
  "organizations",
  "sports",
  "competitions",
  "competition_stages",
  "teams",
  "fixtures",
  "fixture_lineups",
  "fixture_details_setups",
  "officials",
  "game_official_roles",
  "players",
  "player_positions",
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
    case PublicDataPageKind.LIVE_GAMES:
      return LIVE_GAMES_TABLES;
  }
}

function is_organization_independent_table(table_name: TableName): boolean {
  return table_name === ORGANIZATIONS_TABLE_NAME || is_global_table(table_name);
}

export function get_tables_for_organization_scope(
  page_type: PublicDataPageType,
  organization_scope: Option<string>,
): TableName[] {
  const tables = get_tables_for_page(page_type);
  switch (organization_scope.status) {
    case OptionStatus.SOME:
      return tables;
    case OptionStatus.NONE:
      return tables.filter(is_organization_independent_table);
  }
}
