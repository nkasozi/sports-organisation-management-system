import { describe, expect, it } from "vitest";

import { ANY_VALUE } from "$lib/core/interfaces/ports";

import {
  can_user_change_official_leaderboard_organizations,
  rebuild_official_leaderboard_view,
  resolve_official_leaderboard_organizations,
} from "./officialLeaderboardPageState";
import {
  create_fixture,
  create_official,
  create_organization,
  create_profile,
  create_rating,
  create_stage,
} from "./officialLeaderboardPageState.test_support";

describe("officialLeaderboardPageState", () => {
  it("allows organization switching only for wildcard or empty organization scope", () => {
    expect(
      can_user_change_official_leaderboard_organizations({
        status: "present",
        profile: create_profile({ organization_id: ANY_VALUE }),
      }),
    ).toBe(true);
    expect(
      can_user_change_official_leaderboard_organizations({
        status: "present",
        profile: create_profile({ organization_id: "" }),
      }),
    ).toBe(true);
    expect(
      can_user_change_official_leaderboard_organizations({
        status: "missing",
      }),
    ).toBe(false);
    expect(
      can_user_change_official_leaderboard_organizations({
        status: "present",
        profile: create_profile(),
      }),
    ).toBe(false);
  });

  it("filters organizations to the scoped organization", () => {
    const result = resolve_official_leaderboard_organizations(
      [
        create_organization(),
        create_organization({ id: "org_2", name: "Org 2" }),
      ],
      {
        status: "present",
        profile: create_profile({ organization_id: "org_2" }),
      },
    );

    expect(result.map((organization) => organization.id)).toEqual(["org_2"]);
  });

  it("rebuilds entries and preselects the scoped official", () => {
    const result = rebuild_official_leaderboard_view({
      all_ratings: [create_rating()],
      all_officials: [create_official()],
      all_fixtures: [create_fixture()],
      all_stages: [create_stage()],
      selected_organization_id: "org_1",
      user_official_id: "official_1",
    });

    expect(result.leaderboard_entries).toHaveLength(1);
    expect(result.selected_entry?.official_id).toBe("official_1");
    expect(result.selected_breakdown).toHaveLength(1);
  });
});
