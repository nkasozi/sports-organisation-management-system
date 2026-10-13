import type Dexie from "dexie";

import { create_legacy_outbox_migration } from "./syncOutbox/syncOutboxLegacyMigration";
import { SYNC_BOOKKEEPING_STORE_SCHEMA } from "./syncOutbox/syncOutboxTypes";

const VERSION_3_STORES: Record<string, string> = {
  organizations: "id, name, sport_id, created_at, updated_at",
  competitions:
    "id, name, organization_id, format_id, status, start_date, end_date, created_at",
  teams: "id, name, organization_id, created_at",
  players: "id, first_name, last_name, email, date_of_birth, created_at",
  officials: "id, first_name, last_name, email, created_at",
  fixtures:
    "id, competition_id, home_team_id, away_team_id, venue_id, stage_id, scheduled_date, status, created_at",
  sports: "id, name, created_at",
  team_staff: "id, team_id, role_id, first_name, last_name, created_at",
  team_staff_roles: "id, name, organization_id, sport_id, created_at",
  game_official_roles: "id, name, organization_id, sport_id, created_at",
  venues: "id, name, city, country, created_at",
  jersey_colors: "id, name, hex_code, created_at",
  player_positions:
    "id, name, organization_id, abbreviation, sport_id, created_at",
  player_profiles: "id, player_id, slug, created_at",
  team_profiles: "id, team_id, slug, created_at",
  profile_links: "id, profile_type, profile_id, platform, created_at",
  calendar_tokens: "id, token, entity_type, entity_id, created_at",
  competition_formats: "id, name, sport_id, created_at",
  competition_teams: "id, competition_id, team_id, created_at",
  player_team_memberships:
    "id, player_id, team_id, position_id, jersey_number, created_at",
  fixture_details_setups:
    "id, fixture_id, referee_id, home_jersey_color_id, away_jersey_color_id, created_at",
  fixture_lineups:
    "id, fixture_id, team_id, player_id, position_id, is_starting, created_at",
  activities:
    "id, category_id, entity_type, entity_id, scheduled_date, created_at",
  activity_categories: "id, name, color, created_at",
  audit_logs: "id, action, entity_type, entity_id, user_id, created_at",
  system_users: "id, email, role, organization_id, created_at",
  identification_types: "id, name, organization_id, created_at",
  genders: "id, name, organization_id, status, created_at",
  identifications:
    "id, entity_type, entity_id, identification_type_id, created_at",
  qualifications: "id, entity_type, entity_id, name, created_at",
  game_event_types: "id, name, organization_id, sport_id, category, created_at",
  official_associated_teams:
    "id, official_id, team_id, association_type, status, created_at",
  player_team_transfer_histories:
    "id, player_id, from_team_id, to_team_id, status, transfer_date, created_at",
  live_game_logs:
    "id, organization_id, fixture_id, game_status, started_at, ended_at, created_at",
  game_event_logs:
    "id, organization_id, live_game_log_id, fixture_id, event_type, minute, team_side, player_id, created_at",
  competition_stages: "id, competition_id, stage_order, created_at",
};

const SchemaVersion = {
  INITIAL: 3,
  APP_SETTINGS: 4,
  OFFICIAL_RATINGS: 5,
  OFFICIAL_RATINGS_REINDEX: 6,
  ORGANIZATION_SETTINGS: 7,
  SYNC_OUTBOX: 8,
} as const;

export function define_sport_sync_schema_versions(
  database: Dexie,
  tracked_table_names: readonly string[],
): boolean {
  database.version(SchemaVersion.INITIAL).stores(VERSION_3_STORES);
  database.version(SchemaVersion.APP_SETTINGS).stores({ app_settings: "key" });
  database.version(SchemaVersion.OFFICIAL_RATINGS).stores({
    official_performance_ratings:
      "id, organization_id, official_id, fixture_id, rater_user_id, rater_role, submitted_at, created_at",
  });
  database.version(SchemaVersion.OFFICIAL_RATINGS_REINDEX).stores({
    official_performance_ratings:
      "id, organization_id, official_id, fixture_id, rater_user_id, rater_role, created_at",
  });
  database.version(SchemaVersion.ORGANIZATION_SETTINGS).stores({
    organization_settings: "id, organization_id, created_at",
  });
  database
    .version(SchemaVersion.SYNC_OUTBOX)
    .stores(SYNC_BOOKKEEPING_STORE_SCHEMA)
    .upgrade(
      create_legacy_outbox_migration({
        tracked_table_names,
        generate_change_token: (): string => crypto.randomUUID(),
        now_iso: (): string => new Date().toISOString(),
      }),
    );
  return true;
}
