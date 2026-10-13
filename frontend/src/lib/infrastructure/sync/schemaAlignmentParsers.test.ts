import { describe, expect, it } from "vitest";

import {
  extract_convex_table_fields,
  extract_interface_fields,
  extract_table_block,
  find_missing_fields,
} from "./schemaAlignmentParsers.test_support";

describe("extract_interface_fields", () => {
  it("should extract simple field names from an interface extending BaseEntity", () => {
    const sample_interface = `
      export interface Player extends BaseEntity {
        first_name: string;
        last_name: string;
        email?: string;
        height_cm: number;
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

  it("should return undefined for a table that does not exist", () => {
    const schema_content = `
      genders: defineTable({
        name: v.string(),
      }),
    `;

    const block = extract_table_block(schema_content, "unknown_table");

    expect(block).toBeUndefined();
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
