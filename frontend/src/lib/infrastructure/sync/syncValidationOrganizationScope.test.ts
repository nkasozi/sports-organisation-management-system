import { describe, expect, it } from "vitest";

import type { SystemUserRecord } from "../../../../convex/lib/auth_middleware";
import { filter_records_by_organization_scope } from "../../../../convex/lib/sync_validation";

function build_mock_system_user(
  overrides: Partial<SystemUserRecord> = {},
): SystemUserRecord {
  return {
    _id: "mock_id" as SystemUserRecord["_id"],
    email: "test@example.com",
    role: "org_admin",
    organization_id: "org_123",
    status: "active",
    ...overrides,
  } as SystemUserRecord;
}

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

  it("org_admin sees only own org records, never wildcard records in tenant tables", () => {
    const caller = build_mock_system_user({ organization_id: "org_a" });
    const filtered = filter_records_by_organization_scope(
      all_records,
      caller,
      "teams",
      { organization_id: "org_a" },
    );
    expect(filtered).toHaveLength(1);
    expect(filtered).toContain(organization_a_record);
    expect(filtered).not.toContain(global_record);
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
