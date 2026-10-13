import { describe, expect, it } from "vitest";

import { load_official_leaderboard_page_state } from "./officialLeaderboardPageLoad";
import {
  create_fixture,
  create_official,
  create_organization,
  create_profile,
  create_rating,
  create_stage,
} from "./officialLeaderboardPageState.test_support";

describe("officialLeaderboardPageState", () => {
  it("returns a failure result when leaderboard data loading fails", async () => {
    const result = await load_official_leaderboard_page_state({
      profile_state: {
        status: "present",
        profile: create_profile(),
      },
      dependencies: {
        organization_use_cases: {
          list: async () => ({
            success: true,
            data: { items: [create_organization()] },
          }),
        },
        official_performance_rating_use_cases: {
          list: async () => ({ success: false }),
        },
        official_use_cases: {
          list: async () => ({
            success: true,
            data: { items: [create_official()] },
          }),
        },
        fixture_use_cases: {
          list: async () => ({
            success: true,
            data: { items: [create_fixture()] },
          }),
        },
        competition_stage_use_cases: {
          list: async () => ({
            success: true,
            data: { items: [create_stage()] },
          }),
        },
      } as never,
    });

    expect(result.success).toBe(false);
  });

  it("loads leaderboard page state with resolved organizations and entries", async () => {
    const result = await load_official_leaderboard_page_state({
      profile_state: {
        status: "present",
        profile: create_profile({ official_id: "official_1" }),
      },
      dependencies: {
        organization_use_cases: {
          list: async () => ({
            success: true,
            data: { items: [create_organization()] },
          }),
        },
        official_performance_rating_use_cases: {
          list: async () => ({
            success: true,
            data: { items: [create_rating()] },
          }),
        },
        official_use_cases: {
          list: async () => ({
            success: true,
            data: { items: [create_official()] },
          }),
        },
        fixture_use_cases: {
          list: async () => ({
            success: true,
            data: { items: [create_fixture()] },
          }),
        },
        competition_stage_use_cases: {
          list: async () => ({
            success: true,
            data: { items: [create_stage()] },
          }),
        },
      } as never,
    });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.selected_organization_id).toBe("org_1");
    expect(result.data.leaderboard_entries).toHaveLength(1);
    expect(result.data.selected_entry?.official_id).toBe("official_1");
  });
});
