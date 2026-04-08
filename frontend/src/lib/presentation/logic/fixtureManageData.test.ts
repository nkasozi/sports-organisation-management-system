import { describe, expect, it, vi } from "vitest";

import { load_fixture_manage_bundle } from "./fixtureManageData";

describe("fixtureManageData", () => {
  function create_dependencies() {
    return {
      fixture_use_cases: { get_by_id: vi.fn() },
      team_use_cases: { get_by_id: vi.fn() },
      player_use_cases: { list_players_by_team: vi.fn() },
      player_team_membership_use_cases: { list_memberships_by_team: vi.fn() },
      player_position_use_cases: { list: vi.fn() },
    };
  }

  it("returns the fixture use-case error when the game cannot be loaded", async () => {
    const dependencies = create_dependencies();
    dependencies.fixture_use_cases.get_by_id.mockResolvedValue({
      success: false,
      error: "offline",
    });

    await expect(
      load_fixture_manage_bundle("fixture-1", dependencies as never),
    ).resolves.toEqual({ success: false, error_message: "offline" });
  });

  it("returns a not-found message when the fixture lookup has no data", async () => {
    const dependencies = create_dependencies();
    dependencies.fixture_use_cases.get_by_id.mockResolvedValue({
      success: true,
      data: null,
    });

    await expect(
      load_fixture_manage_bundle("fixture-1", dependencies as never),
    ).resolves.toEqual({ success: false, error_message: "Game not found" });
  });

  it("enriches players with jersey numbers and positions while defaulting failed sides to empty arrays", async () => {
    const dependencies = create_dependencies();
    dependencies.fixture_use_cases.get_by_id.mockResolvedValue({
      success: true,
      data: {
        id: "fixture-1",
        organization_id: "organization-1",
        home_team_id: "team-home",
        away_team_id: "team-away",
        status: "in_progress",
        current_minute: 23,
      },
    });
    dependencies.team_use_cases.get_by_id.mockImplementation(
      async (team_id: string) => ({
        success: true,
        data: {
          id: team_id,
          name: team_id === "team-home" ? "Lions" : "Tigers",
        },
      }),
    );
    dependencies.player_use_cases.list_players_by_team.mockImplementation(
      async (team_id: string) =>
        team_id === "team-home"
          ? {
              success: true,
              data: {
                items: [
                  {
                    id: "player-1",
                    first_name: "Ada",
                    last_name: "Stone",
                    position_id: "position-1",
                  },
                ],
              },
            }
          : {
              success: true,
              data: {
                items: [
                  {
                    id: "player-2",
                    first_name: "Bo",
                    last_name: "Reed",
                    position_id: "position-2",
                  },
                ],
              },
            },
    );
    dependencies.player_team_membership_use_cases.list_memberships_by_team.mockImplementation(
      async (team_id: string) =>
        team_id === "team-home"
          ? {
              success: true,
              data: {
                items: [
                  {
                    player_id: "player-1",
                    jersey_number: 9,
                    start_date: "2024-01-01",
                    status: "active",
                  },
                ],
              },
            }
          : { success: false, error: "missing memberships" },
    );
    dependencies.player_position_use_cases.list.mockResolvedValue({
      success: true,
      data: {
        items: [
          { id: "position-1", name: "Goalkeeper" },
          { id: "position-2", name: "Defender" },
        ],
      },
    });

    const result = await load_fixture_manage_bundle(
      "fixture-1",
      dependencies as never,
    );

    expect(dependencies.player_position_use_cases.list).toHaveBeenCalledWith(
      { organization_id: "organization-1" },
      { page_number: 1, page_size: 1000 },
    );
    expect(result).toEqual({
      success: true,
      data: {
        fixture: expect.objectContaining({ id: "fixture-1" }),
        home_team: { id: "team-home", name: "Lions" },
        away_team: { id: "team-away", name: "Tigers" },
        home_players: [
          {
            id: "player-1",
            first_name: "Ada",
            last_name: "Stone",
            position_id: "position-1",
            jersey_number: 9,
            position: "Goalkeeper",
          },
        ],
        away_players: [],
        game_clock_seconds: 1380,
      },
    });
  });
});
