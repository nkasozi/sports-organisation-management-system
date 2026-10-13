import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { LineupGenerationResult } from "./fixtureLineupCandidates";
import { auto_generate_lineups_if_possible } from "./fixtureLineupGeneration";
import {
  create_dependencies,
  FIXTURE,
  type LineupGenerationTestDependencies,
} from "./fixtureLineupGeneration.test_support";
import {
  FIXTURE_LINEUP_GENERATION_EVENT,
  FIXTURE_LINEUP_GENERATION_MESSAGES,
} from "./FixtureLineupGenerationConstants";

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
): Promise<LineupGenerationResult> {
  return auto_generate_lineups_if_possible(
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
  );
}

function use_rules(strategy: string): void {
  mocks.get_player_rules_from_competition.mockResolvedValue({
    success: true,
    min_players: 1,
    max_players: 2,
    squad_generation_strategy: strategy,
  });
}

describe("auto_generate_lineups_if_possible failure handling", () => {
  beforeEach(() => {
    vi.spyOn(console, "debug").mockImplementation(() => {});
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("stops instead of falling back when the previous squad lookup fails", async () => {
    use_rules("previous_match");
    mocks.find_previous_lineup_for_team.mockResolvedValue({
      success: false,
      error: "Could not load the previous match squad. Please try again.",
    });
    const dependencies = create_dependencies();

    const result = await generate(dependencies);

    expect(result).toEqual({
      success: false,
      error_message:
        FIXTURE_LINEUP_GENERATION_MESSAGES.PREVIOUS_LINEUP_LOOKUP_FAILED,
      fix_suggestion: "",
    });
    expect(dependencies.membership.list).not.toHaveBeenCalled();
    expect(dependencies.lineup.create).not.toHaveBeenCalled();
  });

  it("reports a friendly message when memberships cannot be loaded", async () => {
    use_rules("first_available");
    const error_spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const dependencies = create_dependencies();
    dependencies.membership.list.mockResolvedValue({
      success: false,
      error: "db offline",
    });

    const result = await generate(dependencies);

    expect(result).toEqual({
      success: false,
      error_message: FIXTURE_LINEUP_GENERATION_MESSAGES.MEMBERSHIPS_LOAD_FAILED,
      fix_suggestion: "",
    });
    expect(error_spy).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        event: FIXTURE_LINEUP_GENERATION_EVENT.MEMBERSHIPS_LOAD_FAILED,
        technical_detail: "db offline",
      }),
    );
  });

  it("logs players that fail to load and keeps them as unknown entries", async () => {
    use_rules("first_available");
    const warn_spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const dependencies = create_dependencies();
    dependencies.player.get_by_id.mockResolvedValue({
      success: false,
      error: "missing",
    });

    const result = await generate(dependencies);

    expect(result.success).toBe(true);
    expect(warn_spy).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        event: FIXTURE_LINEUP_GENERATION_EVENT.PLAYER_LOAD_FAILED,
      }),
    );
  });
});
