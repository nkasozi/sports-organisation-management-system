import { describe, expect, it } from "vitest";

import {
  create_official_leaderboard_failed_state,
  create_official_leaderboard_loading_state,
  create_official_leaderboard_ready_state,
  OFFICIAL_LEADERBOARD_PAGE_STATUS,
} from "./officialLeaderboardPageStatus";

describe("official leaderboard page status", () => {
  it("creates a loading state", () => {
    expect(create_official_leaderboard_loading_state()).toEqual({
      status: OFFICIAL_LEADERBOARD_PAGE_STATUS.LOADING,
    });
  });

  it("creates a failed state carrying the user-facing message", () => {
    expect(create_official_leaderboard_failed_state("Try again")).toEqual({
      status: OFFICIAL_LEADERBOARD_PAGE_STATUS.FAILED,
      message: "Try again",
    });
  });

  it("creates a ready state", () => {
    expect(create_official_leaderboard_ready_state()).toEqual({
      status: OFFICIAL_LEADERBOARD_PAGE_STATUS.READY,
    });
  });
});
