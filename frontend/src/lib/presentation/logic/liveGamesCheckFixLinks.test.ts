import { describe, expect, it } from "vitest";

import { get_live_game_check_fix_link } from "./liveGamesCheckFixLinks";

const FAILED_OFFICIALS_CHECK = {
  check_name: "officials",
  status: "failed",
  message: "No officials assigned to this fixture",
  fix_suggestion: "Go to the Fixture Details Setup page",
} as const;

describe("get_live_game_check_fix_link", () => {
  it("links a missing officials check to the fixture's details setup", () => {
    expect(
      get_live_game_check_fix_link(FAILED_OFFICIALS_CHECK, "fixture 1"),
    ).toEqual({
      status: "some",
      value: {
        href: "/fixture-details-setup?fixture_id=fixture+1",
        label: "Set up fixture details",
      },
    });
  });

  it("offers no link once the officials check has passed", () => {
    expect(
      get_live_game_check_fix_link(
        { ...FAILED_OFFICIALS_CHECK, status: "passed" },
        "fixture_1",
      ),
    ).toEqual({ status: "none" });
  });

  it("offers no link for other checks", () => {
    expect(
      get_live_game_check_fix_link(
        { ...FAILED_OFFICIALS_CHECK, check_name: "home_lineup" },
        "fixture_1",
      ),
    ).toEqual({ status: "none" });
  });

  it("offers no link without a fixture id", () => {
    expect(get_live_game_check_fix_link(FAILED_OFFICIALS_CHECK, "")).toEqual({
      status: "none",
    });
  });
});
