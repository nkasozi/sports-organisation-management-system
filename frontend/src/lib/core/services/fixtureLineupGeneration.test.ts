import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { LineupGenerationResult } from "./fixtureLineupCandidates";
import { auto_generate_lineups_if_possible } from "./fixtureLineupGeneration";
import {
  create_dependencies,
  expect_lineup_success,
  FIXTURE,
  type LineupGenerationTestDependencies,
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

function generate(
  dependencies: LineupGenerationTestDependencies,
  fixture: object = FIXTURE,
): Promise<LineupGenerationResult> {
  return auto_generate_lineups_if_possible(
    fixture as never,
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
  );
}

function use_rules(
  min_players: number,
  max_players: number,
  strategy = "first_available",
): void {
  mocks.get_player_rules_from_competition.mockResolvedValue({
    success: true,
    min_players,
    max_players,
    squad_generation_strategy: strategy,
  });
}

describe("auto_generate_lineups_if_possible", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    mocks.find_previous_lineup_for_team
      .mockReset()
      .mockResolvedValue(NO_PREVIOUS_LINEUP);
    use_rules(1, 2);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("requires a fixture id and valid rules", async () => {
    expect(
      await generate(create_dependencies(), { ...FIXTURE, id: "" }),
    ).toEqual({
      success: false,
      error_message: "Fixture must have an ID",
      fix_suggestion: "",
    });
    mocks.get_player_rules_from_competition.mockResolvedValue({
      success: false,
      error_message: "no rules",
    });
    expect(await generate(create_dependencies())).toEqual({
      success: false,
      error_message: "no rules",
      fix_suggestion: "",
    });
  });

  it("selects the first available active players sorted by name", async () => {
    const dependencies = create_dependencies();

    const result = expect_lineup_success(await generate(dependencies));

    expect(result.generation_message).toBe(
      "Selected first 2 available players for Lions",
    );
    expect(result.lineup).toMatchObject({
      organization_id: "org1",
      fixture_id: "fx1",
      team_id: "team1",
      status: "submitted",
      submitted_by: "auto-generated",
      notes: "Auto-generated lineup (first available players)",
    });
    expect(
      result.lineup.selected_players.map((p) => [
        p.id,
        p.position,
        p.jersey_number,
      ]),
    ).toEqual([
      ["p2", "Keeper", 2],
      ["p3", "", 3],
    ]);
    expect(dependencies.lineup.create).toHaveBeenCalledWith(result.lineup);
    expect(dependencies.membership.list).toHaveBeenCalledWith({
      team_id: "team1",
      status: "active",
    });
    expect(dependencies.position.list).toHaveBeenCalledWith(
      {},
      { page_number: 1, page_size: 100 },
    );
  });

  it("explains how to fix an undersized squad", async () => {
    use_rules(5, 9);

    expect(await generate(create_dependencies())).toEqual({
      success: false,
      error_message: "Lions has only 3 active player(s), but minimum is 5",
      fix_suggestion:
        "Go to the Player Team Memberships page and add more players to Lions (need at least 2 more)",
    });
  });

  it("reports lineup creation failures", async () => {
    expect(
      await generate(create_dependencies({ success: false, error: "" })),
    ).toEqual({
      success: false,
      error_message: "Failed to create lineup",
      fix_suggestion: "",
    });
    expect(
      await generate(create_dependencies({ success: false, error: "dup" })),
    ).toEqual({
      success: false,
      error_message: "dup",
      fix_suggestion: "",
    });
  });

  it("reuses the previous match squad when available", async () => {
    use_rules(1, 2, "previous_match");
    const previous_players = [{ id: "old1" }, { id: "old2" }, { id: "old3" }];
    mocks.find_previous_lineup_for_team.mockResolvedValue({
      success: true,
      data: { status: "some", value: { selected_players: previous_players } },
    });
    const dependencies = create_dependencies();

    const result = await generate(dependencies);

    expect(result).toMatchObject({
      success: true,
      generation_message: "Used previous match squad for Lions (3 players)",
      lineup: {
        selected_players: previous_players,
        notes: "Auto-generated from previous match squad",
      },
    });
    expect(dependencies.membership.list).not.toHaveBeenCalled();
    expect(
      await generate(create_dependencies({ success: false, error: "" })),
    ).toEqual({
      success: false,
      error_message: "Failed to create lineup",
      fix_suggestion: "",
    });
  });

  it("falls back to first available players without a previous squad", async () => {
    use_rules(1, 2, "previous_match");

    const result = expect_lineup_success(await generate(create_dependencies()));

    expect(result.generation_message).toBe(
      "Selected first 2 available players for Lions",
    );
    expect(mocks.find_previous_lineup_for_team).toHaveBeenCalled();
  });
});
