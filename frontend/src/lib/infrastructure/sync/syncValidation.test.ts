import { describe, expect, it } from "vitest";

import {
  ALLOWED_SYNC_TABLES,
  get_entity_type_for_table,
  is_global_record,
  is_global_table,
  validate_table_name,
} from "../../../../convex/lib/sync_validation";

describe("validate_table_name", () => {
  it("accepts all allowed sync tables", () => {
    for (const table_name of ALLOWED_SYNC_TABLES) {
      const result = validate_table_name(table_name);
      expect(result.success).toBe(true);
    }
  });

  it("accepts system_users table", () => {
    const result = validate_table_name("system_users");
    expect(result.success).toBe(true);
  });

  it("accepts competition_stages table", () => {
    const result = validate_table_name("competition_stages");
    expect(result.success).toBe(true);
  });

  it("accepts organization_settings table", () => {
    const result = validate_table_name("organization_settings");
    expect(result.success).toBe(true);
  });

  it("rejects audit_logs table", () => {
    const result = validate_table_name("audit_logs");
    expect(result.success).toBe(false);
  });

  it("rejects empty string", () => {
    const result = validate_table_name("");
    expect(result.success).toBe(false);
  });

  it("rejects arbitrary string injection attempts", () => {
    const injection_attempts = [
      "sidebar_menu_items",
      "sync_metadata",
      "'; DROP TABLE users; --",
      "system_users; SELECT * FROM",
      "__proto__",
      "constructor",
    ];

    for (const attempt of injection_attempts) {
      const result = validate_table_name(attempt);
      expect(result.success).toBe(false);
    }
  });

  it("returns the table name as typed data on success", () => {
    const result = validate_table_name("teams");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe("teams");
    }
  });
});

describe("get_entity_type_for_table", () => {
  it("maps teams to team", () => {
    expect(get_entity_type_for_table("teams")).toBe("team");
  });

  it("maps organizations to organization", () => {
    expect(get_entity_type_for_table("organizations")).toBe("organization");
  });

  it("maps player_team_memberships to playerteammembership", () => {
    expect(get_entity_type_for_table("player_team_memberships")).toBe(
      "playerteammembership",
    );
  });

  it("maps fixture_details_setups to fixturedetailssetup", () => {
    expect(get_entity_type_for_table("fixture_details_setups")).toBe(
      "fixturedetailssetup",
    );
  });

  it("returns the input for unknown tables as fallback", () => {
    expect(get_entity_type_for_table("unknown_table")).toBe("unknown_table");
  });
});

describe("is_global_table", () => {
  it("returns true for sports", () => {
    expect(is_global_table("sports")).toBe(true);
  });

  it("returns true for genders", () => {
    expect(is_global_table("genders")).toBe(true);
  });

  it("returns false for teams", () => {
    expect(is_global_table("teams")).toBe(false);
  });

  it("returns false for organizations", () => {
    expect(is_global_table("organizations")).toBe(false);
  });
});

describe("is_global_record", () => {
  it("returns true when organization_id is undefined", () => {
    expect(is_global_record({ name: "test" })).toBe(true);
  });

  it("returns true when organization_id is missing", () => {
    expect(is_global_record({ organization_id: JSON.parse("null") })).toBe(
      true,
    );
  });

  it("returns true when organization_id is wildcard", () => {
    expect(is_global_record({ organization_id: "*" })).toBe(true);
  });

  it("returns true when organization_id is empty string", () => {
    expect(is_global_record({ organization_id: "" })).toBe(true);
  });

  it("returns false when organization_id is a specific value", () => {
    expect(is_global_record({ organization_id: "org_123" })).toBe(false);
  });
});
