import { describe, expect, it } from "vitest";

import {
  validate_table_name,
  get_entity_type_for_table,
  is_global_table,
  is_global_record,
  validate_record_organization_ownership,
  filter_records_by_organization_scope,
  ALLOWED_SYNC_TABLES,
} from "../../../../convex/lib/sync_validation";
import type { SystemUserRecord } from "../../../../convex/lib/auth_middleware";

function build_mock_system_user(
  overrides: Partial<SystemUserRecord> = {},
): SystemUserRecord {
  return {
    _id: "mock_id" as any,
    email: "test@example.com",
    role: "org_admin",
    organization_id: "org_123",
    status: "active",
    ...overrides,
  };
}

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

  it("returns true when organization_id is null", () => {
    expect(is_global_record({ organization_id: null })).toBe(true);
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

describe("validate_record_organization_ownership", () => {
  it("allows super admin to write to any organization", () => {
    const caller = build_mock_system_user({ organization_id: "*" });
    const record = { organization_id: "org_other" };
    const result = validate_record_organization_ownership(
      record,
      caller,
      "teams",
    );
    expect(result.success).toBe(true);
  });

  it("allows writes to global tables regardless of org", () => {
    const caller = build_mock_system_user({ organization_id: "org_123" });
    const record = { organization_id: "org_other" };
    const result = validate_record_organization_ownership(
      record,
      caller,
      "sports",
    );
    expect(result.success).toBe(true);
  });

  it("allows writes when record org matches caller org", () => {
    const caller = build_mock_system_user({ organization_id: "org_123" });
    const record = { organization_id: "org_123" };
    const result = validate_record_organization_ownership(
      record,
      caller,
      "teams",
    );
    expect(result.success).toBe(true);
  });

  it("rejects writes when record org differs from caller org", () => {
    const caller = build_mock_system_user({ organization_id: "org_123" });
    const record = { organization_id: "org_456" };
    const result = validate_record_organization_ownership(
      record,
      caller,
      "teams",
    );
    expect(result.success).toBe(false);
  });

  it("allows writes for global records without org_id", () => {
    const caller = build_mock_system_user({ organization_id: "org_123" });
    const record = { name: "global thing" };
    const result = validate_record_organization_ownership(
      record,
      caller,
      "teams",
    );
    expect(result.success).toBe(true);
  });
});

describe("filter_records_by_organization_scope", () => {
  const organization_a_record = {
    local_id: "r1",
    organization_id: "org_a",
    name: "Org A Record",
  };
  const organization_b_record = {
    local_id: "r2",
    organization_id: "org_b",
    name: "Org B Record",
  };
  const global_record = { local_id: "r3", name: "Global Record" };
  const all_records = [
    organization_a_record,
    organization_b_record,
    global_record,
  ];

  it("super admin sees all records", () => {
    const caller = build_mock_system_user({ organization_id: "*" });
    const filtered = filter_records_by_organization_scope(
      all_records,
      caller,
      "teams",
      {},
    );
    expect(filtered).toHaveLength(3);
  });

  it("org_admin sees only own org records plus globals", () => {
    const caller = build_mock_system_user({ organization_id: "org_a" });
    const filtered = filter_records_by_organization_scope(
      all_records,
      caller,
      "teams",
      { organization_id: "org_a" },
    );
    expect(filtered).toHaveLength(2);
    expect(filtered).toContain(organization_a_record);
    expect(filtered).toContain(global_record);
    expect(filtered).not.toContain(organization_b_record);
  });

  it("returns all records for global tables regardless of org", () => {
    const caller = build_mock_system_user({ organization_id: "org_a" });
    const filtered = filter_records_by_organization_scope(
      all_records,
      caller,
      "sports",
      { organization_id: "org_a" },
    );
    expect(filtered).toHaveLength(3);
  });

  it("filters organizations table by local_id match", () => {
    const organizations = [
      { local_id: "org_a", name: "Org A" },
      { local_id: "org_b", name: "Org B" },
    ];
    const caller = build_mock_system_user({ organization_id: "org_a" });
    const filtered = filter_records_by_organization_scope(
      organizations,
      caller,
      "organizations",
      { organization_id: "org_a" },
    );
    expect(filtered).toHaveLength(1);
    expect(filtered[0].local_id).toBe("org_a");
  });

  it("applies team_id filtering when scope has team_id", () => {
    const records_with_teams = [
      { local_id: "r1", organization_id: "org_a", team_id: "team_1" },
      { local_id: "r2", organization_id: "org_a", team_id: "team_2" },
      { local_id: "r3", organization_id: "org_b", team_id: "team_3" },
    ];
    const caller = build_mock_system_user({
      organization_id: "org_a",
      team_id: "team_1",
    });
    const filtered = filter_records_by_organization_scope(
      records_with_teams,
      caller,
      "players",
      { organization_id: "org_a", team_id: "team_1" },
    );
    expect(filtered).toHaveLength(1);
    expect(filtered[0].local_id).toBe("r1");
  });
});
