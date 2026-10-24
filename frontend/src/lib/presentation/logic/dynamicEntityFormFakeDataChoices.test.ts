import { describe, expect, it } from "vitest";

import { build_dynamic_form_fake_data_state } from "./dynamicEntityFormLocalActions";

const team_metadata = {
  entity_name: "team",
  fields: [
    {
      field_name: "name",
      display_name: "Name",
      field_type: "string",
      is_required: true,
      is_read_only: false,
    },
    {
      field_name: "organization_id",
      display_name: "Organization",
      field_type: "foreign_key",
      is_required: true,
      is_read_only: false,
    },
    {
      field_name: "home_venue_id",
      display_name: "Home Venue",
      field_type: "foreign_key",
      is_required: false,
      is_read_only: false,
    },
    {
      field_name: "status",
      display_name: "Status",
      field_type: "enum",
      enum_values: ["disqualified", "inactive", "active"],
      is_required: true,
      is_read_only: false,
    },
  ],
};

function fill(
  form_data: Record<string, unknown>,
  locked: string[] = [],
): Record<string, unknown> {
  return build_dynamic_form_fake_data_state(
    team_metadata as never,
    false,
    {
      form_data,
      validation_errors: {},
      foreign_key_options: {
        organization_id: [{ id: "org_1" }, { id: "org_2" }],
        home_venue_id: [{ id: "venue_1" }],
      },
    } as never,
    new Set(locked),
  ).form_data;
}

describe("fake data choices for dropdowns", () => {
  it("picks an existing record for an empty required dropdown", () => {
    expect(["org_1", "org_2"]).toContain(fill({}).organization_id);
  });

  it("leaves optional dropdowns for the user", () => {
    expect(fill({}).home_venue_id ?? "").toBe("");
  });

  it("keeps a dropdown the user already chose or that is locked", () => {
    expect(fill({ organization_id: "org_2" }).organization_id).toBe("org_2");
    expect(
      fill({ organization_id: "" }, ["organization_id"]).organization_id,
    ).toBe("");
  });

  it("chooses an active status for a new record", () => {
    expect(fill({}).status).toBe("active");
  });
});
