import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { auto_generate_lineups_if_possible } from "./fixtureLineupGeneration";
import {
  create_dependencies,
  expect_lineup_success,
  FIXTURE,
  NO_PREVIOUS_LINEUP,
} from "./fixtureLineupGeneration.test_support";

const mocks = vi.hoisted(() => ({
  find_previous_lineup_for_team: vi.fn(),
  get_player_rules_from_competition: vi.fn(),
}));

vi.mock("./fixtureLineupLookup", async (import_original) => ({
  ...(await import_original<typeof import("./fixtureLineupLookup")>()),
  find_previous_lineup_for_team: mocks.find_previous_lineup_for_team,
}));
vi.mock("./fixturePlayerRules", () => ({
  get_player_rules_from_competition: mocks.get_player_rules_from_competition,
}));

describe("auto-generated lineups separate starters from substitutes", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    mocks.find_previous_lineup_for_team.mockResolvedValue(NO_PREVIOUS_LINEUP);
    mocks.get_player_rules_from_competition.mockResolvedValue({
      success: true,
      min_players: 1,
      max_players: 2,
      starters_count: 1,
      squad_generation_strategy: "first_available",
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("marks players beyond the number allowed on the field as substitutes", async () => {
    const dependencies = create_dependencies();

    const result = expect_lineup_success(
      await auto_generate_lineups_if_possible(
        FIXTURE as never,
        "team1",
        "Lions",
        dependencies.membership as never,
        dependencies.player as never,
        dependencies.position as never,
        dependencies.lineup as never,
        {} as never,
        {} as never,
        {} as never,
        {} as never,
      ),
    );

    expect(
      result.lineup.selected_players.map((player) => player.is_substitute),
    ).toEqual([false, true]);
  });
});
