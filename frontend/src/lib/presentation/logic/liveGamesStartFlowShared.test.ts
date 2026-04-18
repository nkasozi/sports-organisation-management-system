import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  process_lineup_check,
  publish_checks,
  replace_last_check,
} from "./liveGamesStartFlowShared";

const { auto_generate_lineups_if_possible_mock } = vi.hoisted(() => ({
  auto_generate_lineups_if_possible_mock: vi.fn(),
}));

vi.mock("$lib/core/services/fixtureStartChecks", () => ({
  auto_generate_lineups_if_possible: auto_generate_lineups_if_possible_mock,
}));

describe("liveGamesStartFlowShared", () => {
  function create_dependencies() {
    return {
      team_use_cases: { get_by_id: vi.fn() },
      update_checks: vi.fn(),
      set_is_starting: vi.fn(),
      delay: vi.fn().mockImplementation(async () => {}),
      check_delay_ms: 25,
      membership_use_cases: {} as never,
      player_use_cases: {} as never,
      player_position_use_cases: {} as never,
      fixture_lineup_use_cases: {} as never,
      fixture_use_cases: {} as never,
      competition_use_cases: {} as never,
      organization_use_cases: {} as never,
      sport_use_cases: {} as never,
    };
  }

  beforeEach(() => {
    auto_generate_lineups_if_possible_mock.mockReset();
  });

  it("replaces the last check entry in place", () => {
    const checks = [
      {
        check_name: "lineup",
        status: "checking",
        message: "old",
        fix_suggestion: "",
      },
    ];

    replace_last_check(
      checks as never,
      {
        check_name: "lineup",
        status: "passed",
        message: "updated",
        fix_suggestion: "",
      } as never,
    );

    expect(checks.at(-1)).toEqual({
      check_name: "lineup",
      status: "passed",
      message: "updated",
      fix_suggestion: "",
    });
  });

  it("publishes the current checks and waits for the configured delay", async () => {
    const dependencies = create_dependencies();
    const checks = [
      {
        check_name: "lineup",
        status: "checking",
        message: "Checking",
        fix_suggestion: "",
      },
    ];

    await publish_checks("fixture-1", checks as never, dependencies as never);

    expect(dependencies.update_checks).toHaveBeenCalledWith(
      "fixture-1",
      checks,
    );
    expect(dependencies.delay).toHaveBeenCalledWith(25);
  });

  it("accepts an already-passed lineup check without attempting auto-generation", async () => {
    const dependencies = create_dependencies();
    const checks = [] as never[];

    await expect(
      process_lineup_check(
        { id: "fixture-1" } as never,
        checks as never,
        {
          check_name: "home_lineup",
          status: "passed",
          message: "Ready",
          fix_suggestion: "",
        } as never,
        "team-1",
        "Checking lineup",
        "auto_generate_home",
        "home_lineup",
        "Lions",
        "Lineup missing",
        dependencies as never,
      ),
    ).resolves.toBe(true);
    expect(auto_generate_lineups_if_possible_mock).not.toHaveBeenCalled();
  });

  it("fails the preflight when lineup auto-generation cannot recover a missing lineup", async () => {
    const dependencies = create_dependencies();
    const checks = [] as never[];
    dependencies.team_use_cases.get_by_id.mockResolvedValue({
      success: true,
      data: { name: "Lions" },
    });
    auto_generate_lineups_if_possible_mock.mockResolvedValue({
      success: false,
      error_message: "No active players available",
      fix_suggestion: "Assign players before retrying",
    });

    await expect(
      process_lineup_check(
        { id: "fixture-1" } as never,
        checks as never,
        {
          check_name: "home_lineup",
          status: "failed",
          message: "Missing",
          fix_suggestion: "",
        } as never,
        "team-1",
        "Checking lineup",
        "auto_generate_home",
        "home_lineup",
        "Lions",
        "Lineup missing",
        dependencies as never,
      ),
    ).resolves.toBe(false);
    expect(dependencies.set_is_starting).toHaveBeenCalledWith(
      "fixture-1",
      false,
    );
    expect(checks.at(-1)).toEqual({
      check_name: "home_lineup",
      status: "failed",
      message: "No active players available",
      fix_suggestion: "Assign players before retrying",
    });
  });
});
