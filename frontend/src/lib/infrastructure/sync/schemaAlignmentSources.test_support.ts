import * as fs from "fs";
import * as path from "path";

const ENTITIES_DIR = path.resolve(__dirname, "../../core/entities");
const CONVEX_DIRECTORY = path.resolve(__dirname, "../../../../convex");

export const BASE_ENTITY_FIELDS = ["id", "created_at", "updated_at"];

const CONVEX_ONLY_FIELDS = ["local_id", "synced_at", "version"];

export const ENTITY_TO_TABLE_MAP = {
  Organization: "organizations",
  Competition: "competitions",
  Team: "teams",
  Player: "players",
  Official: "officials",
  Fixture: "fixtures",
  FixtureLineup: "fixture_lineups",
  FixtureDetailsSetup: "fixture_details_setups",
  Sport: "sports",
  TeamStaff: "team_staff",
  TeamStaffRole: "team_staff_roles",
  GameOfficialRole: "game_official_roles",
  Venue: "venues",
  JerseyColor: "jersey_colors",
  PlayerPosition: "player_positions",
  PlayerProfile: "player_profiles",
  TeamProfile: "team_profiles",
  ProfileLink: "profile_links",
  CalendarToken: "calendar_tokens",
  CompetitionFormat: "competition_formats",
  CompetitionTeam: "competition_teams",
  PlayerTeamMembership: "player_team_memberships",
  Activity: "activities",
  ActivityCategory: "activity_categories",
  AuditLog: "audit_logs",
  SystemUser: "system_users",
  IdentificationType: "identification_types",
  Identification: "identifications",
  Qualification: "qualifications",
  GameEventLog: "game_event_logs",
  Gender: "genders",
  LiveGameLog: "live_game_logs",
  OfficialAssociatedTeam: "official_associated_teams",
  PlayerTeamTransferHistory: "player_team_transfer_histories",
  GameEventType: "game_event_types",
  CompetitionStage: "competition_stages",
  OfficialPerformanceRating: "official_performance_ratings",
  OrganizationSettings: "organization_settings",
} as Record<string, string>;

export function read_convex_schema_content(): string {
  return fs
    .readdirSync(CONVEX_DIRECTORY)
    .filter((file_name) => /^schema.*\.ts$/.test(file_name))
    .sort()
    .map((file_name) =>
      fs.readFileSync(path.join(CONVEX_DIRECTORY, file_name), "utf-8"),
    )
    .join("\n");
}
export function get_entity_files(): {
  entity_name: string;
  file_path: string;
}[] {
  const entity_names = new Set(Object.keys(ENTITY_TO_TABLE_MAP));
  const all_files = fs.readdirSync(ENTITIES_DIR);

  return all_files
    .filter(
      (file) =>
        file.endsWith(".ts") &&
        !file.endsWith(".test.ts") &&
        entity_names.has(file.replace(".ts", "")),
    )
    .map((file) => ({
      entity_name: file.replace(".ts", ""),
      file_path: path.join(ENTITIES_DIR, file),
    }));
}

export function read_entity_interface_content(
  entity_name: string,
  file_path: string,
): string {
  const content = fs.readFileSync(file_path, "utf-8");
  const has_interface = new RegExp(
    `export\\s+interface\\s+${entity_name}\\s+extends\\s+BaseEntity\\s*\\{`,
  ).test(content);
  if (has_interface) return content;

  const types_file_path = path.join(ENTITIES_DIR, `${entity_name}Types.ts`);
  if (fs.existsSync(types_file_path))
    return fs.readFileSync(types_file_path, "utf-8");

  return content;
}
