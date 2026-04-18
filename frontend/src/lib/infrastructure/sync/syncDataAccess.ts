import type { Table } from "dexie";

import type { SyncHints } from "$lib/core/interfaces/ports";
import type {
  IsoDateTimeString,
  ScalarValueInput,
} from "$lib/core/types/DomainScalars";

import {
  get_database,
  type SportSyncDatabase,
} from "../../adapters/repositories/database";
import type { ConvexClient, RemoteTableState, TableName } from "./syncTypes";
import { EPOCH_TIMESTAMP } from "./syncTypes";

type SyncTimestamp = ScalarValueInput<IsoDateTimeString>;

type SyncRecord = {
  id: string;
  updated_at?: SyncTimestamp;
  created_at?: SyncTimestamp;
};

type SyncTable = Table<SyncRecord, string>;

function cast_sync_table<TEntity>(table: Table<TEntity, string>): SyncTable {
  return table as unknown as SyncTable;
}

export function get_local_latest_modified_at(
  all_records: SyncRecord[],
): SyncTimestamp {
  return all_records.reduce<SyncTimestamp>((max, record) => {
    const timestamp = record.updated_at || record.created_at || EPOCH_TIMESTAMP;
    return timestamp > max ? timestamp : max;
  }, EPOCH_TIMESTAMP);
}

export function get_table_from_database(
  database: SportSyncDatabase,
  table_name: TableName,
): SyncTable {
  const table_map: Record<TableName, SyncTable> = {
    organizations: cast_sync_table(database.organizations),
    competitions: cast_sync_table(database.competitions),
    teams: cast_sync_table(database.teams),
    players: cast_sync_table(database.players),
    officials: cast_sync_table(database.officials),
    fixtures: cast_sync_table(database.fixtures),
    sports: cast_sync_table(database.sports),
    team_staff: cast_sync_table(database.team_staff),
    team_staff_roles: cast_sync_table(database.team_staff_roles),
    game_official_roles: cast_sync_table(database.game_official_roles),
    venues: cast_sync_table(database.venues),
    jersey_colors: cast_sync_table(database.jersey_colors),
    player_positions: cast_sync_table(database.player_positions),
    player_profiles: cast_sync_table(database.player_profiles),
    team_profiles: cast_sync_table(database.team_profiles),
    profile_links: cast_sync_table(database.profile_links),
    calendar_tokens: cast_sync_table(database.calendar_tokens),
    competition_formats: cast_sync_table(database.competition_formats),
    competition_stages: cast_sync_table(database.competition_stages),
    competition_teams: cast_sync_table(database.competition_teams),
    player_team_memberships: cast_sync_table(database.player_team_memberships),
    fixture_details_setups: cast_sync_table(database.fixture_details_setups),
    fixture_lineups: cast_sync_table(database.fixture_lineups),
    activities: cast_sync_table(database.activities),
    activity_categories: cast_sync_table(database.activity_categories),
    system_users: cast_sync_table(database.system_users),
    identification_types: cast_sync_table(database.identification_types),
    identifications: cast_sync_table(database.identifications),
    qualifications: cast_sync_table(database.qualifications),
    game_event_types: cast_sync_table(database.game_event_types),
    genders: cast_sync_table(database.genders),
    live_game_logs: cast_sync_table(database.live_game_logs),
    game_event_logs: cast_sync_table(database.game_event_logs),
    player_team_transfer_histories: cast_sync_table(
      database.player_team_transfer_histories,
    ),
    official_associated_teams: cast_sync_table(
      database.official_associated_teams,
    ),
    official_performance_ratings: cast_sync_table(
      database.official_performance_ratings,
    ),
    organization_settings: cast_sync_table(database.organization_settings),
  };

  return table_map[table_name];
}

async function get_remote_latest_modified_at(
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
  if (cached != void 0 && !hints?.use_fresh_timestamps) {
    return {
      record_count: 0,
      latest_modified_at: cached as RemoteTableState["latest_modified_at"],
    };
  }
  return get_remote_latest_modified_at(convex_client, table_name);
}

export { get_database };
