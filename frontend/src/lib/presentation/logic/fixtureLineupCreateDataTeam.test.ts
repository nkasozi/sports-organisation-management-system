import { describe, expect, it, vi } from "vitest";

import { load_fixture_lineup_create_team_data } from "./fixtureLineupCreateDataTeam";
import type { FixtureLineupCreateDependencies } from "./fixtureLineupCreateDataTypes";

describe("fixtureLineupCreateDataTeam", () => {
  type MockDependencies = {
    [Key in keyof FixtureLineupCreateDependencies]?: Partial<
      FixtureLineupCreateDependencies[Key]
    >;
  };
  type SelectedFixture = NonNullable<
    Parameters<typeof load_fixture_lineup_create_team_data>[1]
  >;
  type CurrentAuthProfile = Parameters<
    typeof load_fixture_lineup_create_team_data
  >[2];

  function create_dependencies() {
    return {
      team_use_cases: { get_by_id: vi.fn() },
      player_use_cases: { list_players_by_team: vi.fn() },
      membership_use_cases: { list_memberships_by_team: vi.fn() },
      player_position_use_cases: { list: vi.fn() },
    } satisfies MockDependencies;
  }

  it("requires a selected fixture before loading team data", async () => {
    const dependencies = create_dependencies();

    await expect(
      load_fixture_lineup_create_team_data(
        "team-1",
        null,
        null,
        18,
        dependencies as unknown as FixtureLineupCreateDependencies,
      ),
    ).resolves.toEqual({
      selected_team: null,
      team_players: [],
      selected_players: [],
      validation_error: expect.stringContaining("No fixture selected."),
    });
  });

  it("rejects teams that are not participating in the selected fixture", async () => {
    const dependencies = create_dependencies();

    await expect(
      load_fixture_lineup_create_team_data(
        "team-other",
        {
          home_team_id: "team-home",
          away_team_id: "team-away",
        } as SelectedFixture,
        null,
        18,
        dependencies as unknown as FixtureLineupCreateDependencies,
      ),
    ).resolves.toEqual({
      selected_team: null,
      team_players: [],
      selected_players: [],
      validation_error: expect.stringContaining("Invalid team selection."),
    });
  });

  it("builds team players with position and membership data, then preselects up to the squad limit", async () => {
    const dependencies = create_dependencies();
    dependencies.team_use_cases.get_by_id.mockResolvedValue({
      success: true,
      data: { id: "team-home", name: "Lions" },
    });
    dependencies.player_use_cases.list_players_by_team.mockResolvedValue({
      success: true,
      data: {
        items: [
          {
            id: "player-1",
            first_name: "Ada",
            last_name: "Stone",
            position_id: "position-1",
          },
          {
            id: "player-2",
            first_name: "Bo",
            last_name: "Reed",
            position_id: "position-2",
          },
        ],
      },
    });
    dependencies.membership_use_cases.list_memberships_by_team.mockResolvedValue(
      {
        success: true,
        data: {
          items: [
            {
              player_id: "player-1",
              jersey_number: 9,
              start_date: "2024-01-01",
              status: "active",
            },
            {
              player_id: "player-2",
              jersey_number: 4,
              start_date: "2024-01-01",
              status: "active",
            },
          ],
        },
      },
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

    const result = await load_fixture_lineup_create_team_data(
      "team-home",
      {
        home_team_id: "team-home",
        away_team_id: "team-away",
      } as SelectedFixture,
      { organization_id: "organization-1" } as CurrentAuthProfile,
      1,
      dependencies as unknown as FixtureLineupCreateDependencies,
    );

    expect(dependencies.player_position_use_cases.list).toHaveBeenCalledWith(
      { organization_id: "organization-1" },
      { page_number: 1, page_size: 500 },
    );
    expect(result).toEqual({
      selected_team: { id: "team-home", name: "Lions" },
      team_players: [
        {
          id: "player-1",
          first_name: "Ada",
          last_name: "Stone",
          position_id: "position-1",
          jersey_number: 9,
          position: "Goalkeeper",
        },
        {
          id: "player-2",
          first_name: "Bo",
          last_name: "Reed",
          position_id: "position-2",
          jersey_number: 4,
          position: "Defender",
        },
      ],
      selected_players: [
        {
          id: "player-1",
          first_name: "Ada",
          last_name: "Stone",
          jersey_number: 9,
          position: "Goalkeeper",
          is_captain: false,
          is_substitute: false,
        },
      ],
      validation_error: "",
    });
  });
});
