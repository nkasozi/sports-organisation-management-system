import { describe, expect, it, vi } from "vitest";

import { load_game_manage_bundle } from "./gameManageData";

describe("gameManageData", () => {
  function create_dependencies() {
    return {
      fixture_use_cases: { get_by_id: vi.fn() },
      team_use_cases: { get_by_id: vi.fn() },
      player_use_cases: { list_players_by_team: vi.fn() },
    };
  }

  it("returns the fixture load error without attempting downstream lookups", async () => {
    const dependencies = create_dependencies();
    dependencies.fixture_use_cases.get_by_id.mockResolvedValue({
      success: false,
      error: "Fixture service unavailable",
    });

    await expect(
      load_game_manage_bundle("fixture-1", dependencies as never),
    ).resolves.toEqual({
      success: false,
      error_message: "Fixture service unavailable",
    });
    expect(dependencies.team_use_cases.get_by_id).not.toHaveBeenCalled();
  });

  it("fails when the fixture lookup succeeds without returning a fixture", async () => {
    const dependencies = create_dependencies();
    dependencies.fixture_use_cases.get_by_id.mockResolvedValue({
      success: true,
      data: null,
    });

    await expect(
      load_game_manage_bundle("fixture-1", dependencies as never),
    ).resolves.toEqual({
      success: false,
      error_message: "Failed to load fixture",
    });
  });

  it("loads teams and players, while tolerating partial downstream failures", async () => {
    const dependencies = create_dependencies();
    dependencies.fixture_use_cases.get_by_id.mockResolvedValue({
      success: true,
      data: {
        id: "fixture-1",
        home_team_id: "team-home",
        away_team_id: "team-away",
        status: "in_progress",
        current_minute: 12,
      },
    });
    dependencies.team_use_cases.get_by_id.mockImplementation(
      async (team_id: string) =>
        team_id === "team-home"
          ? { success: true, data: { id: "team-home", name: "Lions" } }
          : { success: false, error: "missing" },
    );
    dependencies.player_use_cases.list_players_by_team.mockImplementation(
      async (team_id: string) =>
        team_id === "team-home"
          ? { success: true, data: { items: [{ id: "player-1" }] } }
          : { success: false, error: "missing" },
    );

    await expect(
      load_game_manage_bundle("fixture-1", dependencies as never),
    ).resolves.toEqual({
      success: true,
      data: {
        fixture: expect.objectContaining({ id: "fixture-1" }),
        home_team: { id: "team-home", name: "Lions" },
        away_team: null,
        home_players: [{ id: "player-1" }],
        away_players: [],
        game_clock_seconds: 720,
      },
    });
  });
});
