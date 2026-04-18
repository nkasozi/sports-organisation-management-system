import { describe, expect, it } from "vitest";

import { ANY_VALUE } from "./AuthenticationPort";
import {
  build_authorization_list_filter,
  get_authorization_preselect_values,
  get_authorization_restricted_fields,
  get_scope_value,
  is_field_restricted_by_authorization,
  is_scope_restricted,
} from "./authorizationScopeUtils";

describe("authorizationScopeUtils", () => {
  it("returns unfiltered values for missing profile state", () => {
    expect(is_scope_restricted({ status: "missing" }, "organization_id")).toBe(
      false,
    );
    expect(get_scope_value({ status: "missing" }, "organization_id")).toBe("");
    expect(get_authorization_restricted_fields({ status: "missing" })).toEqual(
      new Set(),
    );
    expect(get_authorization_preselect_values({ status: "missing" })).toEqual(
      {},
    );
    expect(
      build_authorization_list_filter({ status: "missing" }, [
        "organization_id",
        "team_id",
        "player_id",
      ]),
    ).toEqual({});
  });

  it("supports explicit profile state and direct profile inputs", () => {
    const restricted_profile_state = {
      status: "present",
      profile: {
        organization_id: "organization-1",
        team_id: "team-1",
        player_id: "player-1",
      } as never,
    } as const;

    expect(get_scope_value(restricted_profile_state, "organization_id")).toBe(
      "organization-1",
    );
    expect(
      get_scope_value(
        {
          organization_id: ANY_VALUE,
          team_id: "",
        } as never,
        "organization_id",
      ),
    ).toBe("");
    expect(
      get_authorization_restricted_fields(restricted_profile_state),
    ).toEqual(new Set(["organization_id", "team_id", "player_id"]));
    expect(
      get_authorization_preselect_values(restricted_profile_state),
    ).toEqual({
      organization_id: "organization-1",
      team_id: "team-1",
      player_id: "player-1",
    });
    expect(
      build_authorization_list_filter(restricted_profile_state, [
        "organization_id",
        "player_id",
      ]),
    ).toEqual({
      organization_id: "organization-1",
      player_id: "player-1",
    });
    expect(
      is_field_restricted_by_authorization(restricted_profile_state, "team_id"),
    ).toBe(true);
  });
});
