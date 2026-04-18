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

  it("keeps matching and global records within organization scope", () => {
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
    ).toEqual([matching_record, global_record]);
  });
});
