import Dexie, { type Table } from "dexie";

import { TABLE_NAMES } from "$lib/infrastructure/sync/syncTableNames";

import type { Activity } from "../../core/entities/Activity";
import type { ActivityCategory } from "../../core/entities/ActivityCategory";
import type { AuditLog } from "../../core/entities/AuditLog";
import type { CalendarToken } from "../../core/entities/CalendarToken";
import type { Competition } from "../../core/entities/Competition";
import type { CompetitionFormat } from "../../core/entities/CompetitionFormat";
import type { CompetitionStage } from "../../core/entities/CompetitionStage";
import type { CompetitionTeam } from "../../core/entities/CompetitionTeam";
import type { Fixture } from "../../core/entities/Fixture";
import type { FixtureDetailsSetup } from "../../core/entities/FixtureDetailsSetup";
import type { FixtureLineup } from "../../core/entities/FixtureLineup";
import type { GameEventLog } from "../../core/entities/GameEventLog";
import type { GameEventType } from "../../core/entities/GameEventType";
import type { GameOfficialRole } from "../../core/entities/GameOfficialRole";
import type { Gender } from "../../core/entities/Gender";
import type { Identification } from "../../core/entities/Identification";
import type { IdentificationType } from "../../core/entities/IdentificationType";
import type { JerseyColor } from "../../core/entities/JerseyColor";
import type { LiveGameLog } from "../../core/entities/LiveGameLog";
import type { Official } from "../../core/entities/Official";
import type { OfficialAssociatedTeam } from "../../core/entities/OfficialAssociatedTeam";
import type { OfficialPerformanceRating } from "../../core/entities/OfficialPerformanceRating";
import type { Organization } from "../../core/entities/Organization";
import type { OrganizationSettings } from "../../core/entities/OrganizationSettings";
import type { Player } from "../../core/entities/Player";
import type { PlayerPosition } from "../../core/entities/PlayerPosition";
import type { PlayerProfile } from "../../core/entities/PlayerProfile";
import type { PlayerTeamMembership } from "../../core/entities/PlayerTeamMembership";
import type { PlayerTeamTransferHistory } from "../../core/entities/PlayerTeamTransferHistory";
import type { ProfileLink } from "../../core/entities/ProfileLink";
import type { Qualification } from "../../core/entities/Qualification";
import type { Sport } from "../../core/entities/Sport";
import type { SystemUser } from "../../core/entities/SystemUser";
import type { Team } from "../../core/entities/Team";
import type { TeamProfile } from "../../core/entities/TeamProfile";
import type { TeamStaff } from "../../core/entities/TeamStaff";
import type { TeamStaffRole } from "../../core/entities/TeamStaffRole";
import type { Venue } from "../../core/entities/Venue";
import { define_sport_sync_schema_versions } from "./databaseSchemaVersions";
import { register_sync_outbox_middleware } from "./syncOutbox/registerSyncOutboxMiddleware";
import {
  type SyncCursor,
  type SyncOutboxEntry,
  type SyncOutboxKey,
  type SyncRecordVersion,
} from "./syncOutbox/syncOutboxTypes";

const DATABASE_NAME = "SportSyncDB";
class SportSyncDatabase extends Dexie {
  organizations!: Table<Organization, string>;
  competitions!: Table<Competition, string>;
  teams!: Table<Team, string>;
  players!: Table<Player, string>;
  officials!: Table<Official, string>;
  fixtures!: Table<Fixture, string>;
  sports!: Table<Sport, string>;
  team_staff!: Table<TeamStaff, string>;
  team_staff_roles!: Table<TeamStaffRole, string>;
  game_official_roles!: Table<GameOfficialRole, string>;
  venues!: Table<Venue, string>;
  jersey_colors!: Table<JerseyColor, string>;
  player_positions!: Table<PlayerPosition, string>;
  player_profiles!: Table<PlayerProfile, string>;
  team_profiles!: Table<TeamProfile, string>;
  profile_links!: Table<ProfileLink, string>;
  calendar_tokens!: Table<CalendarToken, string>;
  competition_formats!: Table<CompetitionFormat, string>;
  competition_teams!: Table<CompetitionTeam, string>;
  player_team_memberships!: Table<PlayerTeamMembership, string>;
  fixture_details_setups!: Table<FixtureDetailsSetup, string>;
  fixture_lineups!: Table<FixtureLineup, string>;
  activities!: Table<Activity, string>;
  activity_categories!: Table<ActivityCategory, string>;
  audit_logs!: Table<AuditLog, string>;
  system_users!: Table<SystemUser, string>;
  identification_types!: Table<IdentificationType, string>;
  genders!: Table<Gender, string>;
  identifications!: Table<Identification, string>;
  qualifications!: Table<Qualification, string>;
  game_event_types!: Table<GameEventType, string>;
  official_associated_teams!: Table<OfficialAssociatedTeam, string>;
  player_team_transfer_histories!: Table<PlayerTeamTransferHistory, string>;
  live_game_logs!: Table<LiveGameLog, string>;
  game_event_logs!: Table<GameEventLog, string>;
  competition_stages!: Table<CompetitionStage, string>;
  official_performance_ratings!: Table<OfficialPerformanceRating, string>;
  organization_settings!: Table<OrganizationSettings, string>;
  app_settings!: Table<{ key: string; value: string }, string>;
  sync_outbox!: Table<SyncOutboxEntry, SyncOutboxKey>;
  sync_record_versions!: Table<SyncRecordVersion, SyncOutboxKey>;
  sync_cursors!: Table<SyncCursor, string>;

  constructor(database_name: string) {
    super(database_name);

    define_sport_sync_schema_versions(this, TABLE_NAMES);
    register_sync_outbox_middleware(this);
  }
}

const DatabaseStatus = {
  UNINITIALIZED: "uninitialized",
  READY: "ready",
} as const;

type DatabaseState =
  | { status: typeof DatabaseStatus.UNINITIALIZED }
  | { status: typeof DatabaseStatus.READY; database: SportSyncDatabase };

let database_state: DatabaseState = { status: DatabaseStatus.UNINITIALIZED };

function open_database(): SportSyncDatabase {
  const database = new SportSyncDatabase(DATABASE_NAME);
  database_state = { status: DatabaseStatus.READY, database };
  return database;
}

export function get_database(): SportSyncDatabase {
  switch (database_state.status) {
    case DatabaseStatus.READY:
      return database_state.database;
    case DatabaseStatus.UNINITIALIZED:
      return open_database();
  }
}

function close_open_database(state: DatabaseState): boolean {
  switch (state.status) {
    case DatabaseStatus.READY:
      state.database.close();
      return true;
    case DatabaseStatus.UNINITIALIZED:
      return false;
  }
}

export async function reset_database(): Promise<SportSyncDatabase> {
  close_open_database(database_state);
  database_state = { status: DatabaseStatus.UNINITIALIZED };
  await Dexie.delete(DATABASE_NAME);
  return open_database();
}

export function create_sport_sync_database(
  database_name: string,
): SportSyncDatabase {
  return new SportSyncDatabase(database_name);
}

export type { SportSyncDatabase };
