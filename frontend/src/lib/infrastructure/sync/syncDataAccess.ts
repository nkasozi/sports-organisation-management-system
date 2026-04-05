import {
  get_database,
  type SportSyncDatabase,
} from "../../adapters/repositories/database";
import type { Table } from "dexie";
import type { SyncHints } from "$lib/core/interfaces/ports";
import type { ConvexClient, RemoteTableState, TableName } from "./syncTypes";
import { EPOCH_TIMESTAMP, TABLE_NAMES } from "./syncTypes";

export function get_local_latest_modified_at(
  all_records: Array<{ id: string; updated_at?: string; created_at?: string }>,
): string {
  return all_records.reduce((max, record) => {
    const timestamp = record.updated_at || record.created_at || EPOCH_TIMESTAMP;
    return timestamp > max ? timestamp : max;
  }, EPOCH_TIMESTAMP);
}

export function get_table_from_database(
  database: SportSyncDatabase,
  table_name: TableName,
): Table<
  { id: string; updated_at?: string; created_at?: string },
  string
> | null {
  const table_map: Record<
    TableName,
    Table<{ id: string; updated_at?: string; created_at?: string }, string>
  > = {
    organizations: database.organizations,
    competitions: database.competitions,
    teams: database.teams,
    players: database.players,
    officials: database.officials,
    fixtures: database.fixtures,
    sports: database.sports,
    team_staff: database.team_staff,
    team_staff_roles: database.team_staff_roles,
    game_official_roles: database.game_official_roles,
    venues: database.venues,
    jersey_colors: database.jersey_colors,
    player_positions: database.player_positions,
    player_profiles: database.player_profiles,
    team_profiles: database.team_profiles,
    profile_links: database.profile_links,
    calendar_tokens: database.calendar_tokens,
    competition_formats: database.competition_formats,
    competition_stages: database.competition_stages,
    competition_teams: database.competition_teams,
    player_team_memberships: database.player_team_memberships,
    fixture_details_setups: database.fixture_details_setups,
    fixture_lineups: database.fixture_lineups,
    activities: database.activities,
    activity_categories: database.activity_categories,
    system_users: database.system_users,
    identification_types: database.identification_types,
    identifications: database.identifications,
    qualifications: database.qualifications,
    game_event_types: database.game_event_types,
    genders: database.genders,
    live_game_logs: database.live_game_logs,
    game_event_logs: database.game_event_logs,
    player_team_transfer_histories: database.player_team_transfer_histories,
    official_associated_teams: database.official_associated_teams,
    official_performance_ratings: database.official_performance_ratings,
    organization_settings: database.organization_settings,
  };
  return table_map[table_name] || null;
}

export async function get_remote_latest_modified_at(
  convex_client: ConvexClient,
  table_name: string,
): Promise<RemoteTableState> {
  const result = (await convex_client.query("sync:get_latest_modified_at", {
    table_name,
  })) as RemoteTableState;
  return result;
}

export async function get_remote_state_for_table(
  convex_client: ConvexClient,
  table_name: string,
  hints: SyncHints | undefined,
): Promise<RemoteTableState> {
  const cached = hints?.remote_timestamp_cache?.[table_name];
  if (cached !== undefined && !hints?.use_fresh_timestamps) {
    return { record_count: 0, latest_modified_at: cached ?? null };
  }
  return get_remote_latest_modified_at(convex_client, table_name);
}

export { get_database };
