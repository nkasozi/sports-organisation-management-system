import { describe, expect, it } from "vitest";

const SUPER_ADMIN_ROLE = "super_admin";

type RoleHierarchyLevel = number;

const ROLE_HIERARCHY = {
  super_admin: 100,
  org_admin: 80,
  officials_manager: 60,
  team_manager: 50,
  official: 30,
  player: 20,
  public_viewer: 10,
} as Record<string, RoleHierarchyLevel>;

function can_caller_assign_role(
  caller_role: string,
  target_role: string,
): boolean {
  const caller_level = ROLE_HIERARCHY[caller_role];
  const target_level = ROLE_HIERARCHY[target_role];
  if (caller_level === void 0 || target_level === void 0) {
    return false;
  }
  return caller_level > target_level;
}

function is_bootstrap_mode(existing_super_admin_count: number): boolean {
  return existing_super_admin_count === 0;
}

function can_seed_super_admin(
  caller_role: string | undefined,
  existing_super_admin_count: number,
): boolean {
  if (is_bootstrap_mode(existing_super_admin_count)) {
    return true;
  }
  return caller_role === SUPER_ADMIN_ROLE;
}

describe("can_caller_assign_role", () => {
  it("super_admin can assign org_admin", () => {
    expect(can_caller_assign_role("super_admin", "org_admin")).toBe(true);
  });

  it("super_admin can assign any lower role", () => {
    expect(can_caller_assign_role("super_admin", "team_manager")).toBe(true);
    expect(can_caller_assign_role("super_admin", "player")).toBe(true);
  });

  it("super_admin cannot assign super_admin", () => {
    expect(can_caller_assign_role("super_admin", "super_admin")).toBe(false);
  });

  it("org_admin cannot assign super_admin", () => {
    expect(can_caller_assign_role("org_admin", "super_admin")).toBe(false);
  });

  it("org_admin cannot assign org_admin", () => {
    expect(can_caller_assign_role("org_admin", "org_admin")).toBe(false);
  });

  it("org_admin can assign team_manager", () => {
    expect(can_caller_assign_role("org_admin", "team_manager")).toBe(true);
  });

  it("team_manager cannot assign org_admin", () => {
    expect(can_caller_assign_role("team_manager", "org_admin")).toBe(false);
  });

  it("player cannot assign any role", () => {
    expect(can_caller_assign_role("player", "public_viewer")).toBe(true);
    expect(can_caller_assign_role("player", "player")).toBe(false);
    expect(can_caller_assign_role("player", "team_manager")).toBe(false);
  });

  it("rejects unknown roles", () => {
    expect(can_caller_assign_role("unknown", "player")).toBe(false);
    expect(can_caller_assign_role("org_admin", "unknown")).toBe(false);
  });
});

describe("can_seed_super_admin", () => {
  it("allows seed in bootstrap mode with no existing super admins", () => {
    expect(can_seed_super_admin(void 0, 0)).toBe(true);
  });

  it("allows existing super_admin to seed another", () => {
    expect(can_seed_super_admin("super_admin", 1)).toBe(true);
  });

  it("rejects org_admin from seeding when super admins exist", () => {
    expect(can_seed_super_admin("org_admin", 1)).toBe(false);
  });

  it("rejects unauthenticated user when super admins exist", () => {
    expect(can_seed_super_admin(void 0, 1)).toBe(false);
  });

  it("rejects player from seeding when super admins exist", () => {
    expect(can_seed_super_admin("player", 2)).toBe(false);
  });
});
