import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Fixture } from "$lib/core/entities/Fixture";
import type { PreFlightCheck } from "$lib/core/services/fixtureStartChecks";
import { create_success_result } from "$lib/core/types/Result";
import { start_live_game_fixture } from "./liveGamesStartFlow";

const {
  check_fixture_can_start,
  auto_generate_lineups_if_possible,
  auto_create_fixture_details_setup,
} = vi.hoisted(() => ({
  check_fixture_can_start: vi.fn(),
  auto_generate_lineups_if_possible: vi.fn(),
  auto_create_fixture_details_setup: vi.fn(),
}));

vi.mock("$lib/core/services/fixtureStartChecks", () => ({
  check_fixture_can_start,
  auto_generate_lineups_if_possible,
}));

vi.mock("$lib/core/services/fixtureDetailsAutoSetup", () => ({
  auto_create_fixture_details_setup,
}));

function create_fixture(overrides: Partial<Fixture> = {}): Fixture {
  return {
    id: "fixture_1",
    organization_id: "org_1",
    competition_id: "comp_1",
    home_team_id: "team_1",
    away_team_id: "team_2",
    scheduled_date: "2026-04-07",
    scheduled_time: "14:00",
    status: "scheduled",
    created_at: "2026-04-01T00:00:00Z",
    updated_at: "2026-04-01T00:00:00Z",
    ...overrides,
  } as Fixture;
}

function create_passed_check(check_name: string, message: string): PreFlightCheck {
  return {
    check_name,
    status: "passed",
    message,
    fix_suggestion: null,
  };
}

describe("liveGamesStartFlow", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("navigates to the live game when all pre-flight checks pass", async () => {
    const goto = vi.fn(async () => undefined);
    const update_checks = vi.fn();
    const set_is_starting = vi.fn();
    check_fixture_can_start.mockResolvedValue(
      create_success_result({
        can_start: true,
        officials_check: create_passed_check("officials", "Officials ready"),
        home_lineup_check: create_passed_check("home_lineup", "Home ready"),
        away_lineup_check: create_passed_check("away_lineup", "Away ready"),
      }),
    );

    await start_live_game_fixture(create_fixture(), {
      fixture_details_setup_use_cases: {},
      fixture_lineup_use_cases: {},
      membership_use_cases: {},
      player_use_cases: {},
      player_position_use_cases: {},
      team_use_cases: {},
      sport_use_cases: {},
      competition_use_cases: {},
      organization_use_cases: {},
      jersey_color_use_cases: {},
      official_use_cases: {},
      game_official_role_use_cases: {},
      goto,
      get_current_role: () => "organisation_admin",
      can_access_route: () => false,
      update_checks,
      set_is_starting,
      delay: async () => undefined,
      check_delay_ms: 0,
    });

    expect(set_is_starting).toHaveBeenCalledWith("fixture_1", true);
    expect(set_is_starting).toHaveBeenLastCalledWith("fixture_1", false);
    expect(goto).toHaveBeenCalledWith("/live-games/fixture_1");
    expect(update_checks).toHaveBeenCalled();
  });

  it("returns early when the fixture has no id", async () => {
    const goto = vi.fn(async () => undefined);
    const update_checks = vi.fn();
    const set_is_starting = vi.fn();

    await start_live_game_fixture(create_fixture({ id: "" }), {
      fixture_details_setup_use_cases: {},
      fixture_lineup_use_cases: {},
      membership_use_cases: {},
      player_use_cases: {},
      player_position_use_cases: {},
      team_use_cases: {},
      sport_use_cases: {},
      competition_use_cases: {},
      organization_use_cases: {},
      jersey_color_use_cases: {},
      official_use_cases: {},
      game_official_role_use_cases: {},
      goto,
      get_current_role: () => "organisation_admin",
      can_access_route: () => false,
      update_checks,
      set_is_starting,
      delay: async () => undefined,
      check_delay_ms: 0,
    });

    expect(set_is_starting).not.toHaveBeenCalled();
    expect(goto).not.toHaveBeenCalled();
    expect(check_fixture_can_start).not.toHaveBeenCalled();
  });
});