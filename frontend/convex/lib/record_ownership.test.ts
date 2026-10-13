import { describe, expect, it } from "vitest";

import type { Id } from "../_generated/dataModel";
import type { SystemUserRecord } from "./auth_middleware";
import {
  type CallerOwnership,
  create_database_ownership_loader,
  load_caller_ownership,
  OwnershipRoleKind,
} from "./caller_ownership";
import { create_fake_convex_context } from "./fake_convex_context.test_support";
import { ANONYMOUS_IDENTITY } from "./fake_identity.test_support";
import { is_record_owned_by_caller } from "./record_ownership";

function caller(overrides: Partial<SystemUserRecord>): SystemUserRecord {
  return {
    _id: "system_users_1" as Id<"system_users">,
    local_id: "user_1",
    email: "user@example.com",
    role: "player",
    organization_id: "org_a",
    ...overrides,
  };
}

const TABLES = {
  player_team_memberships: [
    { local_id: "m1", team_id: "team_a", player_id: "player_a" },
    {
      local_id: "m2",
      team_id: "team_a",
      player_id: "player_old",
      status: "ended",
    },
    { local_id: "m3", team_id: "team_b", player_id: "player_b" },
  ],
  team_staff: [{ local_id: "staff_a", team_id: "team_a" }],
  team_profiles: [{ local_id: "team_profile_a", team_id: "team_a" }],
  player_profiles: [
    { local_id: "player_profile_a", player_id: "player_a" },
    { local_id: "player_profile_b", player_id: "player_b" },
  ],
};

async function load(subject: SystemUserRecord): Promise<CallerOwnership> {
  const context = create_fake_convex_context({
    identity: ANONYMOUS_IDENTITY,
    tables: TABLES,
  });
  return load_caller_ownership(
    create_database_ownership_loader(context as never),
    subject,
  );
}

describe("load_caller_ownership", () => {
  it("collects a team manager's active team members, staff and profiles", async () => {
    const ownership = await load(
      caller({ role: "team_manager", team_id: "team_a" }),
    );
    expect(ownership.role_kind).toBe(OwnershipRoleKind.TEAM_MANAGER);
    expect([...ownership.player_ids]).toEqual(["player_a"]);
    expect([...ownership.team_staff_ids]).toEqual(["staff_a"]);
    expect([...ownership.team_profile_ids]).toEqual(["team_profile_a"]);
    expect([...ownership.player_profile_ids]).toEqual(["player_profile_a"]);
  });

  it("scopes a player to their own player and profile", async () => {
    const ownership = await load(caller({ player_id: "player_b" }));
    expect([...ownership.player_ids]).toEqual(["player_b"]);
    expect([...ownership.player_profile_ids]).toEqual(["player_profile_b"]);
    expect(ownership.team_ids.size).toBe(0);
  });

  it("gives administrators no self-scope sets", async () => {
    const ownership = await load(caller({ role: "org_admin" }));
    expect(ownership.role_kind).toBe(OwnershipRoleKind.ADMINISTRATOR);
    expect(ownership.player_ids.size).toBe(0);
  });
});

describe("is_record_owned_by_caller", () => {
  it("matches identifications by holder type and holder id", async () => {
    const ownership = await load(caller({ player_id: "player_a" }));
    const own = { holder_type: "player", holder_id: "player_a" };
    const other = { holder_type: "player", holder_id: "player_b" };
    const spoofed = { holder_type: "official", holder_id: "player_a" };
    expect(is_record_owned_by_caller("identifications", own, ownership)).toBe(
      true,
    );
    expect(is_record_owned_by_caller("identifications", other, ownership)).toBe(
      false,
    );
    expect(
      is_record_owned_by_caller("identifications", spoofed, ownership),
    ).toBe(false);
  });

  it("matches team-owned records by team id for team managers", async () => {
    const ownership = await load(
      caller({ role: "team_manager", team_id: "team_a" }),
    );
    expect(
      is_record_owned_by_caller("teams", { local_id: "team_a" }, ownership),
    ).toBe(true);
    expect(
      is_record_owned_by_caller("teams", { local_id: "team_b" }, ownership),
    ).toBe(false);
    expect(
      is_record_owned_by_caller(
        "profile_links",
        { profile_id: "team_profile_a" },
        ownership,
      ),
    ).toBe(true);
  });

  it("matches calendar tokens by the owning user", async () => {
    const ownership = await load(caller({}));
    expect(
      is_record_owned_by_caller(
        "calendar_tokens",
        { user_id: "user_1" },
        ownership,
      ),
    ).toBe(true);
    expect(
      is_record_owned_by_caller("calendar_tokens", { user_id: "" }, ownership),
    ).toBe(false);
  });
});
