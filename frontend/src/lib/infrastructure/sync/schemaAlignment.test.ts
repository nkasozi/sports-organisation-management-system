import { describe, expect, it } from "vitest";
import * as fs from "fs";
import * as path from "path";

const ENTITIES_DIR = path.resolve(__dirname, "../../core/entities");

const CONVEX_SCHEMA_PATH = path.resolve(
  __dirname,
  "../../../../convex/schema.ts",
);

const BASE_ENTITY_FIELDS = ["id", "created_at", "updated_at"];

const CONVEX_ONLY_FIELDS = ["local_id", "synced_at", "version"];

const ENTITY_TO_TABLE_MAP: Record<string, string> = {
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
};

function extract_interface_fields(file_content: string): string[] {
  const interface_start_pattern =
    /export\s+interface\s+\w+\s+extends\s+BaseEntity\s*\{/g;
  const match = interface_start_pattern.exec(file_content);

  if (!match) return [];

  const content_start = match.index + match[0].length;
  let brace_depth = 1;
  let position = content_start;

  while (position < file_content.length && brace_depth > 0) {
    const char = file_content[position];

    switch (char) {
      case "{":
        brace_depth++;
        break;
      case "}":
        brace_depth--;
        break;
    }

    position++;
  }

  const interface_body = file_content.slice(content_start, position - 1);
  const field_pattern = /^\s+(\w+)\??:\s/gm;
  const fields: string[] = [];
  let field_match;

  while ((field_match = field_pattern.exec(interface_body)) !== null) {
    fields.push(field_match[1]);
  }

  return fields;
}

function extract_table_block(
  schema_content: string,
  table_name: string,
): string | null {
  const start_marker = `${table_name}: defineTable({`;
  const start_index = schema_content.indexOf(start_marker);

  if (start_index === -1) return null;

  const content_start = start_index + start_marker.length;
  let brace_depth = 1;
  let position = content_start;

  while (position < schema_content.length && brace_depth > 0) {
    const char = schema_content[position];

    switch (char) {
      case "{":
        brace_depth++;
        break;
      case "}":
        brace_depth--;
        break;
    }

    position++;
  }

  return schema_content.slice(content_start, position - 1);
}

function extract_convex_table_fields(table_block: string): string[] {
  const fields: string[] = [];
  let brace_depth = 0;

  const lines = table_block.split("\n");

  for (const line of lines) {
    for (const char of line) {
      switch (char) {
        case "{":
          brace_depth++;
          break;
        case "}":
          brace_depth--;
          break;
      }
    }

    if (brace_depth !== 0) continue;

    const field_match = line.match(/^\s+(\w+):\s+v\./);

    if (field_match) {
      fields.push(field_match[1]);
    }
  }

  const has_sync_metadata = table_block.includes("...sync_metadata_fields");
  const has_timestamp_fields = table_block.includes("...timestamp_fields");

  if (has_sync_metadata) {
    fields.push("id", "local_id", "synced_at", "version");
  }

  if (has_timestamp_fields) {
    fields.push("created_at", "updated_at");
  }

  return fields;
}

function find_missing_fields(
  local_fields: string[],
  convex_fields: string[],
): string[] {
  const convex_field_set = new Set(convex_fields);

  return local_fields.filter((field) => !convex_field_set.has(field));
}

function get_entity_files(): { entity_name: string; file_path: string }[] {
  const skip_files = new Set(["BaseEntity.ts", "GameEntities.ts", "index.ts"]);

  const all_files = fs.readdirSync(ENTITIES_DIR);

  return all_files
    .filter(
      (file) =>
        file.endsWith(".ts") &&
        !file.endsWith(".test.ts") &&
        !skip_files.has(file),
    )
    .map((file) => ({
      entity_name: file.replace(".ts", ""),
      file_path: path.join(ENTITIES_DIR, file),
    }));
}

describe("extract_interface_fields", () => {
  it("should extract simple field names from an interface extending BaseEntity", () => {
    const sample_interface = `
      export interface Player extends BaseEntity {
        first_name: string;
        last_name: string;
        email?: string;
        height_cm: number | null;
      }
    `;

    const fields = extract_interface_fields(sample_interface);

    expect(fields).toEqual(["first_name", "last_name", "email", "height_cm"]);
  });

  it("should return empty array when no interface extending BaseEntity found", () => {
    const no_interface = "const x = 5;";

    const fields = extract_interface_fields(no_interface);

    expect(fields).toEqual([]);
  });

  it("should only extract fields from the BaseEntity-extending interface, not nested types", () => {
    const file_with_nested = `
      export interface SomeNestedType {
        nested_field_one: string;
        nested_field_two: number;
      }

      export interface Activity extends BaseEntity {
        title: string;
        team_ids: string[];
        reminders: SomeNestedType[];
        status: ActivityStatus;
      }
    `;

    const fields = extract_interface_fields(file_with_nested);

    expect(fields).toEqual(["title", "team_ids", "reminders", "status"]);
  });
});

describe("extract_convex_table_fields", () => {
  it("should extract field names from a convex table block", () => {
    const table_block = `
    ...sync_metadata_fields,
    name: v.string(),
    description: v.optional(v.string()),
    status: v.optional(v.string()),
    ...timestamp_fields,
    `;

    const fields = extract_convex_table_fields(table_block);

    expect(fields).toContain("name");
    expect(fields).toContain("description");
    expect(fields).toContain("status");
    expect(fields).toContain("local_id");
    expect(fields).toContain("synced_at");
    expect(fields).toContain("version");
    expect(fields).toContain("created_at");
    expect(fields).toContain("updated_at");
  });

  it("should not include spread field names when spread not present", () => {
    const table_block = `
    name: v.string(),
    code: v.optional(v.string()),
    `;

    const fields = extract_convex_table_fields(table_block);

    expect(fields).toEqual(["name", "code"]);
  });
});

describe("extract_table_block", () => {
  it("should extract the table definition block for a given table name", () => {
    const schema_content = `
      genders: defineTable({
        ...sync_metadata_fields,
        name: v.string(),
        status: v.optional(v.string()),
        ...timestamp_fields,
      }).index("by_local_id", ["local_id"]),
    `;

    const block = extract_table_block(schema_content, "genders");

    expect(block).not.toBeNull();
    expect(block).toContain("name: v.string()");
    expect(block).toContain("status: v.optional(v.string())");
  });

  it("should handle nested objects without truncating early", () => {
    const schema_content = `
      activities: defineTable({
        ...sync_metadata_fields,
        title: v.string(),
        recurrence: v.optional(v.object({
          pattern: v.string(),
        })),
        ...timestamp_fields,
      }).index("by_local_id", ["local_id"]),
    `;

    const block = extract_table_block(schema_content, "activities");

    expect(block).not.toBeNull();
    expect(block).toContain("...timestamp_fields");
  });

  it("should return null for a table that does not exist", () => {
    const schema_content = `
      genders: defineTable({
        name: v.string(),
      }),
    `;

    const block = extract_table_block(schema_content, "unknown_table");

    expect(block).toBeNull();
  });
});

describe("find_missing_fields", () => {
  it("should return fields present in local but not in convex", () => {
    const local_fields = ["name", "email", "phone", "address"];
    const convex_fields = ["name", "email"];

    const missing = find_missing_fields(local_fields, convex_fields);

    expect(missing).toEqual(["phone", "address"]);
  });

  it("should return empty array when all fields are present", () => {
    const local_fields = ["name", "email"];
    const convex_fields = ["name", "email", "extra_field"];

    const missing = find_missing_fields(local_fields, convex_fields);

    expect(missing).toEqual([]);
  });
});

describe("Schema Alignment: Local Entities vs Convex Schema", () => {
  const schema_content = fs.readFileSync(CONVEX_SCHEMA_PATH, "utf-8");
  const entity_files = get_entity_files();

  it("should have a table mapping for every entity file", () => {
    const unmapped_entities = entity_files
      .filter((ef) => !ENTITY_TO_TABLE_MAP[ef.entity_name])
      .map((ef) => ef.entity_name);

    expect(
      unmapped_entities,
      `These entities have no Convex table mapping: ${unmapped_entities.join(", ")}`,
    ).toEqual([]);
  });

  it("should have a Convex table definition for every mapped entity", () => {
    const missing_tables: string[] = [];

    for (const [entity_name, table_name] of Object.entries(
      ENTITY_TO_TABLE_MAP,
    )) {
      const table_block = extract_table_block(schema_content, table_name);

      if (!table_block) {
        missing_tables.push(`${entity_name} → ${table_name}`);
      }
    }

    expect(
      missing_tables,
      `These entity→table mappings have no Convex table definition: ${missing_tables.join(", ")}`,
    ).toEqual([]);
  });

  for (const entity_file of entity_files) {
    const table_name = ENTITY_TO_TABLE_MAP[entity_file.entity_name];

    if (!table_name) continue;

    it(`${entity_file.entity_name} fields should all exist in Convex table '${table_name}'`, () => {
      const entity_content = fs.readFileSync(entity_file.file_path, "utf-8");
      const local_fields = extract_interface_fields(entity_content);

      const table_block = extract_table_block(schema_content, table_name);
      expect(
        table_block,
        `Convex table '${table_name}' not found in schema`,
      ).not.toBeNull();

      const convex_fields = extract_convex_table_fields(table_block!);

      const all_local_fields = [...BASE_ENTITY_FIELDS, ...local_fields];

      const missing_fields = find_missing_fields(
        all_local_fields,
        convex_fields,
      );

      expect(
        missing_fields,
        `Entity '${entity_file.entity_name}' has fields missing from Convex table '${table_name}': [${missing_fields.join(", ")}]. ` +
          `Add these fields to the '${table_name}' table in convex/schema.ts`,
      ).toEqual([]);
    });
  }
});
