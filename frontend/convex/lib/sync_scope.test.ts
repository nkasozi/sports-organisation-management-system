import { describe, expect, it } from "vitest";

import type { Id } from "../_generated/dataModel";
import { build_scope_filter, type SystemUserRecord } from "./auth_middleware";
import {
  filter_records_by_organization_scope,
  is_global_record,
} from "./sync_validation";

const SYSTEM_USER_ID = "system_user_1" as Id<"system_users">;
const ACTIVE_STATUS = "active";
const TEAM_MANAGER_ROLE = "team_manager";
const PLAYER_ROLE = "player";
const ORGANIZATION_ID = "organization_1";
const PLAYER_ENTITY_TYPE = "player_profile";
const TEAM_ENTITY_TYPE = "team";
const TEAMS_TABLE_NAME = "teams";

function create_system_user_record(
  overrides: Partial<SystemUserRecord> = {},
): SystemUserRecord {
  return {
    _id: SYSTEM_USER_ID,
    email: "manager@example.com",
    role: TEAM_MANAGER_ROLE,
    organization_id: ORGANIZATION_ID,
    status: ACTIVE_STATUS,
    ...overrides,
  };
}

describe("sync_scope", () => {
  it("uses empty strings for missing scoped identifiers", () => {
    expect(
      build_scope_filter(create_system_user_record(), TEAM_ENTITY_TYPE),
    ).toEqual({ organization_id: ORGANIZATION_ID, team_id: "" });

    expect(
      build_scope_filter(
        create_system_user_record({ role: PLAYER_ROLE }),
        PLAYER_ENTITY_TYPE,
      ),
    ).toEqual({ id: "" });
  });

  it("treats records without organization ids as global", () => {
    expect(is_global_record({ local_id: "global_record" })).toBe(true);
    expect(
      is_global_record({ local_id: "scoped_record", organization_id: "" }),
    ).toBe(true);
    expect(
      is_global_record({
        local_id: "organization_record",
        organization_id: ORGANIZATION_ID,
      }),
    ).toBe(false);
  });

  it("excludes unscoped and wildcard records from tenant tables", () => {
    const caller = create_system_user_record({ role: "org_admin" });
    const wildcard_user = { local_id: "user_root", organization_id: "*" };
    const blank_player = { local_id: "player_blank", organization_id: "" };
    expect(
      filter_records_by_organization_scope(
        [wildcard_user],
        caller,
        "system_users",
        { organization_id: ORGANIZATION_ID },
      ),
    ).toEqual([]);
    expect(
      filter_records_by_organization_scope([blank_player], caller, "players", {
        organization_id: ORGANIZATION_ID,
      }),
    ).toEqual([]);
  });

  it("applies the team scope only to records that carry a team", () => {
    const caller = create_system_user_record({ team_id: "team_1" });
    const own_team = { local_id: "team_1", organization_id: ORGANIZATION_ID };
    const own_staff = {
      local_id: "staff_1",
      organization_id: ORGANIZATION_ID,
      team_id: "team_1",
    };
    const other_staff = { ...own_staff, local_id: "staff_2", team_id: "x" };
    expect(
      filter_records_by_organization_scope(
        [own_team, own_staff, other_staff],
        caller,
        TEAMS_TABLE_NAME,
        build_scope_filter(caller, TEAM_ENTITY_TYPE),
      ),
    ).toEqual([own_team, own_staff]);
  });

  it("keeps only matching records within organization scope", () => {
    const caller = create_system_user_record();
    const matching_record = {
      local_id: "record_1",
      organization_id: ORGANIZATION_ID,
    };
    const global_record = { local_id: "record_2" };
    const foreign_record = {
      local_id: "record_3",
      organization_id: "organization_2",
    };

    expect(
      filter_records_by_organization_scope(
        [matching_record, global_record, foreign_record],
        caller,
        TEAMS_TABLE_NAME,
        { organization_id: ORGANIZATION_ID, team_id: "" },
      ),
    ).toEqual([matching_record]);
  });

  it("scopes id-filtered roles to their organization instead of every tenant", () => {
    const caller = create_system_user_record({ role: PLAYER_ROLE });
    const own_organization_player = {
      local_id: "player_1",
      organization_id: ORGANIZATION_ID,
    };
    const foreign_player = {
      local_id: "player_2",
      organization_id: "organization_2",
    };

    expect(
      filter_records_by_organization_scope(
        [own_organization_player, foreign_player],
        caller,
        "players",
        build_scope_filter(caller, PLAYER_ENTITY_TYPE),
      ),
    ).toEqual([own_organization_player]);
  });

  it("denies every record to callers without an organization", () => {
    const caller = create_system_user_record({ organization_id: "" });

    expect(
      filter_records_by_organization_scope(
        [{ local_id: "record_1", organization_id: ORGANIZATION_ID }],
        caller,
        TEAMS_TABLE_NAME,
        build_scope_filter(caller, TEAM_ENTITY_TYPE),
      ),
    ).toEqual([]);
  });
});
