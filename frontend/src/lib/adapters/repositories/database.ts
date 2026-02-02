import Dexie, { type Table } from "dexie";
import type { Organization } from "../../core/entities/Organization";
import type { Competition } from "../../core/entities/Competition";
import type { Team } from "../../core/entities/Team";
import type { Player } from "../../core/entities/Player";
import type { Official } from "../../core/entities/Official";
import type { Fixture } from "../../core/entities/Fixture";
import type { Sport } from "../../core/entities/Sport";
import type { TeamStaff } from "../../core/entities/TeamStaff";
import type { TeamStaffRole } from "../../core/entities/TeamStaffRole";
import type { GameOfficialRole } from "../../core/entities/GameOfficialRole";
import type { Venue } from "../../core/entities/Venue";
import type { JerseyColor } from "../../core/entities/JerseyColor";
import type { PlayerPosition } from "../../core/entities/PlayerPosition";
import type { PlayerProfile } from "../../core/entities/PlayerProfile";
import type { TeamProfile } from "../../core/entities/TeamProfile";
import type { ProfileLink } from "../../core/entities/ProfileLink";
import type { CalendarToken } from "../../core/entities/CalendarToken";
import type { CompetitionFormat } from "../../core/entities/CompetitionFormat";
import type { CompetitionTeam } from "../../core/entities/CompetitionTeam";
import type { PlayerTeamMembership } from "../../core/entities/PlayerTeamMembership";
import type { FixtureDetailsSetup } from "../../core/entities/FixtureDetailsSetup";
import type { FixtureLineup } from "../../core/entities/FixtureLineup";
import type { Activity } from "../../core/entities/Activity";
import type { ActivityCategory } from "../../core/entities/ActivityCategory";
import type { AuditLog } from "../../core/entities/AuditLog";
import type { SystemUser } from "../../core/entities/SystemUser";
import type { IdentificationType } from "../../core/entities/IdentificationType";
import type { Identification } from "../../core/entities/Identification";
import type { Qualification } from "../../core/entities/Qualification";
import type { GameEventType } from "../../core/entities/GameEventType";

const DATABASE_NAME = "SportsOrgManagementDB";
const DATABASE_VERSION = 1;

class SportsOrgDatabase extends Dexie {
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
  identifications!: Table<Identification, string>;
  qualifications!: Table<Qualification, string>;
  game_event_types!: Table<GameEventType, string>;

  constructor() {
    super(DATABASE_NAME);

    this.version(DATABASE_VERSION).stores({
      organizations: "id, name, sport_id, created_at, updated_at",
      competitions:
        "id, name, organization_id, format_id, status, start_date, end_date, created_at",
      teams: "id, name, organization_id, created_at",
      players: "id, first_name, last_name, email, date_of_birth, created_at",
      officials: "id, first_name, last_name, email, created_at",
      fixtures:
        "id, competition_id, home_team_id, away_team_id, venue_id, scheduled_date, status, created_at",
      sports: "id, name, created_at",
      team_staff: "id, team_id, role_id, first_name, last_name, created_at",
      team_staff_roles: "id, name, sport_id, created_at",
      game_official_roles: "id, name, sport_id, created_at",
      venues: "id, name, city, country, created_at",
      jersey_colors: "id, name, hex_code, created_at",
      player_positions: "id, name, abbreviation, sport_id, created_at",
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
      system_users: "id, email, role, created_at",
      identification_types: "id, name, country, created_at",
      identifications:
        "id, entity_type, entity_id, identification_type_id, created_at",
      qualifications: "id, entity_type, entity_id, name, created_at",
      game_event_types: "id, name, sport_id, category, created_at",
    });
  }
}

let database_instance: SportsOrgDatabase | null = null;

export function get_database(): SportsOrgDatabase {
  if (!database_instance) {
    database_instance = new SportsOrgDatabase();
  }
  return database_instance;
}

export function reset_database(): Promise<void> {
  if (database_instance) {
    return database_instance.delete().then(() => {
      database_instance = new SportsOrgDatabase();
    });
  }
  return Promise.resolve();
}

export type { SportsOrgDatabase };
