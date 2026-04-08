import { describe, expect, it, vi } from "vitest";

import type { LiveGameDetailDataDependencies } from "./liveGameDetailData";
import { load_live_game_detail_bundle } from "./liveGameDetailData";

describe("liveGameDetailData", () => {
  type MockDependencies = {
    [Key in keyof LiveGameDetailDataDependencies]: Partial<
      LiveGameDetailDataDependencies[Key]
    >;
  };

  function create_dependencies() {
    return {
      competition_use_cases: { get_by_id: vi.fn() },
      fixture_lineup_use_cases: { get_lineup_for_team_in_fixture: vi.fn() },
      fixture_use_cases: { get_by_id: vi.fn() },
      official_use_cases: { get_by_id: vi.fn() },
      organization_use_cases: { get_by_id: vi.fn() },
      sport_use_cases: { get_by_id: vi.fn() },
      team_use_cases: { get_by_id: vi.fn() },
      venue_use_cases: { get_by_id: vi.fn() },
    } satisfies MockDependencies;
  }

  it("returns an error when the fixture cannot be loaded", async () => {
    const dependencies = create_dependencies();
    dependencies.fixture_use_cases.get_by_id.mockResolvedValue({
      success: false,
      error: "Fixture missing",
    });

    await expect(
      load_live_game_detail_bundle(
        "fixture-1",
        dependencies as unknown as LiveGameDetailDataDependencies,
      ),
    ).resolves.toEqual({
      success: false,
      error_message: "Fixture missing",
    });
  });

  it("loads related entities, normalizes lineups, and filters missing officials", async () => {
    const dependencies = create_dependencies();
    dependencies.fixture_use_cases.get_by_id.mockResolvedValue({
      success: true,
      data: {
        id: "fixture-1",
        home_team_id: "team-home",
        away_team_id: "team-away",
        competition_id: "competition-1",
        venue: "venue-1",
        assigned_officials: [
          { official_id: "official-1", role_name: "Referee" },
          { official_id: "official-missing", role_name: "Assistant" },
        ],
        status: "in_progress",
        current_minute: 12,
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
    dependencies.fixture_lineup_use_cases.get_lineup_for_team_in_fixture.mockImplementation(
      async (_fixture_id: string, team_id: string) => ({
        success: true,
        data:
          team_id === "team-home"
            ? {
                id: "lineup-home",
                selected_players: [
                  {
                    id: "home-player",
                    first_name: "Ada",
                    last_name: "Stone",
                    jersey_number: 9,
                    is_substitute: false,
                    time_on: null,
                  },
                ],
              }
            : {
                id: "lineup-away",
                selected_players: [
                  {
                    id: "away-player",
                    first_name: "Bo",
                    last_name: "Reed",
                    jersey_number: 4,
                    is_substitute: false,
                    time_on: "present_at_start",
                  },
                ],
              },
      }),
    );
    dependencies.competition_use_cases.get_by_id.mockResolvedValue({
      success: true,
      data: { organization_id: "organization-1" },
    });
    dependencies.organization_use_cases.get_by_id.mockResolvedValue({
      success: true,
      data: { name: "Premier League", sport_id: "sport-1" },
    });
    dependencies.sport_use_cases.get_by_id.mockResolvedValue({
      success: true,
      data: { id: "sport-1" },
    });
    dependencies.venue_use_cases.get_by_id.mockResolvedValue({
      success: true,
      data: { id: "venue-1", name: "National Stadium" },
    });
    dependencies.official_use_cases.get_by_id.mockImplementation(
      async (official_id: string) =>
        official_id === "official-1"
          ? {
              success: true,
              data: { id: "official-1", first_name: "Sam", last_name: "Hill" },
            }
          : { success: false, error: "Missing" },
    );

    const result = await load_live_game_detail_bundle(
      "fixture-1",
      dependencies as unknown as LiveGameDetailDataDependencies,
    );

    expect(result).toEqual(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          organization_name: "Premier League",
          home_lineup_id: "lineup-home",
          away_lineup_id: "lineup-away",
          game_clock_seconds: 720,
          assigned_officials_data: [
            {
              official: {
                id: "official-1",
                first_name: "Sam",
                last_name: "Hill",
              },
              role_name: "Referee",
            },
          ],
        }),
      }),
    );
    if (!result.success) {
      throw new Error("Expected bundle to load");
    }
    expect(result.data.home_players[0].time_on).toBe("present_at_start");
  });

  it("returns empty optional data when competition, venue, and lineups are unavailable", async () => {
    const dependencies = create_dependencies();
    dependencies.fixture_use_cases.get_by_id.mockResolvedValue({
      success: true,
      data: {
        id: "fixture-2",
        home_team_id: "team-home",
        away_team_id: "team-away",
        status: "scheduled",
      },
    });
    dependencies.team_use_cases.get_by_id.mockResolvedValue({
      success: true,
      data: null,
    });
    dependencies.fixture_lineup_use_cases.get_lineup_for_team_in_fixture.mockResolvedValue(
      {
        success: false,
        error: "Missing lineup",
      },
    );

    const result = await load_live_game_detail_bundle(
      "fixture-2",
      dependencies as unknown as LiveGameDetailDataDependencies,
    );

    expect(result).toEqual(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          competition: null,
          sport: null,
          venue: null,
          organization_name: "",
          home_players: [],
          away_players: [],
          game_clock_seconds: 0,
        }),
      }),
    );
  });
});
