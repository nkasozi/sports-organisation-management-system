import { describe, expect, it } from "vitest";

import schema from "../schema";
import {
  project_public_records,
  PUBLIC_RECORD_PROJECTIONS,
  PublicProjectionKind,
} from "./public_record_projection";
import { PUBLIC_TABLE_NAMES } from "./sync_validation";

const PERSONAL_FIELD_PATTERNS = [
  /email/,
  /phone/,
  /date_of_birth/,
  /emergency/,
  /medical/,
];

function is_personal_field(field_name: string): boolean {
  return PERSONAL_FIELD_PATTERNS.some((pattern) => pattern.test(field_name));
}

function get_schema_field_names(table_name: string): string[] {
  const table_definition = Reflect.get(schema.tables, table_name) as {
    validator: { fields: Record<string, unknown> };
  };
  return Object.keys(table_definition.validator.fields).sort();
}

describe("public record projections", () => {
  it("covers exactly the public tables", () => {
    expect(Object.keys(PUBLIC_RECORD_PROJECTIONS).sort()).toEqual(
      [...PUBLIC_TABLE_NAMES].sort(),
    );
  });

  it.each([...PUBLIC_TABLE_NAMES])(
    "classifies every %s schema field and exposes no personal fields",
    (table_name) => {
      const projection = PUBLIC_RECORD_PROJECTIONS[table_name];
      const schema_field_names = get_schema_field_names(table_name);
      switch (projection.kind) {
        case PublicProjectionKind.ALL_FIELDS:
          expect(schema_field_names.filter(is_personal_field)).toEqual([]);
          return;
        case PublicProjectionKind.FIELD_ALLOWLIST:
          expect(
            [...projection.public_fields, ...projection.private_fields].sort(),
          ).toEqual(schema_field_names);
          expect(
            projection.public_fields.filter((field_name) =>
              projection.private_fields.includes(field_name),
            ),
          ).toEqual([]);
          expect(projection.public_fields.filter(is_personal_field)).toEqual(
            [],
          );
          return;
      }
    },
  );

  it("strips private fields and keeps convex identifiers", () => {
    const [projected_record] = project_public_records("officials", [
      {
        _id: "officials_1",
        _creationTime: 1,
        local_id: "official_1",
        first_name: "Ref",
        email: "ref@example.com",
        notes: "internal",
      },
    ]);
    expect(projected_record).toEqual({
      _id: "officials_1",
      _creationTime: 1,
      local_id: "official_1",
      first_name: "Ref",
    });
  });

  it("strips organization contact details from anonymous reads", () => {
    const [projected_record] = project_public_records("organizations", [
      {
        local_id: "org_a",
        name: "Org A",
        contact_email: "info@example.com",
        contact_phone: "+256700000000",
      },
    ]);
    expect(projected_record).toEqual({ local_id: "org_a", name: "Org A" });
  });

  it("returns records unchanged for all-field tables", () => {
    const records = [{ local_id: "team_1", name: "Team" }];
    expect(project_public_records("teams", records)).toEqual(records);
  });
});
