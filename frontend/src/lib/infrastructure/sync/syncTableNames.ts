import type { UserRole } from "$lib/core/interfaces/ports";
import { check_entity_permission_in_any_scope } from "$lib/core/interfaces/ports";

import { TABLE_NAME_TO_ENTITY_TYPE } from "./syncTableEntityTypes";

export const TABLE_NAMES = [
  "organizations",
  "competitions",
  "teams",
  "players",
  "officials",
  "fixtures",
  "sports",
  "team_staff",
  "team_staff_roles",
  "game_official_roles",
  "venues",
  "jersey_colors",
  "player_positions",
  "player_profiles",
  "team_profiles",
  "profile_links",
  "calendar_tokens",
  "competition_formats",
  "competition_stages",
  "competition_teams",
  "player_team_memberships",
  "fixture_details_setups",
  "fixture_lineups",
  "activities",
  "activity_categories",
  "system_users",
  "identification_types",
  "identifications",
  "qualifications",
  "game_event_types",
  "genders",
  "live_game_logs",
  "game_event_logs",
  "player_team_transfer_histories",
  "official_associated_teams",
  "official_performance_ratings",
  "organization_settings",
] as const;

export type TableName = (typeof TABLE_NAMES)[number];

const PushOperation = {
  UPSERT: "upsert",
  DELETE: "delete",
} as const;

type PushOperationValue = (typeof PushOperation)[keyof typeof PushOperation];

export function role_can_push_operation(
  role: UserRole,
  table_name: string,
  operation: PushOperationValue,
): boolean {
  const entity_type = TABLE_NAME_TO_ENTITY_TYPE[table_name as TableName];
  if (!entity_type) return true;
  switch (operation) {
    case PushOperation.UPSERT:
      return (
        check_entity_permission_in_any_scope(role, entity_type, "create") ||
        check_entity_permission_in_any_scope(role, entity_type, "update")
      );
    case PushOperation.DELETE:
      return check_entity_permission_in_any_scope(role, entity_type, "delete");
  }
}

function role_can_push_table(role: UserRole, table_name: TableName): boolean {
  return (
    role_can_push_operation(role, table_name, PushOperation.UPSERT) ||
    role_can_push_operation(role, table_name, PushOperation.DELETE)
  );
}

export function get_push_excluded_tables(role: UserRole): Set<string> {
  return new Set(
    TABLE_NAMES.filter((table_name) => !role_can_push_table(role, table_name)),
  );
}

export function get_push_excluded_tables_for_unsigned_user(): Set<string> {
  return new Set(TABLE_NAMES);
}
