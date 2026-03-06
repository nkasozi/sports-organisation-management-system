import { describe, it, expect } from "vitest";
import { resolve_organization_id_for_role } from "./InBrowserSystemUserRepository";

describe("resolve_organization_id_for_role", () => {
  it("returns all-orgs scope for super_admin regardless of input", () => {
    expect(resolve_organization_id_for_role("", "super_admin")).toBe("*");
    expect(resolve_organization_id_for_role("org_123", "super_admin")).toBe(
      "*",
    );
  });

  it("returns provided organization_id for org_admin", () => {
    expect(resolve_organization_id_for_role("org_123", "org_admin")).toBe(
      "org_123",
    );
  });

  it("returns provided organization_id for officials_manager", () => {
    expect(
      resolve_organization_id_for_role("org_456", "officials_manager"),
    ).toBe("org_456");
  });

  it("returns provided organization_id for team_manager", () => {
    expect(resolve_organization_id_for_role("org_789", "team_manager")).toBe(
      "org_789",
    );
  });

  it("returns provided organization_id for official", () => {
    expect(resolve_organization_id_for_role("org_abc", "official")).toBe(
      "org_abc",
    );
  });

  it("returns provided organization_id for player", () => {
    expect(resolve_organization_id_for_role("org_def", "player")).toBe(
      "org_def",
    );
  });

  it("returns empty string for non-super_admin with empty organization_id", () => {
    expect(resolve_organization_id_for_role("", "org_admin")).toBe("");
    expect(resolve_organization_id_for_role("", "team_manager")).toBe("");
    expect(resolve_organization_id_for_role("", "player")).toBe("");
  });
});
