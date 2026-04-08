import { describe, expect, it, vi } from "vitest";

const { get_sport_by_id_mock } = vi.hoisted(() => ({
  get_sport_by_id_mock: vi.fn(),
}));

vi.mock("$lib/adapters/persistence/sportService", () => ({
  get_sport_by_id: get_sport_by_id_mock,
}));

import { load_fixture_lineup_create_fixture_data } from "./fixtureLineupCreateDataFixture";
import type { FixtureLineupCreateDependencies } from "./fixtureLineupCreateDataTypes";

describe("fixtureLineupCreateDataFixture", () => {
  type MockDependencies = {
    [Key in keyof FixtureLineupCreateDependencies]?: Partial<
      FixtureLineupCreateDependencies[Key]
    >;
  };
  type CurrentAuthProfile = Parameters<
    typeof load_fixture_lineup_create_fixture_data
  >[1];

  function create_dependencies() {
    return {
      fixture_use_cases: { get_by_id: vi.fn() },
      competition_use_cases: { get_by_id: vi.fn() },
      organization_use_cases: { get_by_id: vi.fn() },
      competition_team_use_cases: { list_teams_in_competition: vi.fn() },
      team_use_cases: { get_by_id: vi.fn() },
      lineup_use_cases: { list_lineups_by_fixture: vi.fn() },
    } satisfies MockDependencies;
  }

  it("fails fast when the selected fixture cannot be loaded", async () => {
    const dependencies = create_dependencies();
    dependencies.fixture_use_cases.get_by_id.mockResolvedValue({
      success: false,
    });

    await expect(
      load_fixture_lineup_create_fixture_data(
        "fixture-1",
        null,
        dependencies as unknown as FixtureLineupCreateDependencies,
      ),
    ).resolves.toEqual({
      success: false,
      error_message: expect.stringContaining("Failed to load fixture."),
      should_clear_fixture: true,
    });
  });

  it("builds lineup constraints, labels, and auto-selection from the loaded fixture context", async () => {
    const dependencies = create_dependencies();
    get_sport_by_id_mock.mockResolvedValue({
      success: true,
      data: {
        min_players_per_fixture: 5,
        max_players_per_fixture: 20,
        max_players_on_field: 11,
      },
    });
    dependencies.fixture_use_cases.get_by_id.mockResolvedValue({
      success: true,
      data: {
        id: "fixture-1",
        competition_id: "competition-1",
        home_team_id: "team-home",
        away_team_id: "team-away",
        status: "scheduled",
      },
    });
    dependencies.competition_use_cases.get_by_id.mockResolvedValue({
      success: true,
      data: {
        id: "competition-1",
        name: "Premier Cup",
        organization_id: "organization-1",
        rule_overrides: {
          min_players_on_field: 7,
          max_squad_size: 16,
          max_players_on_field: 9,
        },
      },
    });
    dependencies.organization_use_cases.get_by_id.mockResolvedValue({
      success: true,
      data: { id: "organization-1", sport_id: "sport-1" },
    });
    dependencies.competition_team_use_cases.list_teams_in_competition.mockResolvedValue(
      {
        success: true,
        data: {
          items: [
            { team_id: "team-home", seed_number: 1, status: "active" },
            { team_id: "team-away", seed_number: 2, status: "active" },
          ],
        },
      },
    );
    dependencies.team_use_cases.get_by_id.mockImplementation(
      async (team_id: string) => ({
        success: true,
        data: {
          id: team_id,
          name: team_id === "team-home" ? "Lions" : "Tigers",
        },
      }),
    );
    dependencies.lineup_use_cases.list_lineups_by_fixture.mockResolvedValue({
      success: true,
      data: {
        items: [{ team_id: "team-away" }],
      },
    });

    const result = await load_fixture_lineup_create_fixture_data(
      "fixture-1",
      { team_id: "team-home" } as CurrentAuthProfile,
      dependencies as unknown as FixtureLineupCreateDependencies,
    );

    expect(result).toEqual({
      success: true,
      data: expect.objectContaining({
        organization_id: "organization-1",
        min_players: 7,
        max_players: 16,
        starters_count: 9,
        available_teams: [{ id: "team-home", name: "Lions" }],
        auto_selected_team_id: "team-home",
      }),
    });
    if (!result.success) {
      return;
    }
    expect(result.data.fixture_team_label_by_team_id.get("team-home")).toBe(
      "Lions • Seed 1 • active",
    );
    expect(result.data.teams_with_existing_lineups.get("team-away")).toBe(
      "Tigers • Seed 2 • active",
    );
  });

  it("rejects a fixture when the authorized team has already submitted its lineup", async () => {
    const dependencies = create_dependencies();
    get_sport_by_id_mock.mockResolvedValue({ success: false });
    dependencies.fixture_use_cases.get_by_id.mockResolvedValue({
      success: true,
      data: {
        id: "fixture-1",
        competition_id: "competition-1",
        home_team_id: "team-home",
        away_team_id: "team-away",
        status: "scheduled",
      },
    });
    dependencies.competition_use_cases.get_by_id.mockResolvedValue({
      success: true,
      data: {
        id: "competition-1",
        name: "Premier Cup",
        organization_id: "organization-1",
      },
    });
    dependencies.organization_use_cases.get_by_id.mockResolvedValue({
      success: true,
      data: { id: "organization-1", sport_id: "sport-1" },
    });
    dependencies.competition_team_use_cases.list_teams_in_competition.mockResolvedValue(
      {
        success: true,
        data: { items: [] },
      },
    );
    dependencies.team_use_cases.get_by_id.mockImplementation(
      async (team_id: string) => ({
        success: true,
        data: {
          id: team_id,
          name: team_id === "team-home" ? "Lions" : "Tigers",
        },
      }),
    );
    dependencies.lineup_use_cases.list_lineups_by_fixture.mockResolvedValue({
      success: true,
      data: {
        items: [{ team_id: "team-home" }],
      },
    });

    await expect(
      load_fixture_lineup_create_fixture_data(
        "fixture-1",
        { team_id: "team-home" } as CurrentAuthProfile,
        dependencies as unknown as FixtureLineupCreateDependencies,
      ),
    ).resolves.toEqual({
      success: false,
      error_message: expect.stringContaining(
        "Your team has already submitted a lineup for this fixture.",
      ),
      should_clear_fixture: true,
    });
  });
});
