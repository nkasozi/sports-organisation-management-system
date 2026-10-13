import * as fs from "fs";
import * as path from "path";
import { describe, expect, it } from "vitest";

import {
  extract_convex_table_fields,
  extract_interface_fields,
  extract_table_block,
  find_missing_fields,
} from "./schemaAlignmentParsers.test_support";
import {
  BASE_ENTITY_FIELDS,
  ENTITY_TO_TABLE_MAP,
  get_entity_files,
  read_convex_schema_content,
  read_entity_interface_content,
} from "./schemaAlignmentSources.test_support";

describe("Schema Alignment: Local Entities vs Convex Schema", () => {
  const schema_content = read_convex_schema_content();
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
    const missing_tables = [] as string[];

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
      const entity_content = read_entity_interface_content(
        entity_file.entity_name,
        entity_file.file_path,
      );
      const local_fields = extract_interface_fields(entity_content);

      const table_block = extract_table_block(schema_content, table_name);
      expect(
        table_block,
        `Convex table '${table_name}' not found in schema`,
      ).not.toBeNull();

      const convex_fields = extract_convex_table_fields(table_block ?? "");

      const all_local_fields = [...BASE_ENTITY_FIELDS, ...local_fields];

      const missing_fields = find_missing_fields(
        all_local_fields,
        convex_fields,
      );

      expect(
        missing_fields,
        `Entity '${entity_file.entity_name}' has fields missing from Convex table '${table_name}': [${missing_fields.join(", ")}]. ` +
          `Add these fields to the '${table_name}' table in convex/schema*.ts`,
      ).toEqual([]);
    });
  }
});

describe("TABLE_NAMES completeness: every synced table reachable via get_table_from_database", () => {
  const sync_service_path = path.resolve(__dirname, "./convexSyncService.ts");
  const sync_service_content = fs.readFileSync(sync_service_path, "utf-8");

  function extract_table_names_array(source: string): string[] {
    const array_match = source.match(
      /export const TABLE_NAMES\s*=\s*\[([\s\S]*?)\]\s*as const/,
    );
    if (!array_match) return [];
    return [...array_match[1].matchAll(/"([a-z_]+)"/g)].map((m) => m[1]);
  }

  function extract_table_map_keys(source: string): string[] {
    const map_match = source.match(
      /const table_map[\s\S]*?=\s*\{([\s\S]*?)\};\s*\n\s*return table_map/,
    );
    if (!map_match) return [];
    return [...map_match[1].matchAll(/^\s+([a-z_]+):\s+database\./gm)].map(
      (m) => m[1],
    );
  }

  it("every TABLE_NAMES entry has a matching key in get_table_from_database's table_map", () => {
    const table_names = extract_table_names_array(sync_service_content);
    const table_map_keys = new Set(
      extract_table_map_keys(sync_service_content),
    );

    const missing_from_map = table_names.filter(
      (name) => !table_map_keys.has(name),
    );

    expect(
      missing_from_map,
      `These TABLE_NAMES entries are missing from get_table_from_database's table_map: [${missing_from_map.join(", ")}]. ` +
        `Add them to the table_map inside get_table_from_database in convexSyncService.ts`,
    ).toEqual([]);
  });

  it("every table_map key in get_table_from_database is a recognised TABLE_NAMES entry", () => {
    const table_names = new Set(
      extract_table_names_array(sync_service_content),
    );
    const table_map_keys = extract_table_map_keys(sync_service_content);

    const orphaned_map_keys = table_map_keys.filter(
      (key) => !table_names.has(key),
    );

    expect(
      orphaned_map_keys,
      `These table_map keys are not in TABLE_NAMES and are dead code: [${orphaned_map_keys.join(", ")}]. ` +
        `Either add them to TABLE_NAMES or remove them from the table_map in convexSyncService.ts`,
    ).toEqual([]);
  });
});
